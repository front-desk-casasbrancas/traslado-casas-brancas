/*
  Sistema de Traslados — atualizacao automatica do aplicativo
  Confere se a versao da pagina corresponde a publicada e atualiza automaticamente.
*/
(function () {
  var avisoEl = null;
  var timerAviso = null;
  var recarregando = false;
  var versaoPagina = (document.querySelector('meta[name="cb-build"]') || {}).content || '';
  var usuarioEditou = false;
  var ignorarPendencias = false;

  function campoEditavel(el) {
    return el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) &&
      !el.readOnly && !el.disabled && el.type !== 'password' && !el.closest('#authGate');
  }

  function temAlteracoesPendentes() {
    if (ignorarPendencias) return false;
    if (typeof window.cbHasUnsavedChanges === 'function') {
      try { return !!window.cbHasUnsavedChanges(); } catch (e) {}
    }
    return usuarioEditou;
  }

  document.addEventListener('input', function (e) { if (campoEditavel(e.target)) usuarioEditou = true; }, true);
  document.addEventListener('change', function (e) { if (campoEditavel(e.target)) usuarioEditou = true; }, true);

  function recarregar() {
    if (recarregando) return;
    if (temAlteracoesPendentes()) { mostrarAviso(true); return; }
    recarregando = true;
    setTimeout(function () { location.reload(); }, 150);
  }

  function mostrarAviso(adiado) {
    if (!document.body) return;
    if (!avisoEl) {
      avisoEl = document.createElement('button');
      avisoEl.type = 'button';
      avisoEl.id = 'cbAtualizacaoAviso';
      avisoEl.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:10002;background:#9c7d3f;color:#fff;padding:10px 18px;border:0;border-radius:40px;font:600 13px Arial,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.28);cursor:pointer;';
      avisoEl.addEventListener('click', function () {
        ignorarPendencias = true;
        usuarioEditou = false;
        recarregar();
      });
      document.body.appendChild(avisoEl);
    }
    avisoEl.textContent = adiado ? 'Atualização pronta — salve os dados e toque aqui' : 'Nova versão — atualizando…';
    avisoEl.hidden = false;
    if (timerAviso) clearTimeout(timerAviso);
    if (!adiado) timerAviso = setTimeout(recarregar, 1500);
  }

  function selo(v) {
    var el = document.getElementById('cbVersao');
    if (!el) {
      el = document.createElement('div');
      el.id = 'cbVersao';
      el.style.cssText = 'position:fixed;left:50%;right:auto;bottom:12px;transform:translateX(-50%);z-index:9998;font:600 10px/1 Arial,sans-serif;color:#9a917e;opacity:.6;background:rgba(255,255,255,.55);padding:3px 7px;border-radius:20px;pointer-events:none;';
      document.body.appendChild(el);
    }
    el.style.cssText = 'position:fixed;left:50%;right:auto;bottom:12px;transform:translateX(-50%);z-index:9998;font:600 10px/1 Arial,sans-serif;color:#9a917e;opacity:.6;background:rgba(255,255,255,.55);padding:3px 7px;border-radius:20px;pointer-events:none;';
    el.textContent = 'v' + v;
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
      .then(function (r) { if (!r.ok) throw new Error('versao indisponivel'); return r.json(); })
      .then(function (j) {
        if (!j || !j.v) return;
        selo(j.v);
        if (versaoPagina && j.v !== versaoPagina) recarregar();
      })
      .catch(function () {});
  }

  function iniciar() {
    assinatura();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', recarregar);
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (r) {
        r.update().catch(function () {});
      }).catch(function () {});
    }
    checar();
    setInterval(checar, 60 * 1000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) checar(); });
    window.addEventListener('focus', checar);
  }

  if (document.readyState !== 'loading') iniciar();
  else document.addEventListener('DOMContentLoaded', iniciar);
})();
