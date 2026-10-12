/*
 * Helper para o Apps Script vinculado à planilha "Traslados".
 * A remoção só limpa EventoID depois que o Calendar confirma a operação.
 */
function cancelarEventoDoTransfer_(calendarios, eventoId, aba, linha, colEvento) {
  if (!eventoId) return { deleted: false, reason: "sem_evento_vinculado" };

  var evento = null;
  var errosBusca = [];
  var vistos = {};

  calendarios.forEach(function (cal) {
    if (!cal || evento) return;
    var chave = "";
    try { chave = String(cal.getId ? cal.getId() : ""); } catch (eId) {}
    if (chave && vistos[chave]) return;
    if (chave) vistos[chave] = true;
    try {
      evento = cal.getEventById(eventoId) || null;
    } catch (e) {
      errosBusca.push(e);
    }
  });

  if (!evento && errosBusca.length) {
    throw new Error("Falha ao localizar o evento no Google Calendar: " + errosBusca[0]);
  }

  if (evento) {
    try {
      evento.deleteEvent();
    } catch (eDelete) {
      throw new Error("Falha ao excluir o evento do Google Calendar: " + eDelete);
    }
  }

  // Se nenhuma agenda devolveu o evento sem lançar erro, ele já não existe.
  // Em ambos os casos é seguro remover a referência somente agora.
  aba.getRange(linha, colEvento).clearContent();
  return { deleted: !!evento, reason: evento ? "excluido" : "ja_ausente" };
}
