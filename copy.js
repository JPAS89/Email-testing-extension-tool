// ---------- Helpers ----------

// Verifica si un elemento es visible
function isVisible(el) {
  const style = window.getComputedStyle(el);
  return style.display !== "none" &&
         style.visibility !== "hidden" &&
         el.offsetParent !== null;
}

// Extrae texto visible recursivamente
function getVisibleText(node) {
  let text = "";
  if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== "") {
    text += node.nodeValue.trim() + " ";
  } else if (node.nodeType === Node.ELEMENT_NODE && isVisible(node)) {
    // Skips outlook banners
    if (node.classList.contains("x_MsoNormalTable")) return text;
    // Skips Gmail download button
    if (node.classList.contains("ne2Ple-oshW8e-J9")) return text;

    const blockTags = [
      "P","DIV","SECTION","ARTICLE","HEADER","FOOTER","TR","TABLE","UL","OL","LI"
    ];
    let isBlock = blockTags.includes(node.nodeName);

    if (isBlock) text += "\n";

    for (let child of node.childNodes) {
      text += getVisibleText(child);
    }

    if (isBlock) text += "\n";
  }
  return text;
}

// Limpieza de texto común
function cleanText(raw) {
  return raw
    .replace(/\n\s*\n/g, "\n")     // Quita múltiples saltos de línea
    .replace(/\s+\n/g, "\n")       // Espacios antes de salto de línea
    .replace(/\s+([.,;!?])/g, "$1") // Espacio antes de puntuación
    .replace(/\s{2,}/g, " ")       // Espacios múltiples
    .trim();
}

// ---------- Core ----------

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

// Extrae texto según el ambiente
function extractContent(env) {
  let emailContainer;

  switch (env) {
    case "gmail":
      emailContainer = document.querySelector(".ii.gt");
      if (!emailContainer) return "No Gmail email content found.";
      break;

    case "outlook":
      emailContainer =
        document.querySelector('[aria-label="Message body"]') ||
        document.querySelector("#x_body-fix") ||
        document.querySelector('#focused div[role="document"]');

      if (!emailContainer) return "No Outlook email content found.";

      // Elimina banners de Outlook
      const banners = emailContainer.querySelectorAll(
        'table[style*="background-color:#ffff00"], .x_MsoNormalTable'
      );
      banners.forEach(banner => banner.remove());
      break;

    case "stage":
      emailContainer =
        document.querySelector("body > table > tbody") ||
        document.querySelector("#lt-accessibility-devtools");
      if (!emailContainer) return "No Stage email content found.";
      break;

    default:
      return "Environment not detected.";
  }

  let liveText = getVisibleText(emailContainer);
  return cleanText(liveText) || "No visible text extracted.";
}
// ---------- Highlight Bold ----------
function highlightBold() {
  // Select all elements that could potentially be bold.
  const candidates = document.querySelectorAll("b, strong, span, p, div, td, a, li");

  candidates.forEach(el => {
    // Get the final computed font-weight style.
    const fontWeight = window.getComputedStyle(el).getPropertyValue("font-weight");

    // Check if the font-weight is the keyword "bold" OR a numeric value >= 500.
    // Note: "normal" is 400, "bold" is 700.
    if (fontWeight === "bold" || parseInt(fontWeight) >= 500) {
      el.style.setProperty("outline", "2px solid red", "important");
      el.style.setProperty("outline-offset", "2px", "important");
    }
  });
}

// ---------- Highlight Italic ----------

function highlightItalic() {
  // Buscar elementos que podrían estar en cursiva
  const candidates = document.querySelectorAll("i, em, span, p, div, td, a, li");

  candidates.forEach(el => {
    // Obtener el estilo computado final
    const fontStyle = window.getComputedStyle(el).getPropertyValue("font-style");

    // Validar si el estilo es italic u oblique
    if (fontStyle === "italic" || fontStyle === "oblique") {
      el.style.setProperty("outline", "2px solid red", "important");
      el.style.setProperty("outline-offset", "2px", "important");
    }
  });
}

// ---------- Listener ----------

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractAuto") {
    const env = detectEnvironment();
    const text = extractContent(env);
    sendResponse({ environment: env, text });
  }

  if (request.action === "showBold") {
    const env = detectEnvironment();
    const result = highlightBold(env);
    sendResponse({ environment: env, result });
  }

  if (request.action === "showItalic") {
    const env = detectEnvironment();
    highlightItalic(); // aplica los estilos en el DOM
    sendResponse({ environment: env, result  });
  }
  
  return true;
});
