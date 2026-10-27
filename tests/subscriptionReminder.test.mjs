
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  subscriptionReminderStage,
  subscriptionReminderMessage,
  normalizedSmsPhone,
} from '../supabase/functions/_shared/subscriptionReminder.mjs';

const sub = {
  user_id: 'test-user',
  status: 'active',
  subscription_end: '2026-10-30T13:00:00Z',
};

const stageAt = (date) => subscriptionReminderStage(sub, date);

test('Kumbusho siku 7 kabla', () => {
  assert.equal(stageAt('2026-10-23T06:00:00Z')?.stage, '7d');
});

test('Kumbusho siku 3 kabla', () => {
  assert.equal(stageAt('2026-10-27T06:00:00Z')?.stage, '3d');
});

test('Kumbusho siku 1 kabla', () => {
  assert.equal(stageAt('2026-10-29T06:00:00Z')?.stage, '1d');
});

test('Hakuna SMS siku zisizolengwa', () => {
  assert.equal(stageAt('2026-10-28T06:00:00Z'), null);
});

test('SMS baada ya subscription kuisha', () => {
  assert.equal(stageAt('2026-10-30T13:01:00Z')?.stage, 'expired');
});

test('Hakuna SMS kwa subscription ya zamani sana', () => {
  assert.equal(stageAt('2026-11-04T12:00:00Z'), null);
});

test('Trial SMS zimezimwa', () => {
  const trial = {
    ...sub,
    status: 'trial',
    trial_end: sub.subscription_end,
  };

  assert.equal(
    subscriptionReminderStage(trial, '2026-10-27T06:00:00Z'),
    null
  );
});

test('Namba za Tanzania zinarekebishwa', () => {
  assert.equal(normalizedSmsPhone('0754 123 456'), '255754123456');
  assert.equal(normalizedSmsPhone('+255754123456'), '255754123456');
  assert.equal(normalizedSmsPhone('abc'), null);
});

test('SMS ina jina la duka na tarehe sahihi', () => {
  const sms = subscriptionReminderMessage({
    shopName: 'DUKA LANGU',
    ...stageAt('2026-10-27T06:00:00Z'),
  });

  assert.match(sms, /DUKA LANGU/);
  assert.match(sms, /30\/10\/2026/);
  assert.ok(sms.length <= 160);
});
