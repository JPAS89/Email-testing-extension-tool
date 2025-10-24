// ---------- Helpers ----------
function isVisible(el) {
    const style = window.getComputedStyle(el);
    return style.display !== "none" &&
           style.visibility !== "hidden" &&
           el.offsetParent !== null;
  }
  
  // Detecta el ambiente automáticamente
  function detectEnvironment() {
    if (document.querySelector(".ii.gt")) return "gmail";
    if (document.querySelector('[aria-label="Message body"]') ||
        document.querySelector("#x_body-fix") ||
        document.querySelector('#focused div[role="document"]')) return "outlook";
    if (document.querySelector("body > table > tbody") ||
        document.querySelector("#lt-accessibility-devtools")) return "stage";
    return null;
  }
  
  // Devuelve el contenedor principal del correo según el entorno
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
  
  // Crea una etiqueta visual sobre un elemento
  function createTag(element, text, color) {
    element.style.outline = `2px solid ${color}`;
    element.style.position = "relative";
  
    const tag = document.createElement("span");
    tag.textContent = text;
  
    tag.style.position = "absolute";
    tag.style.background = color;
    tag.style.color = "#fff";
    tag.style.fontSize = "12px";
    tag.style.padding = "8px 8px"; // más espacio
    tag.style.borderRadius = "6px";
    //tag.style.top = "-1em"; // lo movemos arriba del elemento
    tag.style.left = "0";
    tag.style.whiteSpace = "nowrap"; // evita que el texto se parta
    tag.style.maxWidth = "300px"; // límite de ancho razonable
    tag.style.overflow = "hidden";
    tag.style.textOverflow = "ellipsis"; // añade “…” si el texto es demasiado largo
    tag.style.zIndex = "9999";
    tag.style.pointerEvents = "none";
    tag.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
    
    // aseguramos que el contenedor pueda posicionar el tag
    if (window.getComputedStyle(element.parentElement).position === "static") {
      element.parentElement.style.position = "relative";
    }
  
    element.parentElement.appendChild(tag);
  }
  
  
  // Plantilla genérica para cualquier tipo de análisis
  function processElements(selector, getText, color) {
    const container = getEmailContainer();
    if (!container) return [];
  
    const elements = container.querySelectorAll(selector);
    const visibleElements = [];
  
    elements.forEach(el => {
      if (isVisible(el)) {
        const text = getText(el);
        visibleElements.push({ element: el, text });
      }
    });
  
    visibleElements.forEach(({ element, text }) => {
      createTag(element, text, color);
    });
  
    return visibleElements.map(({ text }) => text);
  }
  
  // ---------- Alt tags ----------
  function alttags() {
    return processElements("img", el => {
      const alt = el.getAttribute("alt");
      return alt ? `Alt: ${alt.trim()}` : "Alt: (none)";
    }, "#e63946");
  }
  
  // ---------- Title tags ----------
  function titletags() {
    return processElements("[title]", el => {
      const title = el.getAttribute("title");
      return title ? `Title: ${title.trim()}` : "Title: (none)";
    }, "#e63946");
  }
  
  // ---------- Aria labels ----------
  function arialabels() {
    return processElements("[aria-label], [aria-labelledby]", el => {
      let aria = el.getAttribute("aria-label");
      if (!aria) {
        const labelledby = el.getAttribute("aria-labelledby");
        if (labelledby) {
          const ref = document.getElementById(labelledby);
          if (ref) aria = ref.textContent.trim();
        }
      }
      return aria ? `aria-label: ${aria}` : "aria-label: (none)";
    }, "#e63946");
  }
  // ---------- Headings ----------
function showHeadings() {
    return processElements(
      "h1, h2, h3, h4, h5, h6",
      el => {
        const level = el.tagName.toLowerCase(); // gets "h1", "h2", etc.
        return `${level.toUpperCase()}`;
      },
      "#e63946"
    );
  }
  // ---------- Image names ----------
function imageNames() {
    return processElements(
      "img",
      el => {
        const src = el.getAttribute("src");
        if (!src) return "Image: (no src)";
        const name = src.split("/").pop().split("?")[0]; // obtiene solo el nombre del archivo
        return `Image: ${name}`;
      },
      "#e63946"
    );
  }
  
  
  // ---------- Listener ----------
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showAlttags") {
      alttags();
      sendResponse({ success: true });
    } else if (request.action === "showTitle") {
      titletags();
      sendResponse({ success: true });
    } else if (request.action === "showAriaLabel") {
      arialabels();
      sendResponse({ success: true });
    } else if (request.action === "showHeading") {
        showHeadings();
        sendResponse({ success: true });
      }
      else if (request.action === "showImagesName") {
        imageNames();
        sendResponse({ success: true });
      }
    return true;
  });
  