"""Build only the intended runtime resource list, never arbitrary requests."""
from pathlib import Path
import re,json
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
files=['./','./index.html','./manifest.webmanifest','./logic/chess-worker.js']
files += re.findall(r'<script[^>]+src="([^"]+)"',html)
files += re.findall(r'<link[^>]+href="([^"]+\.css)"',html)
files += ['./'+p.relative_to(root).as_posix() for folder in ['art','icons'] for p in sorted((root/folder).glob('*')) if p.suffix in ['.svg','.png']]
files=list(dict.fromkeys(files))
for f in files:
 if f!='./' and not (root/f[2:]).is_file():raise SystemExit('Missing runtime resource '+f)
code="""'use strict';
// Atomic V3 bundle. Change this release version on every deployment.
const CACHE='pocket-arcade-v3.0.0';
const CORE=__CORE__;
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
"""
(root/'sw.js').write_text(code.replace('__CORE__',json.dumps(files,indent=1)))
print(f'{len(files)} intended offline resources')
