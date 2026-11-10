const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'escala-marcelo.gs'), 'utf8');
const sandbox = { Date, Math, String, Object };
vm.runInNewContext(source, sandbox);

function props(value) {
  return {
    getProperty: () => value,
    setProperty: () => {}
  };
}

test('rejeita a chave pendente e aceita somente a chave configurada', () => {
  sandbox.PropertiesService = { getScriptProperties: () => props('CONFIGURAR_ANTES_DE_USAR') };
  assert.throws(() => sandbox.autenticarEscalaMarcelo_('CONFIGURAR_ANTES_DE_USAR'), /não autorizado/);

  sandbox.PropertiesService = { getScriptProperties: () => props('senha-exclusiva-segura') };
  assert.equal(sandbox.autenticarEscalaMarcelo_('senha-exclusiva-segura'), true);
  assert.throws(() => sandbox.autenticarEscalaMarcelo_('senha-incorreta'), /não autorizado/);
});

test('cria o novo campo de propriedade sem inventar uma senha válida', () => {
  let salvo;
  sandbox.PropertiesService = {
    getScriptProperties: () => ({
      getProperty: () => '',
      setProperty: (nome, valor) => { salvo = { nome, valor }; }
    })
  };
  const result = sandbox.criarCampoChaveEscalaMarcelo();
  assert.equal(result.criado, true);
  assert.deepEqual(salvo, { nome: 'CHAVE_MARCELO', valor: 'CONFIGURAR_ANTES_DE_USAR' });
});

test('atualiza somente a coluna Motorista do transfer autorizado', () => {
  let escrito;
  const valores = [
    ['ID', 'Motorista', 'ConfirmadoEmpresa'],
    ['transfer-ficticio', '', '']
  ];
  const aba = {
    getDataRange: () => ({ getValues: () => valores }),
    getRange: (linha, coluna) => ({ setValue: valor => { escrito = { linha, coluna, valor }; } })
  };
  sandbox.PropertiesService = { getScriptProperties: () => props('senha-exclusiva-segura') };
  sandbox.SpreadsheetApp = { getActiveSpreadsheet: () => ({ getSheetByName: () => aba }) };

  const result = sandbox.atualizarMotoristaEscalaMarcelo_('senha-exclusiva-segura', 'transfer-ficticio', 'Marcelo');
  assert.equal(result.ok, true);
  assert.deepEqual(escrito, { linha: 2, coluna: 2, valor: 'Marcelo' });
});
