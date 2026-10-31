(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TransferSearch = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var SEARCH_FIELDS = [
    'Nome', 'Reserva', 'Telefone', 'Contato', 'Email',
    'LocalEmbarque', 'Local de embarque', 'Destino', 'Endereço', 'Endereco',
    'Motorista', 'Data Viagem', 'Voo', 'Cia Aérea', 'Cia Aerea',
    'Veículo', 'Sentido', 'ID'
  ];

  function normalizeSearchValue(value) {
    return String(value == null ? '' : value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function dateSearchValues(value) {
    var raw = String(value == null ? '' : value);
    var match = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return raw;
    return [raw, match[1] + '-' + match[2] + '-' + match[3], match[3] + '/' + match[2] + '/' + match[1], match[3] + '-' + match[2] + '-' + match[1]].join(' ');
  }

  function buildTransferSearchText(transfer) {
    transfer = transfer || {};
    return normalizeSearchValue(SEARCH_FIELDS.map(function (field) {
      var value = transfer[field];
      return field === 'Data Viagem' ? dateSearchValues(value) : value;
    }).join(' '));
  }

  function matchesTransferSearch(transfer, query) {
    var terms = normalizeSearchValue(query).split(' ').filter(Boolean);
    if (!terms.length) return true;
    var target = buildTransferSearchText(transfer);
    return terms.every(function (term) { return target.indexOf(term) !== -1; });
  }

  function matchesTransferListScope(transfer, query, transferDate, selectedYear, selectedMonth) {
    if (!matchesTransferSearch(transfer, query)) return false;
    if (normalizeSearchValue(query)) return true;
    if (!transferDate || isNaN(transferDate.getTime())) return true;
    return transferDate.getFullYear() === selectedYear && transferDate.getMonth() === selectedMonth;
  }

  return {
    SEARCH_FIELDS: SEARCH_FIELDS.slice(),
    normalizeSearchValue: normalizeSearchValue,
    buildTransferSearchText: buildTransferSearchText,
    matchesTransferSearch: matchesTransferSearch,
    matchesTransferListScope: matchesTransferListScope
  };
}));
