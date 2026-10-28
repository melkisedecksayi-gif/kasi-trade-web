import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyProviderResponse, singleSegmentGsm, validSmsKind } from '../supabase/functions/_shared/smsSafety.mjs';

test('HTTP 200 without provider acknowledgement is unknown', () => {
  assert.equal(classifyProviderResponse(true, {}), 'unknown');
  assert.equal(classifyProviderResponse(true, { message: 'OK' }), 'unknown');
  assert.equal(classifyProviderResponse(true, { success: false }), 'failed');
  assert.equal(classifyProviderResponse(true, { status: 'failed', success: true }), 'failed');
  assert.equal(classifyProviderResponse(true, { success: true }), 'accepted');
  assert.equal(classifyProviderResponse(true, { data: { status: 'queued' } }), 'accepted');
  assert.equal(classifyProviderResponse(false, { success: true }), 'unknown');
});

test('one segment: ASCII and GSM, not emoji or huge messages', () => {
  assert.equal(singleSegmentGsm('Salamu malume!'), true);
  assert.equal(singleSegmentGsm('A'.repeat(160)), true);
  assert.equal(singleSegmentGsm('A'.repeat(161)), false);
  assert.equal(singleSegmentGsm('Habari 😁'), false);
  assert.equal(singleSegmentGsm(''), false);
  assert.equal(singleSegmentGsm('^'.repeat(81)), false);
});

test('anonymous/legacy kinds are disabled', () => {
  assert.equal(validSmsKind('otp'), false);
  assert.equal(validSmsKind('welcome'), false);
  assert.equal(validSmsKind('password_reset'), false);
  assert.equal(validSmsKind('custom'), true);
  assert.equal(validSmsKind('receipt'), true);
});
