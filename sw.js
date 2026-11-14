// Ukládáme jen veřejnou offline stránku, nikoli účty, API nebo komentáře.
const CACHE='wiki-offline-v1';
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['./offline.html']))));
self.addEventListener('fetch',event=>{if(event.request.mode==='navigate'&&event.request.method==='GET')event.respondWith(fetch(event.request).catch(()=>caches.match('./offline.html')));});
