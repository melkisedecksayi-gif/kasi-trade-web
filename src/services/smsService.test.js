import { sendSMS, sendReceiptSMS, sendOTPSMS, sendWelcomeSMS, sendPasswordResetOTPSMS, sendBulkSMS } from './smsService';
import { supabase } from '../supabaseClient';

jest.mock('./posCheckout', () => ({ newCheckoutRequestId: () => '550e8400-e29b-41d4-a716-446655440000' }));
jest.mock('../supabaseClient', () => ({ supabase: { functions: { invoke: jest.fn() } } }));
jest.mock('../utils/logger', () => ({ __esModule: true, default: {error: jest.fn()} }));
const invoke = supabase.functions.invoke;
const shopId = '550e8400-e29b-41d4-a716-446655440001';
beforeEach(() => invoke.mockReset());

test('unauthorized custom / anonymous OTP are disabled without network', async () => {
  expect((await sendSMS({to:'0712345678',message:'hi'})).success).toBe(false);
  expect((await sendWelcomeSMS({phone:'0712345678'})).success).toBe(false);
  expect((await sendOTPSMS({phone:'0712345678'})).success).toBe(false);
  expect((await sendPasswordResetOTPSMS({phone:'0712345678'})).success).toBe(false);
  expect(invoke).not.toHaveBeenCalled();
});

test('bulk customer marketing disabled until consent exists', async () => {
  const result = await sendBulkSMS({recipients:['0712345678','0722345678'],message:'Offer'});
  expect(result).toHaveLength(2);
  expect(result.every(x => x.success === false)).toBe(true);
  expect(invoke).not.toHaveBeenCalled();
});

test('report must have shop ID, purpose, request key', async () => {
  invoke.mockResolvedValue({data:{success:true,status:'accepted'}, error:null});
  const res = await sendSMS({to:'0712345678',message:'Report',shopId,purpose:'report'});
  expect(res.success).toBe(true);
  expect(invoke).toHaveBeenCalledWith('send-sms', { body: expect.objectContaining({
    kind:'custom', shop_id:shopId, purpose:'report', to:'255712345678',
    request_key:'550e8400-e29b-41d4-a716-446655440000'
  }) });
});

test('receipt request sends sale ID, not an arbitrary SMS body', async () => {
  invoke.mockResolvedValue({data:{success:true,status:'accepted'},error:null});
  const res = await sendReceiptSMS({to:'0754123456',shopId,saleRequestId:'550e8400-e29b-41d4-a716-446655440002'});
  expect(res.success).toBe(true);
  const payload = invoke.mock.calls[0][1].body;
  expect(payload.kind).toBe('receipt');
  expect(payload.shop_id).toBe(shopId);
  expect(payload.request_key).toBe('550e8400-e29b-41d4-a716-446655440002');
  expect(payload).not.toHaveProperty('message');
});

test('missing explicit success = failure; never assume HTTP 200 accepted', async () => {
  invoke.mockResolvedValue({data:{status:'unknown'},error:null});
  const res = await sendSMS({to:'0754123456',message:'Report',shopId,purpose:'report'});
  expect(res.success).toBe(false);
});
