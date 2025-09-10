// Content script injected on our website to handshake with the page via postMessage.
// Security: only respond to messages from the same origin where this script runs.
(function() {
  try {
    const allowedOrigin = window.location.origin;

    function onMessage(event) {
      // Only accept messages from same-origin page context
      if (!event || event.origin !== allowedOrigin) return;
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'ATS_EXTENSION_PING') {
        // Reply with a small payload including extension version
        const version = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) ? chrome.runtime.getManifest().version : '0.0.0';
        window.postMessage({ type: 'ATS_EXTENSION_PONG', version }, allowedOrigin);
      }
    }

    window.addEventListener('message', onMessage, false);

    // Optional: announce presence for debugging (page can listen if needed)
    // window.postMessage({ type: 'ATS_EXTENSION_AVAILABLE' }, allowedOrigin);
  } catch (e) {
    // Fail silently
  }
})();