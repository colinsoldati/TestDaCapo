// sw.js - Service Worker pour DaCapo

const CACHE_NAME = 'dacapo-cache-v1';
// Liste des ressources statiques à mettre en cache lors de l'installation.
const urlsToCache = [
  '/', // Alias pour index.html si start_url est '/'
  'index.html',
  // Ajoutez ici d'autres ressources statiques si nécessaire (CSS, JS externes si pas inline)
  // Les polices Google Fonts et Tailwind sont chargées via CDN et seront mises en cache par le navigateur,
  // mais on pourrait les ajouter explicitement si on voulait un contrôle plus fin ou les servir offline.
  // 'https://cdn.tailwindcss.com', // Exemple si on voulait cacher le CDN
  // 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap', // Exemple
  // 'https://cdn.jsdelivr.net/npm/lucide-static@latest/font/Lucide.ttf' // Exemple
];

// Installation du Service Worker : Mise en cache des ressources statiques.
self.addEventListener('install', event => {
  console.log('Service Worker: Installation');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Mise en cache des ressources initiales');
        // Important : Ajoutez toutes les URLs nécessaires pour le fonctionnement hors ligne de base.
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service Worker: Échec de la mise en cache initiale', error);
      })
  );
  // Force le service worker installé à devenir actif immédiatement.
  self.skipWaiting();
});

// Activation du Service Worker : Nettoyage des anciens caches.
self.addEventListener('activate', event => {
  console.log('Service Worker: Activation');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Supprime les caches qui ne correspondent pas au nom de cache actuel.
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Suppression de l\'ancien cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Prend le contrôle de la page immédiatement sans rechargement.
  return self.clients.claim();
});

// Interception des requêtes réseau (Fetch Event).
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

 // Stratégie Cache-First pour les ressources statiques locales et les CDNs essentiels
  if (urlsToCache.includes(requestUrl.pathname) || requestUrl.origin === 'https://unpkg.com' || requestUrl.origin === 'https://fonts.googleapis.com' || requestUrl.origin === 'https://fonts.gstatic.com') {
     console.log(`Service Worker: Cache-First pour ${event.request.url}`);
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          // Si la ressource est dans le cache, la retourner.
          if (cachedResponse) {
            // console.log(`Service Worker: Ressource trouvée dans le cache: ${event.request.url}`);
            return cachedResponse;
          }
          // Sinon, essayer de la récupérer sur le réseau.
          // console.log(`Service Worker: Ressource non trouvée dans le cache, fetch: ${event.request.url}`);
          return fetch(event.request).then(networkResponse => {
              // Optionnel: Mettre en cache la nouvelle ressource récupérée pour la prochaine fois.
              // Attention avec les ressources externes opaques (CDNs), le clonage peut échouer.
              // Cloner la réponse est nécessaire car la réponse ne peut être consommée qu'une seule fois.
              /*
              let responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              */
              return networkResponse;
            }).catch(error => {
                console.error(`Service Worker: Échec du fetch pour ${event.request.url}`, error);
                // Potentiellement retourner une réponse de secours ici (ex: page offline)
            });
        })
    );
  } else {
     // Stratégie Network-First (ou autre) pour les autres requêtes (API, etc.)
     // Pour cette application simple sans API externe, on peut laisser le navigateur gérer par défaut,
     // ou implémenter une stratégie spécifique si nécessaire.
     // console.log(`Service Worker: Requête non gérée par cache-first: ${event.request.url}`);
     // Laisser passer la requête normalement:
     // event.respondWith(fetch(event.request));
     // Ou implémenter Network-First:
     /*
     event.respondWith(
        fetch(event.request)
            .catch(() => caches.match(event.request)) // Tenter le cache en cas d'échec réseau
     );
     */
     // Pour l'instant, on ne fait rien de spécial pour les autres requêtes.
     return;
  }


});
