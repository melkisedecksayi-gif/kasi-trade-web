import { sendSMS, sendOTPSMS, sendWelcomeSMS, sendPasswordResetOTPSMS, sendBulkSMS } from './smsService';
import { supabase } from '../supabaseClient';
jest.mock('./posCheckout', () => {
  let counter = 0;

  return {
    newCheckoutRequestId: jest.fn(() => {
      counter += 1;
      return `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`;
    })
  };
});
jest.mock('../supabaseClient', () => ({
  supabase: { functions: { invoke: jest.fn() } },
}));
jest.mock('../utils/logger', () => ({
  __esModule: true,
  default: { warn: jest.fn(), error: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

const invoke = supabase.functions.invoke;
let phoneCounter = 0;
// Namba ya kipekee kwa kila test ili rate limiter ya client isiingiliane
const uniquePhone = () => `0754${String(100000 + phoneCounter++)}`;

const httpError = (status, body) => ({
  data: null,
  error: { message: 'Edge Function returned a non-2xx status code', context: { status, json: () => Promise.resolve(body) } },
});

// Jest ya mradi huu haina advanceTimersByTimeAsync: sogeza timer kisha toa microtasks.
const tick = async (ms) => {
  jest.advanceTimersByTime(ms);
  for (let i = 0; i < 30; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.resolve();
  }
};

beforeEach(() => {
  invoke.mockReset();
  jest.useRealTimers();
});

describe('smsService - hutumia Edge Function, si API key', () => {
  it('code ya frontend haina API key wala URL ya mtoa huduma', () => {
    // eslint-disable-next-line global-require
    const src = require('fs').readFileSync(require.resolve('./smsService'), 'utf8');
    expect(src).not.toMatch(/zs_[0-9a-f]{20,}/);
    expect(src).not.toMatch(/meseji\.co\.tz/);
    expect(src).not.toMatch(/x-api-key/i);
  });

  it('sendSMS hutuma kind "custom" kwa send-sms na namba isiyo na +', async () => {
    invoke.mockResolvedValue({ data: { success: true, data: { id: 1 } }, error: null });
    const res = await sendSMS({ to: '0754123456', message: 'Habari' });

    expect(res).toEqual({ success: true, data: { id: 1 } });
    expect(invoke).toHaveBeenCalledWith('send-sms', {
      body: { kind: 'custom', to: '255754123456', message: 'Habari' },
    });
  });

it('sendSMS hutuma requestKey kama request_key kwa Edge Function', async () => {
  const requestKey = '550e8400-e29b-41d4-a716-446655440000';

  invoke.mockResolvedValue({
    data: { success: true },
    error: null
  });

  await sendSMS({
    to: uniquePhone(),
    message: 'Risiti ya KasiTrade',
    requestKey
  });

  expect(invoke).toHaveBeenCalledWith(
    'send-sms',
    {
      body: expect.objectContaining({
        kind: 'custom',
        message: 'Risiti ya KasiTrade',
        request_key: requestKey
      })
    }
  );
});

  it('sendSMS hupuuza sender/apiKey kutoka kwa mwito (hazitumwi)', async () => {
    invoke.mockResolvedValue({ data: { success: true, data: {} }, error: null });
    await sendSMS({ to: uniquePhone(), message: 'x', apiKey: 'secret', sender: 'Evil' });
    const body = invoke.mock.calls[0][1].body;
    expect(body).not.toHaveProperty('apiKey');
    expect(body).not.toHaveProperty('sender');
  });

  it('hukataa namba isiyo sahihi bila kuita seva', async () => {
    const res = await sendSMS({ to: '', message: 'x' });
    expect(res.success).toBe(false);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('hurudisha ujumbe wa seva kwa makosa ya HTTP', async () => {
    invoke.mockResolvedValue(httpError(429, { success: false, error: 'Jumbe nyingi mno kwa namba hii. Subiri kidogo.' }));
    const res = await sendSMS({ to: uniquePhone(), message: 'x' });
    expect(res).toMatchObject({ success: false, error: 'Jumbe nyingi mno kwa namba hii. Subiri kidogo.', retryable: false });
  });

  it('hurudisha kosa ikiwa seva inajibu success:false', async () => {
    invoke.mockResolvedValue({ data: { success: false, error: 'imekataliwa' }, error: null });
    const res = await sendSMS({ to: uniquePhone(), message: 'x' });
    expect(res).toMatchObject({ success: false, error: 'imekataliwa' });
  });

  it('hushika kosa la mtandao bila kutupa', async () => {
    invoke.mockRejectedValue(new Error('Failed to fetch'));
    const res = await sendSMS({ to: uniquePhone(), message: 'x' });
    expect(res).toMatchObject({ success: false, error: 'Failed to fetch', retryable: false });
  });
});

describe('smsService - OTP / welcome / password reset (seva inatengeneza ujumbe)', () => {
  beforeEach(() => invoke.mockResolvedValue({ data: { success: true, data: {} }, error: null }));

  it('sendOTPSMS hutuma kind "otp" na code + lang, bila maandishi ya ujumbe', async () => {
    await sendOTPSMS({ phone: uniquePhone(), code: '123456', lang: 'en' });
    const body = invoke.mock.calls[0][1].body;
    expect(body).toMatchObject({ kind: 'otp', code: '123456', lang: 'en' });
    expect(body).not.toHaveProperty('message');
  });

  it('sendWelcomeSMS hutuma kind "welcome" na businessName', async () => {
    await sendWelcomeSMS({ phone: uniquePhone(), businessName: 'Duka la Juma', lang: 'sw' });
    expect(invoke.mock.calls[0][1].body).toMatchObject({ kind: 'welcome', businessName: 'Duka la Juma', lang: 'sw' });
  });

  it('sendPasswordResetOTPSMS hutuma kind "password_reset"', async () => {
    await sendPasswordResetOTPSMS({ phone: uniquePhone(), code: '654321' });
    expect(invoke.mock.calls[0][1].body).toMatchObject({ kind: 'password_reset', code: '654321', lang: 'sw' });
  });

  it('hukataa bila namba ya simu', async () => {
    expect(await sendOTPSMS({ phone: '', code: '123456' })).toMatchObject({ success: false });
    expect(invoke).not.toHaveBeenCalled();
  });

  it('HAIRUDII ombi likikataliwa na seva kwa 4xx (haichomi kikomo)', async () => {
    invoke.mockResolvedValue(httpError(429, { error: 'Jumbe nyingi' }));
    const res = await sendOTPSMS({ phone: uniquePhone(), code: '123456' });
    expect(res.success).toBe(false);
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('HAIRUDII kutuma SMS baada ya kosa la seva (5xx)', async () => {
    jest.useFakeTimers();
    invoke.mockResolvedValue(httpError(502, { error: 'Huduma ya SMS haipatikani' }));
    const promise = sendOTPSMS({ phone: uniquePhone(), code: '123456' });
    for (let i = 0; i < 5; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await tick(3000);
    }
    const res = await promise;
    expect(res.success).toBe(false);
    expect(invoke).toHaveBeenCalledTimes(1);
  });
});

describe('smsService - sendBulkSMS', () => {
  it('hutuma kila mpokeaji kama "custom" na kurudisha matokeo ya kila mmoja', async () => {
    jest.useFakeTimers();
    invoke.mockResolvedValue({ data: { success: true, data: {} }, error: null });
    const a = uniquePhone();
    const b = uniquePhone();
    const promise = sendBulkSMS({ recipients: [a, b], message: 'Ofa' });
    for (let i = 0; i < 4; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await tick(500);
    }
    const results = await promise;

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.success)).toBe(true);
    expect(invoke).toHaveBeenCalledTimes(2);
    expect(invoke.mock.calls.every((c) => c[1].body.kind === 'custom' && c[1].body.message === 'Ofa')).toBe(true);
  });
});
