const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'fechamento-buzios-technology.gs'), 'utf8');
const sandbox = { Date, Math, Number, String, Object, isFinite };
vm.runInNewContext(source, sandbox);

const headers = ['ID', 'Data Viagem', 'Valor Total', 'Pagamento', 'Status'];

test('calcula 5% separadamente e não herda a taxa de 6% do hotel', () => {
  const rows = [
    ['1', '2026-10-03', 7730, 'Cartão de crédito (diretamente ao motorista)', 'completed'],
    ['2', '2026-10-31', 5170, 'PIX', 'confirmed'],
    ['3', '2026-10-24', 5000, 'Dinheiro', 'completed'],
    ['4', '2026-10-18', 990, 'Cartão de crédito (diretamente ao motorista)', 'cancelled']
  ];

  const result = sandbox.btCalcularFechamento_(headers, rows, '2026-10');

  assert.equal(result.quantidade, 3);
  assert.equal(result.totalTransfers, 17900);
  assert.equal(result.comissao, 895);
  assert.equal(result.taxaCartaoAplicada, 0);
});

test('mantém o vencimento excepcional de outubro de 2026 em 11/11/2026', () => {
  assert.equal(sandbox.btVencimento_('2026-10'), '11/11/2026');
});

test('usa dia 10 do mês seguinte nos fechamentos regulares', () => {
  assert.equal(sandbox.btVencimento_('2026-11'), '10/12/2026');
  assert.equal(sandbox.btVencimento_('2026-12'), '10/01/2027');
});

test('seleciona o mês anterior para a execução do dia 05', () => {
  assert.equal(sandbox.btPeriodoAnterior_(new Date(2026, 10, 5)), '2026-10');
  assert.equal(sandbox.btPeriodoAnterior_(new Date(2027, 0, 5)), '2026-12');
});

test('separa o resumo por forma de pagamento sem expor dados de hóspedes', () => {
  const rows = [
    ['1', '2026-10-03', 100, 'PIX', 'completed'],
    ['2', '2026-10-04', 200, 'Dinheiro', 'completed']
  ];
  const result = sandbox.btCalcularFechamento_(headers, rows, '2026-10');
  const message = sandbox.btMontarMensagem_(result);

  assert.equal(result.porPagamento.PIX.total, 100);
  assert.match(message.assunto, /vencimento 11\/11\/2026/);
  assert.doesNotMatch(message.texto, /\bID\b|hóspede/i);
});

test('aceita somente um endereço confirmado para o Marcelo', () => {
  const props = value => ({ getProperty: () => value });

  assert.equal(sandbox.btLerEmailMarcelo_(props('marcelo@example.com')), 'marcelo@example.com');
  assert.throws(() => sandbox.btLerEmailMarcelo_(props('')), /EMAIL_MARCELO/);
  assert.throws(() => sandbox.btLerEmailMarcelo_(props('marcelo@example.com,financeiro@example.com')), /sem cópias/);
});

