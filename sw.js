'use strict';
// V2 is an atomic local bundle. A waiting worker activates on player acceptance.
const CACHE='pocket-arcade-v2.0.0';
const CORE=[
 "./",
 "./index.html",
 "./app.js",
 "./styles.css",
 "./boards.css",
 "./manifest.webmanifest",
 "./engines/adventure.js",
 "./engines/arcade.js",
 "./engines/boards.js",
 "./engines/sports.js",
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
// Old versions are kept for older open tabs; no localStorage or player data is cleared.
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 url.search='';url.hash='';if(!ALLOWED.has(url.href))return;
 event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(url.href))||fetch(event.request)));
});
