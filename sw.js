const CACHE_NAME='tokyo-trip-v1.1';
const CORE=[
  './','./index.html','./manifest.webmanifest',
  './icon.png','./icon-192.png','./icon-512.png','./apple-touch-icon.png',
  './trip-photo-01.png','./trip-photo-02.jpg','./trip-photo-03.webp','./trip-photo-04.jpg',
  './trip-photo-05.webp','./trip-photo-06.jpg','./trip-photo-07.jpg',
  './hotel-utsunomiya-01.jpg','./hotel-utsunomiya-02.jpg',
  './hotel-epinard-01.jpg','./hotel-epinard-02.jpg',
  './hotel-nikko-garden-01.jpg','./hotel-nikko-garden-02.jpg',
  './hotel-kamenoi-okunikko-01.jpg','./hotel-kamenoi-okunikko-02.jpg',
  './hotel-kosantei-01.jpg','./hotel-kosantei-02.jpg',
  './hotel-clad-01.jpg','./hotel-clad-02.jpg',
  './hotel-narita-01.jpg','./hotel-narita-02.jpg'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache=>
      Promise.allSettled(CORE.map(url=>cache.add(url)))
    ).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;

  // Navigation: try fresh network first, then cached app shell.
  if(req.mode==='navigate'){
    event.respondWith(
      fetch(req).then(res=>{
        const copy=res.clone();
        caches.open(CACHE_NAME).then(c=>c.put('./index.html',copy));
        return res;
      }).catch(()=>caches.match('./index.html').then(r=>r || caches.match('./')))
    );
    return;
  }

  // API calls remain network-first; if they fail, the page keeps last rendered/cached data.
  if(req.url.includes('api.open-meteo.com') || req.url.includes('firebase')){
    event.respondWith(fetch(req).catch(()=>caches.match(req)));
    return;
  }

  // Images/styles/scripts: cache-first + runtime cache.
  event.respondWith(
    caches.match(req).then(cached=>{
      if(cached) return cached;
      return fetch(req).then(res=>{
        if(res && (res.ok || res.type==='opaque')){
          const copy=res.clone();
          caches.open(CACHE_NAME).then(c=>c.put(req,copy)).catch(()=>{});
        }
        return res;
      });
    })
  );
});
