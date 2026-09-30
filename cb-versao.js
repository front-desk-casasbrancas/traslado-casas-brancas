/*
  Sistema de Traslados - selo de versao + aviso de atualizacao
  Autor: Renato Rios (renatorios1611@gmail.com)

  Deteccao "primeira leitura": ao carregar, a pagina anota a versao publicada
  (versao.json) como a versao EM EXECUCAO. So mostra o aviso de recarregar se a
  versao.json MUDAR enquanto a pagina esta aberta (ou seja, houve nova publicacao).
  Isso elimina o aviso "preso": ao recarregar, a versao anotada volta a ser a atual
  e o aviso some. Nao depende de uma versao embutida neste arquivo.
*/
(function () {
  var atual = null;      // versao que ESTA pagina carregou
  var avisado = false;

  function selo(v) {
    var el = document.getElementById('cbVersao');
    if (!el) {
      el = document.createElement('div');
      el.id = 'cbVersao';
      el.style.cssText = 'position:fixed;right:8px;bottom:6px;z-index:9998;font:600 10px/1 Arial,sans-serif;color:#9a917e;opacity:.6;background:rgba(255,255,255,.55);padding:3px 7px;border-radius:20px;pointer-events:none;';
      document.body.appendChild(el);
    }
    el.textContent = 'v' + v;
  }

  function aviso(nova) {
    if (avisado) return; avisado = true;
    var b = document.createElement('div');
    b.innerHTML = '↻ Nova versao disponivel (' + nova + '). <u style="cursor:pointer">Recarregar</u>';
    b.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:10002;background:#9c7d3f;color:#fff;padding:10px 18px;border-radius:40px;font:600 13px Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.28);cursor:pointer;';
    b.addEventListener('click', function () {
      try {
        if ('caches' in window) {
          caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); })
            .then(function () { location.reload(true); });
        } else { location.reload(true); }
      } catch (e) { location.reload(true); }
    });
    document.body.appendChild(b);
  }

  function assinatura() {
    if (!document.body || document.getElementById('cbTechCredit')) return;
    var style = document.createElement('style');
    style.textContent = '#cbTechCredit{display:flex;align-items:center;justify-content:center;gap:9px;width:max-content;max-width:calc(100% - 32px);margin:24px auto 18px;padding:8px 14px;border:1px solid rgba(184,153,90,.28);border-radius:999px;background:rgba(255,255,255,.78);color:#6f654f;font-family:Segoe UI,-apple-system,BlinkMacSystemFont,Helvetica Neue,Arial,sans-serif;box-shadow:0 2px 10px rgba(40,36,28,.045)}#cbTechCredit svg{width:30px;height:30px;flex:0 0 auto}#cbTechCredit .cb-tech-copy{display:flex;flex-direction:column;gap:2px}#cbTechCredit .cb-tech-label{font-size:9px;line-height:1.1;font-weight:600;letter-spacing:.12em;text-transform:uppercase;opacity:.72}#cbTechCredit strong{font-size:12px;line-height:1.2;font-weight:600;letter-spacing:.01em;color:#3a3832}@media(max-width:550px){#cbTechCredit{margin:20px auto 16px;padding:7px 12px}}';
    document.head.appendChild(style);

    var footer = document.createElement('footer');
    footer.id = 'cbTechCredit';
    footer.setAttribute('aria-label', 'Desenvolvido por Búzios Technology');
    footer.innerHTML = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17.5" fill="#2b2a26" stroke="#b8995a" stroke-width="1.3"/><text x="20" y="25" text-anchor="middle" fill="#f7f3ea" font-family="Georgia,serif" font-size="14" font-weight="700" letter-spacing=".2">BT</text><circle cx="32.5" cy="8" r="2" fill="#b8995a"/></svg><span class="cb-tech-copy"><span class="cb-tech-label">Desenvolvido por</span><strong>Búzios Technology</strong></span>';
    document.body.appendChild(footer);
  }

  function checar() {
    fetch('versao.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.v) return;
        if (atual === null) { atual = j.v; selo(j.v); }   // 1a leitura = versao em execucao
        else if (j.v !== atual && !avisado) aviso(j.v);   // publicaram algo novo depois
      })
      .catch(function () {});
  }

  function iniciar() {
    checar();
    assinatura();
  }

  if (document.readyState !== 'loading') iniciar();
  else document.addEventListener('DOMContentLoaded', iniciar);
  setInterval(checar, 5 * 60 * 1000);
})();
