/* Service worker dedicado ao Firebase Cloud Messaging (push com o app fechado).
   Fica em escopo próprio para não conflitar com o sw.js (cache/offline). */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA_J5kmYRoJ2buFwmLdzh7xEtmz_VUIHqQ",
  authDomain: "traslados-a06ef.firebaseapp.com",
  projectId: "traslados-a06ef",
  storageBucket: "traslados-a06ef.firebasestorage.app",
  messagingSenderId: "973014023548",
  appId: "1:973014023548:web:78985913ed135bd10038f9"
});

const messaging = firebase.messaging();

// Mensagem recebida com o app fechado / em segundo plano
messaging.onBackgroundMessage(function (payload) {
  var d = payload.data || {};
  var n = payload.notification || {};
  var titulo = d.titulo || n.title || 'Casas Brancas';
  var corpo = d.corpo || n.body || '';
  var url = d.url || 'menu.html';
  self.registration.showNotification(titulo, {
    body: corpo,
    icon: 'icon-192-v4.png',
    badge: 'icon-192-v4.png',
    vibrate: [120, 60, 120],
    tag: d.tag || 'cb-traslado',
    renotify: true,
    data: { url: url }
  });
});

// Clique na notificação: abre (ou foca) a página certa
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var alvo = (e.notification.data && e.notification.data.url) || 'menu.html';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (lista) {
      for (var i = 0; i < lista.length; i++) {
        if (lista[i].url.indexOf(alvo) !== -1 && 'focus' in lista[i]) return lista[i].focus();
      }
      if (clients.openWindow) return clients.openWindow(alvo);
    })
  );
});
