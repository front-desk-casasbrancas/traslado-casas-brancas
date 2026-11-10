var BT_FECHAMENTO_CONFIG = {
  abaTransfers: 'Página1',
  percentualComissao: 0.05,
  fusoHorario: 'America/Sao_Paulo',
  propriedadeEmailMarcelo: 'FECHAMENTO_BUZIOS_TECH_EMAIL_MARCELO',
  propriedadeEnvioAtivo: 'FECHAMENTO_BUZIOS_TECH_ENVIO_ATIVO',
  propriedadeUltimoPeriodo: 'FECHAMENTO_BUZIOS_TECH_ULTIMO_PERIODO_ENVIADO'
};

// Fluxo confidencial: não conectar estas funções ao doGet/doPost do aplicativo,
// à aba Pagamentos ou a qualquer resposta consumida pelas telas do Casas Brancas.

function previsualizarFechamentoBuziosTechnology() {
  return btMontarFechamentoDaPlanilha_(btPeriodoAnterior_(new Date()));
}

function previsualizarFechamentoBuziosTechnologyOutubro2026() {
  return btMontarFechamentoDaPlanilha_('2026-10');
}

function enviarFechamentoBuziosTechnology() {
  var hoje = new Date();
  var dia = Number(Utilities.formatDate(hoje, BT_FECHAMENTO_CONFIG.fusoHorario, 'd'));
  if (dia !== 5) return { ok: false, enviado: false, motivo: 'fora_do_dia_05' };
  return btEnviarFechamento_({ periodo: btPeriodoAnterior_(hoje), origem: 'agendado' });
}

function enviarFechamentoBuziosTechnologyOutubro2026() {
  return btEnviarFechamento_({ periodo: '2026-10', origem: 'excepcional_2026-11' });
}

function instalarTriggerFechamentoBuziosTechnologyDia05() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty(BT_FECHAMENTO_CONFIG.propriedadeEnvioAtivo) !== 'true') {
    throw new Error('Ative explicitamente FECHAMENTO_BUZIOS_TECH_ENVIO_ATIVO=true somente após a validação.');
  }
  btLerEmailMarcelo_(props);
  var nomeFuncao = 'enviarFechamentoBuziosTechnology';
  var existente = ScriptApp.getProjectTriggers().some(function (trigger) {
    return trigger.getHandlerFunction() === nomeFuncao;
  });
  if (existente) return { ok: true, criado: false, motivo: 'trigger_ja_existe' };
  ScriptApp.newTrigger(nomeFuncao).timeBased().onMonthDay(5).atHour(9).create();
  return { ok: true, criado: true };
}

function btEnviarFechamento_(opcoes) {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty(BT_FECHAMENTO_CONFIG.propriedadeEnvioAtivo) !== 'true') {
    return { ok: false, enviado: false, motivo: 'envio_desativado', periodo: opcoes.periodo };
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (props.getProperty(BT_FECHAMENTO_CONFIG.propriedadeUltimoPeriodo) === opcoes.periodo) {
      return { ok: true, enviado: false, motivo: 'periodo_ja_enviado', periodo: opcoes.periodo };
    }
    var emailMarcelo = btLerEmailMarcelo_(props);
    var fechamento = btMontarFechamentoDaPlanilha_(opcoes.periodo);
    var mensagem = btMontarMensagem_(fechamento);
    MailApp.sendEmail({
      to: emailMarcelo,
      subject: mensagem.assunto,
      body: mensagem.texto,
      htmlBody: mensagem.html,
      name: 'Casas Brancas - Fechamento'
    });
    props.setProperty(BT_FECHAMENTO_CONFIG.propriedadeUltimoPeriodo, opcoes.periodo);
    return { ok: true, enviado: true, periodo: opcoes.periodo, origem: opcoes.origem };
  } finally {
    lock.releaseLock();
  }
}

function btMontarFechamentoDaPlanilha_(periodo) {
  var aba = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BT_FECHAMENTO_CONFIG.abaTransfers);
  if (!aba) throw new Error('Aba obrigatória não encontrada: ' + BT_FECHAMENTO_CONFIG.abaTransfers);
  var valores = aba.getDataRange().getValues();
  if (!valores.length) throw new Error('A aba de transfers está vazia.');
  return btCalcularFechamento_(valores[0], valores.slice(1), periodo);
}

function btCalcularFechamento_(cabecalhos, linhas, periodo) {
  if (!/^\d{4}-\d{2}$/.test(periodo)) throw new Error('Período inválido: ' + periodo);
  var colunas = {};
  ['ID', 'Data Viagem', 'Valor Total', 'Pagamento', 'Status'].forEach(function (nome) {
    var indice = cabecalhos.indexOf(nome);
    if (indice < 0) throw new Error('Coluna obrigatória não encontrada: ' + nome);
    colunas[nome] = indice;
  });

  var detalhes = [];
  var porPagamento = {};
  var total = 0;
  linhas.forEach(function (linha) {
    var data = btDataIso_(linha[colunas['Data Viagem']]);
    if (!data || data.slice(0, 7) !== periodo) return;
    var status = btNormalizar_(linha[colunas.Status]);
    if (status === 'cancelled' || status === 'cancelado') return;
    var valor = btNumero_(linha[colunas['Valor Total']]);
    if (valor < 0) throw new Error('Valor Total negativo no transfer ' + linha[colunas.ID]);
    var pagamento = String(linha[colunas.Pagamento] || 'Não informado').trim() || 'Não informado';
    total += valor;
    porPagamento[pagamento] = porPagamento[pagamento] || { quantidade: 0, total: 0 };
    porPagamento[pagamento].quantidade += 1;
    porPagamento[pagamento].total += valor;
    detalhes.push({ id: String(linha[colunas.ID] || ''), data: data, valor: valor, pagamento: pagamento, status: status });
  });

  total = btCentavos_(total);
  Object.keys(porPagamento).forEach(function (forma) {
    porPagamento[forma].total = btCentavos_(porPagamento[forma].total);
  });
  return {
    beneficiario: 'Búzios Technology',
    periodo: periodo,
    vencimento: btVencimento_(periodo),
    percentualComissao: BT_FECHAMENTO_CONFIG.percentualComissao,
    quantidade: detalhes.length,
    totalTransfers: total,
    comissao: btCentavos_(total * BT_FECHAMENTO_CONFIG.percentualComissao),
    taxaCartaoAplicada: 0,
    porPagamento: porPagamento,
    detalhes: detalhes
  };
}

