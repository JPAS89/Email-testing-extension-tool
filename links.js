// ---------- Helpers ----------
function isVisible(el) {
  const style = window.getComputedStyle(el);
  return style.display !== "none" &&
    style.visibility !== "hidden" &&
    el.offsetParent !== null;
}

// Detecta entorno y devuelve el contenedor principal del email
function detectEnvironment() {
  if (document.querySelector(".ii.gt")) return "gmail";
  if (document.querySelector('[aria-label="Message body"]') ||
    document.querySelector("#x_body-fix") ||
    document.querySelector('#focused div[role="document"]')) return "outlook";
  if (document.querySelector("body > table > tbody") ||
    document.querySelector("#lt-accessibility-devtools")) return "stage";
  return null;
}

function getEmailContainer() {
  const env = detectEnvironment();
  switch (env) {
    case "gmail":
      return document.querySelector(".ii.gt");
    case "outlook":
      return document.querySelector('[aria-label="Message body"]') ||
             document.querySelector("#x_body-fix") ||
             document.querySelector('#focused div[role="document"]');
    case "stage":
      return document.querySelector("body > table > tbody") ||
             document.querySelector("#lt-accessibility-devtools");
    default:
      return null;
  }
}

// ---------- Extract elements (DOM) ----------
function extractLinkElements() {
  const container = getEmailContainer();
  if (!container) return []; // no container => nada

  const anchors = container.querySelectorAll('a[href]');
  const visibleAnchors = [];

  anchors.forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    // omitir anclas internas o tel/mailto
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (isVisible(a)) {
      visibleAnchors.push(a);
    }
  });

  return visibleAnchors; // array de nodos <a>
}

// ---------- Extract data (serializable) ----------
function extractLinksData() {
  const elements = extractLinkElements();
  return elements.map(a => ({
    text: a.textContent.trim() || "No visible text or image",
    href: a.href // propiedad absoluta
  }));
}

// ---------- Target blank validation (IMPROVED) ----------
function validateTargetBlank() {
  const container = getEmailContainer();
  if (!container) return { withTarget: 0, withoutTarget: 0, total: 0 };

  const anchors = container.querySelectorAll("a[href]");
  let withTarget = 0;
  let withoutTarget = 0;

  anchors.forEach(a => {
    // Solo dentro del contenedor del email
    if (!isVisible(a)) return;

    if (a.target === "_blank") {
      a.style.outline = "4px solid green";
      withTarget++;
    } else {
      a.style.outline = "4px solid red";
      withoutTarget++;
    }

    // Heredar borde a imágenes dentro del link
    const imgs = a.querySelectorAll("img");
    imgs.forEach(img => {
      img.style.outline = a.style.outline;
    });
  });

  return {
    withTarget,
    withoutTarget,
    total: anchors.length
  };
}

// ---------- Clickable areas with link validation (uses elements) ----------
async function highlightClickables() {
  const anchors = extractLinkElements(); // ahora sí devuelve elementos DOM

  if (!anchors || anchors.length === 0) {
    console.warn("⚠️ No visible links found in the email body.");
    return { done: true, painted: 0 };
  }

  function createLinkTag(element, text, color) {
    element.style.outline = `2px solid ${color}`;
    element.style.position = "relative";

    const tag = document.createElement("span");
    tag.textContent = text;
    tag.style.position = "absolute";
    tag.style.background = color;
    tag.style.color = "#fff";
    tag.style.fontSize = "12px";
    tag.style.padding = "2px 6px";
    tag.style.borderRadius = "8px";
    tag.style.top = "0";
    tag.style.left = "0";
    tag.style.zIndex = "9999";
    tag.style.pointerEvents = "none";

    // aseguramos posición relativa del contenedor
    if (element.parentElement && window.getComputedStyle(element.parentElement).position === 'static') {
      element.parentElement.style.position = "relative";
    }
    if (element.parentElement) element.parentElement.appendChild(tag);
  }

  let painted = 0;

  for (const a of anchors) {
    const href = a.href;
    if (!href) continue;
    if (href.startsWith("mailto:") || href.startsWith("tel:")) continue;

    try {
      // Envía al background; espera la respuesta
      const response = await chrome.runtime.sendMessage({
        action: "checkLink",
        url: href
      });

      // Si response es undefined o no tiene ok, tratamos como error
      if (response && response.ok) {
        createLinkTag(a, `✅ ${response.status}`, "#2a9d8f");
      } else {
        const statusText = response && response.status ? response.status : "Error";
        createLinkTag(a, `❌ ${statusText}`, "#e63946");
      }
      painted++;
    } catch (err) {
      console.error("Error checking link:", href, err);
      createLinkTag(a, "❌ Error", "#e63946");
      painted++;
    }
  }

  return { done: true, painted };
}

// ---------- Listener ----------
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractLinks") {
    // devuelve data serializable (para popup / links.html)
    const data = extractLinksData();
    sendResponse({ result: data });
    return; // respuesta sincrónica
  }

  if (request.action === "targetBlank") {
    const stats = validateTargetBlank();
    sendResponse({ result: stats });
    return;
  }

  if (request.action === "showLinks") {
    // highlightClickables es async; devolvemos la respuesta cuando termine
    highlightClickables().then(result => {
      sendResponse({ result });
    }).catch(err => {
      console.error("highlightClickables error:", err);
      sendResponse({ result: { done: false, error: err.message } });
    });
    return true; // important: keep channel open for async sendResponse
  }
});
