var ESCALA_MARCELO_CONFIG = {
  abaTransfers: 'Página1',
  propriedadeChave: 'CHAVE_MARCELO',
  valorPendente: 'CONFIGURAR_ANTES_DE_USAR'
};

function criarCampoChaveEscalaMarcelo() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty(ESCALA_MARCELO_CONFIG.propriedadeChave)) {
    props.setProperty(ESCALA_MARCELO_CONFIG.propriedadeChave, ESCALA_MARCELO_CONFIG.valorPendente);
    return { ok: true, criado: true, propriedade: ESCALA_MARCELO_CONFIG.propriedadeChave };
  }
  return { ok: true, criado: false, motivo: 'propriedade_ja_existe' };
}

function autenticarEscalaMarcelo_(chave) {
  var configurada = PropertiesService.getScriptProperties().getProperty(ESCALA_MARCELO_CONFIG.propriedadeChave) || '';
  if (!configurada || configurada === ESCALA_MARCELO_CONFIG.valorPendente || !escalaTextoIgual_(String(chave || ''), configurada)) {
    throw new Error('Acesso não autorizado.');
  }
  return true;
}

function dadosEscalaMarcelo_(chave) {
  autenticarEscalaMarcelo_(chave);
  var aba = escalaAbaTransfers_();
  var valores = aba.getDataRange().getValues();
  if (!valores.length) return [];
  var cabecalhos = valores[0].map(String);
  return valores.slice(1).filter(function (linha) {
    return linha.some(function (valor) { return valor !== '' && valor !== null; });
  }).map(function (linha) {
    var item = {};
    cabecalhos.forEach(function (cabecalho, indice) { item[cabecalho] = linha[indice]; });
    return item;
  });
}

function atualizarMotoristaEscalaMarcelo_(chave, id, motorista) {
  autenticarEscalaMarcelo_(chave);
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var aba = escalaAbaTransfers_();
    var alvo = escalaLocalizarTransfer_(aba, id, ['Motorista']);
    var nome = String(motorista || '').trim();
    aba.getRange(alvo.linha, alvo.colunas.Motorista).setValue(nome);
    try { sincronizarEvento(aba, alvo.linha, { motorista: nome }); } catch (eAgenda) { Logger.log('Agenda da escala: ' + eAgenda); }
    return { ok: true };
  } finally {
    try { lock.releaseLock(); } catch (eLock) {}
  }
}

function confirmarEmpresaEscalaMarcelo_(chave, id) {
  autenticarEscalaMarcelo_(chave);
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var aba = escalaAbaTransfers_();
    var alvo = escalaLocalizarTransfer_(aba, id, ['ConfirmadoEmpresa']);
    var quando = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm');
    aba.getRange(alvo.linha, alvo.colunas.ConfirmadoEmpresa).setValue(quando);
    return { ok: true, quando: quando };
  } finally {
    try { lock.releaseLock(); } catch (eLock) {}
  }
}

function escalaAbaTransfers_() {
  var aba = SpreadsheetApp.openById(ID_PLANILHA).getSheetByName(ESCALA_MARCELO_CONFIG.abaTransfers);
  if (!aba) throw new Error('Aba obrigatória não encontrada: ' + ESCALA_MARCELO_CONFIG.abaTransfers);
  return aba;
}

function escalaLocalizarTransfer_(aba, id, colunasObrigatorias) {
  var valores = aba.getDataRange().getValues();
  if (!valores.length) throw new Error('A aba de transfers está vazia.');
  var cabecalhos = valores[0].map(String);
  var colId = cabecalhos.indexOf('ID');
  if (colId < 0) throw new Error('Coluna obrigatória não encontrada: ID');
  var colunas = {};
  colunasObrigatorias.forEach(function (nome) {
    var indice = cabecalhos.indexOf(nome);
    if (indice < 0) throw new Error('Coluna obrigatória não encontrada: ' + nome);
    colunas[nome] = indice + 1;
  });
  var idTexto = String(id || '');
  for (var i = 1; i < valores.length; i++) {
    if (String(valores[i][colId] || '') === idTexto) return { linha: i + 1, colunas: colunas };
  }
  throw new Error('Transfer não encontrado.');
}

function escalaTextoIgual_(a, b) {
  var esquerda = String(a || '');
  var direita = String(b || '');
  var diferente = esquerda.length ^ direita.length;
  var limite = Math.max(esquerda.length, direita.length);
  for (var i = 0; i < limite; i++) diferente |= (esquerda.charCodeAt(i) || 0) ^ (direita.charCodeAt(i) || 0);
  return diferente === 0;
}

