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

  if (document.readyState !== 'loading') checar();
  else document.addEventListener('DOMContentLoaded', checar);
  setInterval(checar, 5 * 60 * 1000);
})();
