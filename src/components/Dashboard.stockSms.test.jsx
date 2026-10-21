import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from './Dashboard';
import { sendSMS } from '../services/smsService';

jest.mock('../services/smsService', () => ({
  sendSMS: jest.fn(),
}));
jest.mock('./Charts', () => ({ FancyDonut: () => null }));
jest.mock('../utils/logger', () => ({
  __esModule: true,
  default: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

// Kupakia Dashboard mara ya kwanza kunaweza kuchelewa chini ya mzigo wa suite nzima.
jest.setTimeout(30000);

const LOW_PRODUCTS = [
  { name: 'Sukari', stock: 2 },
  { name: 'Mchele', stock: 4 },
];

// Builder inayoweza kuminyororwa na pia kusubiriwa (thenable), kama supabase-js.
const makeSupabase = ({ lowProducts = LOW_PRODUCTS } = {}) => {
  const inserts = [];
  const from = jest.fn((table) => {
    const state = { table, lowQuery: false };
    const result = () => {
      if (table === 'products' && state.lowQuery) return { data: lowProducts, error: null };
      return { data: [], count: 0, error: null };
    };
    const b = {
      select: jest.fn(() => b),
      eq: jest.fn(() => b),
      gt: jest.fn(() => b),
      gte: jest.fn(() => b),
      not: jest.fn(() => b),
      order: jest.fn(() => b),
      // `.lt('stock', n).order(...).limit(10)` ndiyo query ya SMS ya stock
      lt: jest.fn(() => { state.lowQuery = true; return b; }),
      limit: jest.fn(() => b),
      maybeSingle: jest.fn(() => Promise.resolve({ data: null })),
      insert: jest.fn((row) => { inserts.push({ table, row }); return Promise.resolve({ error: null }); }),
      then: (resolve, reject) => Promise.resolve(result()).then(resolve, reject),
    };
    return b;
  });
  return { supabase: { from }, inserts };
};

const shop = { id: 'shop-1', shop_name: 'Duka Langu', phone: '0754123456', owner_id: 'u1' };

const renderDashboard = (supabase, props = {}) =>
  render(
    <Dashboard supabase={supabase} currentShop={shop} isDarkMode={false} lang="sw" setActivePage={jest.fn()} {...props} />
  );

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

describe('Dashboard - SMS ya stock', () => {
  it('HAITUMI SMS ukurasa unapopakia wala unapofanya re-render', async () => {
    const { supabase } = makeSupabase();
    const { rerender } = renderDashboard(supabase);

    await screen.findByRole('button', { name: 'Tuma SMS ya Stock' });
    rerender(
      <Dashboard supabase={supabase} currentShop={shop} isDarkMode={false} lang="sw" setActivePage={jest.fn()} />
    );
    // Ruhusu effects zote zikamilike
    await new Promise((r) => setTimeout(r, 50));

    expect(sendSMS).not.toHaveBeenCalled();
  });

  it('hutuma SMS mara moja tu kwa kubonyeza kitufe na kurekodi kwenye sms_logs', async () => {
    sendSMS.mockResolvedValue({ success: true, data: { ok: true } });
    const { supabase, inserts } = makeSupabase();
    renderDashboard(supabase);

    fireEvent.click(await screen.findByRole('button', { name: 'Tuma SMS ya Stock' }));

    expect(await screen.findByText('SMS imetumwa (bidhaa 2).')).toBeInTheDocument();
    expect(sendSMS).toHaveBeenCalledTimes(1);
    const arg = sendSMS.mock.calls[0][0];
    expect(arg.to).toBe('0754123456');
    expect(arg.message).toContain('Sukari (2)');
    expect(arg.message).toContain('Mchele (4)');
    expect(inserts.find((i) => i.table === 'sms_logs').row).toMatchObject({
      shop_id: 'shop-1',
      type: 'low_stock',
      status: 'sent',
    });
  });

  it('hutumia kiwango cha low_stock_threshold kutoka kwenye mipangilio', async () => {
    localStorage.setItem('app_smsSettings', JSON.stringify({ low_stock_threshold: 3 }));
    sendSMS.mockResolvedValue({ success: true, data: {} });
    const { supabase } = makeSupabase();
    renderDashboard(supabase);

    fireEvent.click(await screen.findByRole('button', { name: 'Tuma SMS ya Stock' }));
    await waitFor(() => expect(sendSMS).toHaveBeenCalled());
    expect(sendSMS.mock.calls[0][0].message).toContain('chini ya 3');
  });

  it('haitumi SMS ikiwa hakuna bidhaa zilizo chini ya kiwango', async () => {
    const { supabase } = makeSupabase({ lowProducts: [] });
    renderDashboard(supabase);

    fireEvent.click(await screen.findByRole('button', { name: 'Tuma SMS ya Stock' }));

    expect(await screen.findByText('Hakuna bidhaa zilizo chini ya kiwango.')).toBeInTheDocument();
    expect(sendSMS).not.toHaveBeenCalled();
  });

  it('huonyesha kosa na haandiki log SMS ikishindwa kutumwa', async () => {
    sendSMS.mockResolvedValue({ success: false, error: 'boom' });
    const { supabase, inserts } = makeSupabase();
    renderDashboard(supabase);

    fireEvent.click(await screen.findByRole('button', { name: 'Tuma SMS ya Stock' }));

    expect(await screen.findByText('SMS imeshindwa kutumwa. Jaribu tena.')).toBeInTheDocument();
    expect(inserts.filter((i) => i.table === 'sms_logs')).toHaveLength(0);
  });

  it('huzima kitufe wakati wa kutuma (hakuna SMS mbili kwa kubonyeza mara mbili)', async () => {
    let resolveSms;
    sendSMS.mockImplementation(() => new Promise((r) => { resolveSms = r; }));
    const { supabase } = makeSupabase();
    renderDashboard(supabase);

    const btn = await screen.findByRole('button', { name: 'Tuma SMS ya Stock' });
    fireEvent.click(btn);
    const sending = await screen.findByRole('button', { name: 'Inatuma...' });
    expect(sending).toBeDisabled();
    fireEvent.click(sending);

    resolveSms({ success: true, data: {} });
    await screen.findByText('SMS imetumwa (bidhaa 2).');
    expect(sendSMS).toHaveBeenCalledTimes(1);
  });
});
