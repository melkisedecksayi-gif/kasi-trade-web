import { readSaleReceiptSmsEnabled, saveSaleReceiptSmsEnabled } from './shopSmsPreferences';

const fakeReader = (data, error = null) => ({
  from: jest.fn(() => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data, error }) }) }),
  })),
});

describe('Shop receipt SMS preferences (fail closed)', () => {
  test('missing row means OFF', async () => {
    expect(await readSaleReceiptSmsEnabled(fakeReader(null), 'shop-1')).toBe(false);
  });

  test('only an explicit true enables receipts', async () => {
    expect(await readSaleReceiptSmsEnabled(fakeReader({ sale_receipts_enabled: true }), 'shop-1')).toBe(true);
    expect(await readSaleReceiptSmsEnabled(fakeReader({ sale_receipts_enabled: false }), 'shop-1')).toBe(false);
  });

  test('query failure throws, so caller must skip SMS', async () => {
    await expect(readSaleReceiptSmsEnabled(fakeReader(null, { message: 'RLS/DB unavailable' }), 'shop-1'))
      .rejects.toEqual({ message: 'RLS/DB unavailable' });
  });

  test('missing shop id is OFF', async () => {
    expect(await readSaleReceiptSmsEnabled(fakeReader(null), '')).toBe(false);
  });

  test('writes a shop-scoped ON/OFF choice', async () => {
    let savedPayload;
    const client = { from: () => ({
      upsert: (payload, options) => {
        savedPayload = payload;
        expect(options).toEqual({ onConflict: 'shop_id' });
        return { select: () => ({ single: async () => ({ data: payload, error: null }) }) };
      },
    }) };
    expect(await saveSaleReceiptSmsEnabled(client, 'shop-2', true)).toBe(true);
    expect(savedPayload).toEqual({ shop_id: 'shop-2', sale_receipts_enabled: true });
    expect(await saveSaleReceiptSmsEnabled(client, 'shop-2', false)).toBe(false);
  });

  test('failed save is not shown as successful', async () => {
    const client = { from: () => ({
      upsert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'not owner' } }) }) }),
    }) };
    await expect(saveSaleReceiptSmsEnabled(client, 'shop-3', true)).rejects.toEqual({ message: 'not owner' });
  });
});
