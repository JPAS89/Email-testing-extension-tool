// Configuración centralizada
const subActionsConfig = {
  copy: [
    { value: "extractText", label: "Extract All Text" },
    { value: "showBold", label: "Show Bold" },
    { value: "showItalic", label: "Show Italic" },
  ],
  links: [
    { value: "extractLinks", label: "Extract All Links" },
    { value: "showLinks", label: "Validate Broken links" },
    { value: "targetBlank", label: "Validate Target Blank" },
  ],
  code: [
   // { value: "scanOcr", label: "Scan OCR" },
    { value: "showAlttags", label: "Show Alt tags" },
    { value: "showTitle", label: "Show Title" },
    { value: "showAriaLabel", label: "Show Aria Label" },
    { value: "showHeading", label: "Show Headings" },
    { value: "showImagesName", label: "Show Img Names" },
  ],
};

// Referencias
const actionSelect = document.getElementById("actionSelect");
const subActionSelect = document.getElementById("subActionSelect");

actionSelect.addEventListener("change", () => {
  const action = actionSelect.value;

  // Limpia y oculta por defecto
  subActionSelect.innerHTML = "";
  subActionSelect.style.display = "none";

  if (subActionsConfig[action]) {
    subActionSelect.style.display = "block";

    // Agregar opción inicial
    const defaultOption = document.createElement("option");
    defaultOption.text = "-- Select an option --";
    defaultOption.value = "";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    subActionSelect.appendChild(defaultOption);

    // Agregar las opciones dinámicamente
    subActionsConfig[action].forEach(opt => {
      const optionEl = document.createElement("option");
      optionEl.value = opt.value;
      optionEl.textContent = opt.label;
      subActionSelect.appendChild(optionEl);
    });
  }
});
