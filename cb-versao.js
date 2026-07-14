/*
  Sistema de Traslados - selo de versao + aviso de atualizacao
  Autor: Renato Rios (renatorios1611@gmail.com)
*/
(function () {
  var VERSAO = "2026.07.15-2"; // <- bump a cada publicacao (igual ao versao.json)
  function selo() {
    if (document.getElementById('cbVersao')) return;
    var el = document.createElement('div');
    el.id = 'cbVersao';
    el.textContent = 'v' + VERSAO;
    el.style.cssText = 'position:fixed;right:8px;bottom:6px;z-index:9998;font:600 10px/1 Arial,sans-serif;color:#9a917e;opacity:.6;background:rgba(255,255,255,.55);padding:3px 7px;border-radius:20px;pointer-events:none;';
    document.body.appendChild(el);
  }
  var avisado = false;
  function aviso(nova) {
    if (avisado) return; avisado = true;
    var b = document.createElement('div');
    b.innerHTML = '↻ Nova versao disponivel (' + nova + '). <u style="cursor:pointer">Recarregar</u>';
    b.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:10002;background:#9c7d3f;color:#fff;padding:10px 18px;border-radius:40px;font:600 13px Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.28);cursor:pointer;';
    b.addEventListener('click', function () {
      try {
        if ('caches' in window) { caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); }).then(function () { location.reload(true); }); }
        else location.reload(true);
      } catch (e) { location.reload(true); }
    });
    document.body.appendChild(b);
  }
  function checar() {
    fetch('versao.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (j && j.v && j.v !== VERSAO) aviso(j.v); })
      .catch(function () {});
  }
  if (document.readyState !== 'loading') selo(); else document.addEventListener('DOMContentLoaded', selo);
  setTimeout(checar, 3000);
  setInterval(checar, 5 * 60 * 1000);
})();

/* Window Controls Overlay: janela só com os 3 botões nativos + faixa de arrastar */
(function () {
  try {
    if (!('windowControlsOverlay' in navigator)) return;
    function aplicar() {
      var vis = navigator.windowControlsOverlay.visible;
      var st = document.getElementById('cbWcoStyle');
      if (vis && !st) {
        st = document.createElement('style'); st.id = 'cbWcoStyle';
        st.textContent = 'body{padding-top:env(titlebar-area-height,0)!important;}' +
          '#cbDragBar{position:fixed;top:0;left:env(titlebar-area-x,0);width:env(titlebar-area-width,100%);height:env(titlebar-area-height,0);-webkit-app-region:drag;app-region:drag;z-index:100000;}';
        document.head.appendChild(st);
        var bar = document.createElement('div'); bar.id = 'cbDragBar';
        (document.body || document.documentElement).appendChild(bar);
      } else if (!vis && st) {
        st.remove(); var b = document.getElementById('cbDragBar'); if (b) b.remove();
      }
    }
    aplicar();
    navigator.windowControlsOverlay.addEventListener('geometrychange', aplicar);
  } catch (e) {}
})();
