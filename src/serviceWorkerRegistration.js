const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

let appLogger = null;

function setLogger(logger) {
  appLogger = logger;
}

export function register(config) {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    setLogger(config?.logger || null);
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) return;

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          log('debug', 'KasiTRADE running in offline mode.');
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

function log(level, message, data) {
  if (appLogger) {
    appLogger[level]('ServiceWorker', message, data || '');
  }
}

function registerValidSW(swUrl, config) {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType || contentType.indexOf('javascript') === -1) {
        log('warn', 'Service worker unavailable (server returned non-JS). App will run without offline support.');
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.unregister();
          });
        }
        return;
      }
      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) return;
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  log('debug', 'New content available; please refresh.');
                  if (config && config.onUpdate) config.onUpdate(registration);
                } else {
                  log('debug', 'Content cached for offline use.');
                  if (config && config.onSuccess) config.onSuccess(registration);
                }
              }
            };
          };
        })
        .catch((error) => {
          log('warn', 'Service worker registration failed:', error.message);
        });
    })
    .catch(() => {
      log('debug', 'No internet connection. App running in offline mode.');
    });
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (response.status === 404 || (contentType != null && contentType.indexOf('javascript') === -1)) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      log('debug', 'No internet connection. App running in offline mode.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}
