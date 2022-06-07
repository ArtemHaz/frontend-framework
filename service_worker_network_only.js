const CACHE_NAME = 'cache_v1';

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
  function onFetch() {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() => offlineResponse()),
    );
  }

  const url = new URL(event.request.url);
  if (url.pathname.includes('service_worker')) {
    return;
  }
  onFetch();
});
