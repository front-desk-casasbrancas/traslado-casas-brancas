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
    ['1', '2026-10-03', 1000, 'Cartão de crédito (diretamente ao motorista)', 'completed'],
    ['2', '2026-10-31', 2000, 'PIX', 'confirmed'],
    ['3', '2026-10-24', 3000, 'Dinheiro', 'completed'],
    ['4', '2026-10-18', 400, 'Cartão de crédito (diretamente ao motorista)', 'cancelled']
  ];

  const result = sandbox.btCalcularFechamento_(headers, rows, '2026-10');

  assert.equal(result.quantidade, 3);
  assert.equal(result.totalTransfers, 6000);
  assert.equal(result.comissao, 300);
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

test('não expõe a comissão da Búzios Technology nas telas do Casas Brancas', () => {
  const arquivosCompartilhados = ['financeiro.html', 'dashboard.html', 'menu.html'];
  const telas = arquivosCompartilhados
    .map(file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8'))
    .join('\n');

  assert.doesNotMatch(telas, /Búzios Technology|BUZIOS_TECH|percentualComissao/i);
});

test('não grava o fechamento confidencial na planilha compartilhada', () => {
  assert.doesNotMatch(source, /appendRow|setValue|setValues|insertSheet|getSheetByName\(['"]Pagamentos/i);
});

test('a escala coloca os 5% no topo sem calculá-los no navegador', () => {
  const escala = fs.readFileSync(path.join(__dirname, '..', 'motorista.html'), 'utf8');

  assert.match(escala, /resumoComissaoBuziosTechnology/);
  assert.match(escala, /kMarcelo:\s*window\.CHAVE/);
  assert.match(escala, /Acesso restrito/);
  assert.doesNotMatch(escala, /prompt\('Senha exclusiva do Marcelo/);
  assert.doesNotMatch(escala, /PCT_BUZIOS|\*\s*0\.05|0\.05\s*\*/);
});

test('o backend só devolve a comissão com a chave exclusiva do Marcelo', () => {
  const rows = [
    headers,
    ['1', '2026-10-03', 1000, 'PIX', 'completed']
  ];
  sandbox.PropertiesService = {
    getScriptProperties: () => ({ getProperty: name => name === 'CHAVE_MARCELO' ? 'segredo-exclusivo' : '' })
  };
  sandbox.SpreadsheetApp = {
    getActiveSpreadsheet: () => ({
      getSheetByName: () => ({ getDataRange: () => ({ getValues: () => rows }) })
    })
  };

  assert.throws(
    () => sandbox.resumoComissaoBuziosTechnologyParaMarcelo_('senha-errada', ['2026-10']),
    /não autorizado/
  );
  const result = sandbox.resumoComissaoBuziosTechnologyParaMarcelo_('segredo-exclusivo', ['2026-10']);
  assert.equal(result[0].comissao, 50);
  assert.deepEqual(Object.keys(result[0]).sort(), ['comissao', 'periodo']);
});

test('agenda o lembrete no próximo dia 09', () => {
  const dezembro = sandbox.btProximoDia09_(new Date(2026, 10, 10));
  assert.equal(dezembro.getFullYear(), 2026);
  assert.equal(dezembro.getMonth(), 11);
  assert.equal(dezembro.getDate(), 9);

  const mesmoMes = sandbox.btProximoDia09_(new Date(2026, 10, 5));
  assert.equal(mesmoMes.getMonth(), 10);
  assert.equal(mesmoMes.getDate(), 9);
});

test('o lembrete da agenda é discreto e não expõe valores confidenciais', () => {
  const lembrete = sandbox.btDefinicaoLembretePagamento_();
  assert.equal(lembrete.titulo, 'Revisar pagamento das comissões');
  assert.match(lembrete.descricao, /amanhã, dia 10/);
  assert.doesNotMatch(lembrete.titulo + ' ' + lembrete.descricao, /Búzios|Technology|5%|R\$/i);
});
