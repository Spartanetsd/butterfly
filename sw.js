/* Крылья на рассвете — офлайн-кэш.
   После обновления файлов на GitHub поменяйте номер версии ниже (v1 → v2). */
const CACHE = 'krylia-v2';
const FILES = ['./', 'index.html', 'manifest.json', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FILES); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // страница — сначала сеть (чтобы обновления приходили сразу), без сети — из кэша
  if (req.mode === 'navigate'){
    e.respondWith(fetch(req).then(function(res){
      const copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put('index.html', copy); });
      return res;
    }).catch(function(){
      return caches.match('index.html').then(function(r){ return r || caches.match('./'); });
    }));
    return;
  }
  // иконки и манифест — сначала кэш
  e.respondWith(caches.match(req).then(function(r){
    return r || fetch(req).then(function(res){
      const copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put(req, copy); });
      return res;
    });
  }));
});
