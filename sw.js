'use strict';
// Atomic V3 bundle. Change this release version on every deployment.
const CACHE='pocket-arcade-v3.0.0';
const CORE=[
 "./",
 "./index.html",
 "./manifest.webmanifest",
 "./logic/chess-worker.js",
 "./catalog.js",
 "./app.js",
 "./vendor/chess-1.4.0.js",
 "./logic/chess-rules.js",
 "./logic/city-rules.js",
 "./logic/hockey-physics.js",
 "./logic/pool-physics.js",
 "./logic/tower.js",
 "./logic/arcade-models.js",
 "./logic/sudoku.js",
 "./logic/parking.js",
 "./logic/platform.js",
 "./logic/runner.js",
 "./engines/sports-common.js",
 "./engines/adventure-common.js",
 "./engines/arcade.js",
 "./engines/hockey.js",
 "./engines/pool.js",
 "./engines/tower.js",
 "./engines/platform.js",
 "./engines/runner.js",
 "./engines/parking.js",
 "./engines/sudoku.js",
 "./engines/chess.js",
 "./engines/city.js",
 "./styles.css",
 "./boards.css",
 "./v3.css",
 "./boards-v3.css",
 "./sudoku-v3.css",
 "./art/2048.svg",
 "./art/board-chess-black-b.svg",
 "./art/board-chess-black-k.svg",
 "./art/board-chess-black-n.svg",
 "./art/board-chess-black-p.svg",
 "./art/board-chess-black-q.svg",
 "./art/board-chess-black-r.svg",
 "./art/board-chess-white-b.svg",
 "./art/board-chess-white-k.svg",
 "./art/board-chess-white-n.svg",
 "./art/board-chess-white-p.svg",
 "./art/board-chess-white-q.svg",
 "./art/board-chess-white-r.svg",
 "./art/board-house.svg",
 "./art/board-lot.svg",
 "./art/board-park.svg",
 "./art/board-shop.svg",
 "./art/chess.svg",
 "./art/city.svg",
 "./art/hockey.svg",
 "./art/parking.svg",
 "./art/platform.svg",
 "./art/pool.svg",
 "./art/racer.svg",
 "./art/runner.svg",
 "./art/snake.svg",
 "./art/sudoku.svg",
 "./art/tower.svg",
 "./icons/apple-touch-icon.png",
 "./icons/icon-192.png",
 "./icons/icon-512.png"
];
const ALLOWED=new Set(CORE.map(path=>new URL(path,self.registration.scope).href));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE))));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting()});
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
// Older open clients may need old bundles. Never remove player storage here.
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 url.search='';url.hash='';if(!ALLOWED.has(url.href))return;
 event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(url.href))||fetch(event.request)));
});
