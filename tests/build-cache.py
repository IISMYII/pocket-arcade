"""Generate an explicit offline allowlist; no arbitrary runtime request caching."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
files=['./','./index.html','./app.js','./styles.css','./boards.css','./manifest.webmanifest']
files += ['./'+p.relative_to(root).as_posix() for folder in ['engines','art','icons'] for p in sorted((root/folder).glob('*')) if p.suffix in ['.js','.svg','.png']]
p=root/'sw.js'
code="""'use strict';
// V2 is an atomic local bundle. A waiting worker activates on player acceptance.
const CACHE='pocket-arcade-v2.0.0';
const CORE=__CORE__;
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
"""
p.write_text(code.replace('__CORE__',json.dumps(files,indent=1)))
print(f'{len(files)} intended resources in offline bundle')
