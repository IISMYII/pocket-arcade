// Bump this version whenever any bundled application resource changes.
const CACHE='pocket-arcade-v2';
const CORE=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
const ALLOWED=new Set(CORE.map(p=>new URL(p,self.registration.scope).href));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE))));
// Wait for explicit consent, or until all old app windows have closed.
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting()});
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
// Keep old version caches for already-open tabs. No user storage is deleted.
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 url.search='';url.hash='';
 if(!ALLOWED.has(url.href))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const cached=await cache.match(url.href);if(cached)return cached;
  return fetch(event.request); // Never substitute HTML for a missing script or image.
 }));
});
