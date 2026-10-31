const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeSearchValue,
  buildTransferSearchText,
  matchesTransferSearch,
  matchesTransferListScope
} = require('../transfer-search.js');

const transfer = {
  ID: 'TR-2048',
  Nome: 'João da Conceição',
  Reserva: 'CB 9831',
  Telefone: '+55 22 99999-0000',
  'Data Viagem': '2026-10-30T14:30:00.000Z',
  LocalEmbarque: 'Aeroporto Internacional do Galeão',
  Destino: 'Casas Brancas Boutique Hotel & Spa',
  Motorista: 'Márcia Gonçalves',
  Voo: 'G3 1234',
  Veículo: 'Citroën Jumpy'
};

test('normaliza maiúsculas, acentos e espaços', () => {
  assert.equal(normalizeSearchValue('  JOÃO   Gonçalves  '), 'joao goncalves');
});

test('indexa os campos relevantes do transfer', () => {
  const text = buildTransferSearchText(transfer);
  ['joao', '9831', 'galeao', 'casas brancas', 'marcia', '30/10/2026', 'tr-2048'].forEach(value => {
    assert.ok(text.includes(value), `esperava encontrar ${value}`);
  });
});

test('localiza sem diferenciar maiúsculas ou acentos', () => {
  assert.equal(matchesTransferSearch(transfer, 'JOAO'), true);
  assert.equal(matchesTransferSearch(transfer, 'marcia goncalves'), true);
  assert.equal(matchesTransferSearch(transfer, 'citroen'), true);
});

test('aceita vários termos mesmo quando estão em campos diferentes', () => {
  assert.equal(matchesTransferSearch(transfer, 'joao 9831 galeao'), true);
  assert.equal(matchesTransferSearch(transfer, '30/10/2026 g3'), true);
  assert.equal(matchesTransferSearch(transfer, 'joao santos'), false);
});

test('consulta vazia não elimina nenhum transfer', () => {
  assert.equal(matchesTransferSearch(transfer, '   '), true);
});

test('busca por nome ou reserva ignora o mês e ano selecionados', () => {
  const dataTransfer = new Date(2026, 9, 30);
  assert.equal(matchesTransferListScope(transfer, 'joao', dataTransfer, 2025, 0), true);
  assert.equal(matchesTransferListScope(transfer, '9831', dataTransfer, 2025, 0), true);
});

test('sem busca, mantém o filtro de mês e ano', () => {
  const dataTransfer = new Date(2026, 9, 30);
  assert.equal(matchesTransferListScope(transfer, '', dataTransfer, 2026, 9), true);
  assert.equal(matchesTransferListScope(transfer, '', dataTransfer, 2025, 0), false);
});

test('busca global ainda rejeita transfers que não correspondem ao termo', () => {
  assert.equal(matchesTransferListScope(transfer, 'reserva-inexistente', new Date(2026, 9, 30), 2025, 0), false);
});
