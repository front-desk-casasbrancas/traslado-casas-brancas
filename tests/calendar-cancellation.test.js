const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'calendar-cancellation.gs'), 'utf8');
const sandbox = {};
vm.runInNewContext(source, sandbox);
const cancel = sandbox.cancelarEventoDoTransfer_;

function sheetRange() {
  let cleared = false;
  return {
    sheet: { getRange: () => ({ clearContent: () => { cleared = true; } }) },
    wasCleared: () => cleared
  };
}

test('exclui o evento e só então limpa EventoID', () => {
  const range = sheetRange();
  let deleted = false;
  const event = { deleteEvent: () => { deleted = true; } };
  const calendar = { getId: () => 'principal', getEventById: () => event };

  const result = cancel([calendar], 'event-1', range.sheet, 2, 22);

  assert.equal(deleted, true);
  assert.equal(range.wasCleared(), true);
  assert.equal(result.deleted, true);
});

test('preserva EventoID quando o Calendar falha ao excluir', () => {
  const range = sheetRange();
  const calendar = {
    getId: () => 'principal',
    getEventById: () => ({ deleteEvent: () => { throw new Error('quota'); } })
  };

  assert.throws(() => cancel([calendar], 'event-1', range.sheet, 2, 22), /Falha ao excluir/);
  assert.equal(range.wasCleared(), false);
});

test('procura também na agenda padrão antes de concluir que o evento sumiu', () => {
  const range = sheetRange();
  let deleted = false;
  const configured = { getId: () => 'configurada', getEventById: () => null };
  const fallback = {
    getId: () => 'padrao',
    getEventById: () => ({ deleteEvent: () => { deleted = true; } })
  };

  const result = cancel([configured, fallback], 'event-antigo', range.sheet, 2, 22);

  assert.equal(deleted, true);
  assert.equal(result.reason, 'excluido');
});

test('não altera a planilha quando uma busca no Calendar falha', () => {
  const range = sheetRange();
  const calendar = { getId: () => 'principal', getEventById: () => { throw new Error('temporário'); } };

  assert.throws(() => cancel([calendar], 'event-1', range.sheet, 2, 22), /Falha ao localizar/);
  assert.equal(range.wasCleared(), false);
});
