// Sala PWA Service Worker - Cache & Offline Support
const CACHE_NAME = "sala-cache-v1";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./offres.html",
  "./evenements.html",
  "./annuaires.html",
  "./entretiens.html",
  "./legislation.html",
  "./cv-builder.html",
  "./auth.html",
  "./profile.html",
  "./job-detail.html",
  "./css/bootstrap.min.css",
  "./css/sala-theme.css",
  "./manifest.json",
  "./img/logo.jpg",
  "./img/logo_transparent.png",
  "./js/firebase-config.js",
  "./js/annuaires-data.js",
  "./js/evenements-data.js",
  "./js/job-ui-helpers.js"
];

// Installation : Mise en cache du shell de l'application
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Sala SW] Pré-mise en cache des ressources essentielles...");
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("[Sala SW] Certains fichiers n'ont pas pu être mis en cache :", err);
      });
    })
  );
  self.skipWaiting();
});

// Activation : Nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log("[Sala SW] Suppression ancien cache :", name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interception des requêtes réseau
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Ignorer tout ce qui n'est pas http(s) : le Cache Storage rejette les
  // schémas comme "chrome-extension:" (extensions de navigateur, DevTools...).
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return;
  }

  // Ne pas intercepter les requêtes Firestore ou Google Auth directes
  if (
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("identitytoolkit.googleapis.com") ||
    url.hostname.includes("securetoken.googleapis.com") ||
    url.hostname.includes("firebase")
  ) {
    return;
  }

  // Stratégie Réseau d'abord, secours sur le cache pour les pages HTML
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return caches.match("./index.html");
          });
        })
    );
    return;
  }

  // Pour les autres ressources (CSS, JS, Images) : Cache d'abord avec revalidation réseau
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // En arrière-plan, tenter de mettre à jour le cache
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
