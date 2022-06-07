export function registrate(swName, swScope = './', isCustom = false) {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  if (swScope[0] !== '.') {
    if (swScope[1] !== '/') {
      swScope = './' + swScope;
    } else {
      swScope = '.' + swScope;
    }
  }

  if (isCustom) {
    navigator.serviceWorker.register(swName, {scope: swScope});
    return;
  }

  switch (swName) {
    case swCacheStrategies.CACHE_FIRST_SW_TYPE:
      navigator.serviceWorker.register('./service_worker_cache_first.js', {scope: swScope});
      break;
    case swCacheStrategies.NETWORK_FIRST_SW_TYPE:
      navigator.serviceWorker.register('./service_worker_network_first.js', {scope: swScope});
      break;
    case swCacheStrategies.CACHE_ONLY_SW_TYPE:
      navigator.serviceWorker.register('./service_worker_cache_only.js', {scope: swScope});
      break;
    case swCacheStrategies.NETWORK_ONLY_SW_TYPE:
      navigator.serviceWorker.register('./service_worker_network_only.js', {scope: swScope});
      break;
    case swCacheStrategies.STALE_WHILE_REVALIDATE_SW_TYPE:
      navigator.serviceWorker.register('./service_worker_stale-while-revalidate.js', {scope: swScope});
      break;
    case swCacheStrategies.COMBINE_SW_TYPE:
      navigator.serviceWorker.register('./service_worker_combine.js', {scope: swScope});
      break;
    default:
      navigator.serviceWorker.register('./service_worker_network_first.js', {scope: swScope});
      break;
  }
}

export const addUrlsToCache = (staticCacheItems = []) => {
  return caches.open(CACHE_NAME)
    .then((cache) => cache.addAll(staticCacheItems));
}

const CACHE_NAME = 'cache_v1';
export const swCacheStrategies = {
  CACHE_FIRST_SW_TYPE: 'CACHE_FIRST_SW_TYPE',
  NETWORK_FIRST_SW_TYPE: 'NETWORK_FIRST_SW_TYPE',
  CACHE_ONLY_SW_TYPE: 'CACHE_ONLY_SW_TYPE',
  NETWORK_ONLY_SW_TYPE: 'NETWORK_ONLY_SW_TYPE',
  COMBINE_SW_TYPE: 'COMBINE_SW_TYPE',
  STALE_WHILE_REVALIDATE_SW_TYPE: 'STALE_WHILE_REVALIDATE_SW_TYPE',
};