function btMontarMensagem_(fechamento) {
  var assunto = 'Fechamento Búzios Technology - ' + fechamento.periodo + ' - vencimento ' + fechamento.vencimento;
  var linhasPagamento = Object.keys(fechamento.porPagamento).sort().map(function (forma) {
    var item = fechamento.porPagamento[forma];
    return forma + ': ' + item.quantidade + ' traslado(s), ' + btMoeda_(item.total);
  });
  var texto = [
    'Fechamento mensal da comissão da Búzios Technology',
    'Período: ' + fechamento.periodo,
    'Vencimento: ' + fechamento.vencimento,
    'Traslados considerados: ' + fechamento.quantidade,
    'Total dos traslados: ' + btMoeda_(fechamento.totalTransfers),
    'Comissão (5%): ' + btMoeda_(fechamento.comissao),
    '',
    'Resumo por forma de pagamento:',
    linhasPagamento.length ? linhasPagamento.join('\n') : 'Sem traslados no período.'
  ].join('\n');
  var htmlPagamento = linhasPagamento.length
    ? '<ul>' + linhasPagamento.map(function (linha) { return '<li>' + btEscaparHtml_(linha) + '</li>'; }).join('') + '</ul>'
    : '<p>Sem traslados no período.</p>';
  var html = '<p><strong>Fechamento mensal da comissão da Búzios Technology</strong></p>' +
    '<table cellpadding="6" cellspacing="0" border="0">' +
    '<tr><td>Período</td><td><strong>' + btEscaparHtml_(fechamento.periodo) + '</strong></td></tr>' +
    '<tr><td>Vencimento</td><td><strong>' + btEscaparHtml_(fechamento.vencimento) + '</strong></td></tr>' +
    '<tr><td>Traslados considerados</td><td>' + fechamento.quantidade + '</td></tr>' +
    '<tr><td>Total dos traslados</td><td>' + btMoeda_(fechamento.totalTransfers) + '</td></tr>' +
    '<tr><td>Comissão (5%)</td><td><strong>' + btMoeda_(fechamento.comissao) + '</strong></td></tr>' +
    '</table><p><strong>Resumo por forma de pagamento</strong></p>' + htmlPagamento;
  return { assunto: assunto, texto: texto, html: html };
}

function btLerEmailMarcelo_(props) {
  var email = String(props.getProperty(BT_FECHAMENTO_CONFIG.propriedadeEmailMarcelo) || '').trim();
  if (!email) throw new Error('Configure FECHAMENTO_BUZIOS_TECH_EMAIL_MARCELO antes de ativar o envio.');
  if (/[;,\s]/.test(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Configure somente o e-mail confirmado do Marcelo, sem cópias ou destinatários adicionais.');
  }
  return email;
}

function btPeriodoAnterior_(data) {
  var ano = data.getFullYear();
  var mes = data.getMonth();
  if (mes === 0) { ano -= 1; mes = 12; }
  return ano + '-' + String(mes).padStart(2, '0');
}

function btVencimento_(periodo) {
  if (periodo === '2026-10') return '11/11/2026';
  var partes = periodo.split('-').map(Number);
  var vencimento = new Date(partes[0], partes[1], 10);
  return String(vencimento.getDate()).padStart(2, '0') + '/' +
    String(vencimento.getMonth() + 1).padStart(2, '0') + '/' + vencimento.getFullYear();
}

function btDataIso_(valor) {
  if (Object.prototype.toString.call(valor) === '[object Date]' && !isNaN(valor.getTime())) {
    if (typeof Utilities !== 'undefined') return Utilities.formatDate(valor, BT_FECHAMENTO_CONFIG.fusoHorario, 'yyyy-MM-dd');
    return valor.getFullYear() + '-' + String(valor.getMonth() + 1).padStart(2, '0') + '-' + String(valor.getDate()).padStart(2, '0');
  }
  var texto = String(valor || '').trim();
  var iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[1] + '-' + iso[2] + '-' + iso[3];
  var br = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  return br ? br[3] + '-' + br[2] + '-' + br[1] : '';
}

function btNumero_(valor) {
  if (typeof valor === 'number') return isFinite(valor) ? valor : 0;
  var texto = String(valor || '').trim();
  if (!texto) return 0;
  if (texto.indexOf(',') >= 0) texto = texto.replace(/\./g, '').replace(',', '.');
  var numero = Number(texto.replace(/[^0-9.-]/g, ''));
  return isFinite(numero) ? numero : 0;
}

function btCentavos_(valor) { return Math.round((Number(valor) || 0) * 100) / 100; }
function btNormalizar_(valor) { return String(valor || '').trim().toLowerCase(); }
function btMoeda_(valor) { return 'R$ ' + btCentavos_(valor).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function btEscaparHtml_(valor) { return String(valor).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

