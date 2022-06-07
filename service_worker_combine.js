const CACHE_NAME = 'cache_v1';
const CACHE_URL_PATTERN = /^.*\.(jpg|png|jpeg|woff|woff2|mp3|mp4|bmp|svg|gif|webp|webm|wmv|avi|wav|ogg|ttf|eot)$/;

function addToCache(cacheKey, request, response) {
  if (response.ok && request.method === 'GET') {
    const copy = response.clone();
    caches.open(cacheKey).then((cache) => {
      cache.put(request, copy);
    });
  }
  return response;
}

function fetchFromCache(event) {
  return caches.match(event.request).then((response) => {
    if (!response) {
      throw Error(`${event.request.url} not found in cache`);
    }
    return response;
  });
}


function offlineResponse() {
  const tmp = { code: 'Сбой сети' };
  return Promise.resolve(new Response(JSON.stringify(tmp), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  }));
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  function onFetch(isStatic) {
    const cacheKey = CACHE_NAME;

    if (isStatic) {
      event.respondWith(
        fetchFromCache(event)
          .catch(() => fetch(event.request))
          .then((response) => addToCache(cacheKey, event.request, response))
          .catch(() => offlineResponse()),
      );
      return;
    }
    event.respondWith(
      fetch(event.request)
        .then((response) => addToCache(cacheKey, event.request, response))
        .catch(() => fetchFromCache(event))
        .catch(() => offlineResponse()),
    );
  }

  const url = new URL(event.request.url);
  if (url.pathname.includes('service_worker')) {
    return;
  }
  onFetch(CACHE_URL_PATTERN.test(url.href));
});
