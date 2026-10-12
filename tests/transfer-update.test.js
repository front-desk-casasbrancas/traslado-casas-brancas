const test = require('node:test');
const assert = require('node:assert/strict');
const { assertSuccess, persistUpdate } = require('../transfer-update.js');

test('aceita somente uma confirmação positiva do backend', () => {
  assert.equal(assertSuccess({ success: true }).success, true);
  assert.throws(() => assertSuccess({ ok: false, error: 'agenda indisponível' }), /agenda indisponível/);
  assert.throws(() => assertSuccess({}), /não confirmou/);
  assert.throws(() => assertSuccess(null), /não confirmou/);
});

test('envia o update de cancelamento com o contrato esperado', async () => {
  let payload;
  const postApi = async value => { payload = value; return { success: true }; };

  await persistUpdate(postApi, 'transfer-1', { status: 'cancelled' });

  assert.deepEqual(payload, { action: 'update', id: 'transfer-1', status: 'cancelled' });
});

test('propaga a falha do Calendar para impedir atualização otimista da tela', async () => {
  const postApi = async () => ({ ok: false, error: 'Não foi possível remover o evento da agenda' });

  await assert.rejects(() => persistUpdate(postApi, 'transfer-1', { status: 'cancelled' }), /remover o evento/);
});
