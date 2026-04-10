import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installBrowserGlobals } from './setup.js';
installBrowserGlobals();

const { RULES, validateForm } = await import('../src/services/ValidationService.js');

test('RULES.required: empty string fails', () => {
  assert.equal(RULES.required()(''), 'Bu alan zorunludur.');
  assert.equal(RULES.required()('   '), 'Bu alan zorunludur.');
  assert.equal(RULES.required()(null), 'Bu alan zorunludur.');
  assert.equal(RULES.required()(undefined), 'Bu alan zorunludur.');
});

test('RULES.required: non-empty passes', () => {
  assert.equal(RULES.required()('Ali'), null);
  assert.equal(RULES.required()('0'), null);
});

test('RULES.email: valid email passes', () => {
  assert.equal(RULES.email()('user@example.com'), null);
  assert.equal(RULES.email()('yilmaz.mutlu@alparslan.edu.tr'), null);
});

test('RULES.email: invalid email fails', () => {
  assert.ok(RULES.email()('not-an-email'));
  assert.ok(RULES.email()('@bad'));
  assert.ok(RULES.email()('foo@'));
  assert.ok(RULES.email()('a b@c.d'));
});

test('RULES.email: empty passes (use required() to enforce presence)', () => {
  assert.equal(RULES.email()(''), null);
  assert.equal(RULES.email()(null), null);
});

test('RULES.minLength', () => {
  const rule = RULES.minLength(5);
  assert.ok(rule('abc'));
  assert.equal(rule('abcde'), null);
  assert.equal(rule('abcdef'), null);
  assert.equal(rule(''), null); // empty passes
});

test('RULES.maxLength', () => {
  const rule = RULES.maxLength(5);
  assert.equal(rule('abc'), null);
  assert.equal(rule('abcde'), null);
  assert.ok(rule('abcdef'));
});

test('RULES.phoneTR: accepts 10-13 digits', () => {
  assert.equal(RULES.phoneTR()('5551234567'), null);       // 10
  assert.equal(RULES.phoneTR()('05551234567'), null);      // 11
  assert.equal(RULES.phoneTR()('+90 555 123 45 67'), null); // 12 digits after strip
  assert.ok(RULES.phoneTR()('123'));
  assert.ok(RULES.phoneTR()('12345678901234567890'));
});

test('RULES.tcKimlik: reject non-11-digit', () => {
  assert.ok(RULES.tcKimlik()('123'));
  assert.ok(RULES.tcKimlik()('12345678'));
  assert.ok(RULES.tcKimlik()('abcdefghijk'));
});

test('RULES.tcKimlik: reject leading zero', () => {
  assert.ok(RULES.tcKimlik()('01234567890'));
});

test('RULES.tcKimlik: valid TC Kimlik (MoE algorithm) passes', () => {
  // A test vector that satisfies the MoE checksum:
  //   d[0..8] = 1,2,3,4,5,6,7,8,9
  //   sumOdd  = 1+3+5+7+9 = 25
  //   sumEven = 2+4+6+8   = 20
  //   d[9]    = (25*7 - 20) mod 10 = 155 mod 10 = 5
  //   d[10]   = (25 + 20 + 5) mod 10 = 50 mod 10 = 0
  assert.equal(RULES.tcKimlik()('12345678950'), null);
});

test('RULES.tcKimlik: invalid checksum fails', () => {
  assert.ok(RULES.tcKimlik()('12345678901'));
});

test('RULES.checked', () => {
  assert.equal(RULES.checked()(true), null);
  assert.ok(RULES.checked()(false));
  assert.ok(RULES.checked()(null));
});

test('RULES.match', () => {
  const rule = RULES.match('pw');
  assert.equal(rule('abc', { pw: 'abc' }), null);
  assert.ok(rule('abc', { pw: 'xyz' }));
});

test('validateForm: returns aggregated result', () => {
  const { valid, errors } = validateForm(
    { name: '', email: 'bad', phone: '5551234567', tc: '12345678950' },
    {
      name:  [RULES.required()],
      email: [RULES.email()],
      phone: [RULES.phoneTR()],
      tc:    [RULES.tcKimlik()],
    }
  );
  assert.equal(valid, false);
  assert.ok(errors.name);
  assert.ok(errors.email);
  assert.equal(errors.phone, undefined);
  assert.equal(errors.tc, undefined);
});

test('validateForm: all-valid returns valid:true', () => {
  const { valid, errors } = validateForm(
    { name: 'Ali', email: 'a@b.com' },
    { name: [RULES.required()], email: [RULES.email()] }
  );
  assert.equal(valid, true);
  assert.deepEqual(errors, {});
});

test('validateForm: short-circuits on first failing rule per field', () => {
  const { errors } = validateForm(
    { name: '' },
    { name: [RULES.required(), RULES.minLength(5)] }
  );
  assert.equal(errors.name, 'Bu alan zorunludur.');
});
