chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkLink") {
      (async () => {
        try {
          // Primer intento con HEAD
          let response = await fetch(request.url, { method: 'HEAD' });
  
          // Si falla por 403 o método no permitido, reintenta con GET
          if (response.status === 403 || response.status === 405) {
            response = await fetch(request.url, { method: 'GET' });
          }
  
          sendResponse({
            ok: response.ok,
            status: response.status,
            statusText: response.statusText
          });
        } catch (error) {
          sendResponse({
            ok: false,
            status: 'Network Error',
            statusText: error.message
          });
        }
      })();
  
      return true; // Indica respuesta asincrónica
    }
  });
  