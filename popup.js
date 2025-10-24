document.addEventListener("DOMContentLoaded", () => {
  // --- UI Elements ---
  const scanBtn = document.getElementById("scanBtn");
  const copyBtn = document.getElementById("copyBtn");
  const clearBtn = document.getElementById("clearBtn");
  const resultsBox = document.getElementById("resultsBox");
  const actionSelect = document.getElementById("actionSelect");
  const subActionSelect = document.getElementById("subActionSelect");

  // --- Configuration Map ---
  // This object drives the extension's logic, making it easy to add new features.
  const actionsConfig = {
    copy: {
      file: "copy.js",
      subActions: {
        extractText: { action: "extractAuto" },
        showBold: { action: "showBold" },
        showItalic: { action: "showItalic" }
      }
    },
    links: {
      file: "links.js",
      subActions: {
        extractLinks: { action: "extractLinks" },
        targetBlank: { action: "targetBlank" },
        showLinks: { action: "showLinks" }
        // Add other link sub-actions here
      }
    },
    code: {
      file: "code.js",
      subActions: {
        showAlttags: { action: "showAlttags" },
        showTitle: { action: "showTitle" },
        showAriaLabel: { action: "showAriaLabel" },
        showHeading: { action: "showHeading" },
        showImagesName: { action: "showImagesName" }
        // Add other link sub-actions here
      }
    }

    // Add the 'ada' category here when ready
  };

  // --- Response Handler ---

// NEW HELPER: This function creates the HTML for the new tab with link results.
// In popup.js

// In popup.js

// In popup.js, REPLACE the entire displayLinksInNewTab function with this:

function displayLinksInNewTab(links) {
  if (!links || links.length === 0) {
    resultsBox.textContent = "No visible links were found in the email.";
    return;
  }

  // 1. Save the links to session storage so the new tab can access them.
  chrome.storage.session.set({ extractedLinks: links }, () => {
    // 2. Open our dedicated results.html page.
    chrome.tabs.create({
      url: chrome.runtime.getURL("links.html")
    });
  });
}

// UPDATED: The main response handler, now with special logic for link arrays.
function handleResponse(response) {
  if (chrome.runtime.lastError) {
    resultsBox.textContent = "Error: " + chrome.runtime.lastError.message;
    return;
  }
  if (!response) {
    resultsBox.textContent = "No response from the content script.";
    return;
  }

  // --- NEW: Handle Link Extraction ---
  // Checks if the result is an array and its first element looks like a link object.
  if (Array.isArray(response.result) && response.result.length > 0 && response.result[0].href) {
    displayLinksInNewTab(response.result);
    resultsBox.textContent = `Success! Opened ${response.result.length} links in a new tab.`;
    return; // Stop processing here
  }
  
  // --- Existing Logic (Unchanged) ---
  let output = "";
  if (response.text) {
    output = response.text;
  } else if (response.result) {
    // This will now only handle non-link arrays (e.g., an array of strings).
    output = Array.isArray(response.result) ? response.result.join("\n") : response.result;
  } else if (typeof response === "string") {
    output = response;
  }
  
  if (output) {
    resultsBox.textContent = output;
  } else {
    
    resultsBox.textContent = "Action completed successfully.";
  }
}

  // --- Main Scan Logic ---
  scanBtn.addEventListener("click", async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        resultsBox.textContent = "Could not find an active tab.";
        return;
      }

      const action = actionSelect.value;
      const subAction = subActionSelect.value;

      // Look up the action in our config map
      const mainActionConfig = actionsConfig[action];
      const subActionConfig = mainActionConfig?.subActions[subAction];

      if (!mainActionConfig || !subActionConfig) {
        resultsBox.textContent = "Please select a valid option";
        return;
      }

      // 1. Inject the required script file
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [mainActionConfig.file],
      });

      // 2. Send the message to the now-injected script
      chrome.tabs.sendMessage(tab.id, subActionConfig, handleResponse);

    } catch (err) {
      resultsBox.textContent = "An unexpected error occurred: " + err.message;
      console.error(err);
    }
  });

  // --- Helper Buttons ---
  copyBtn.addEventListener("click", () => {
    const text = resultsBox.textContent.trim();
    if (text) {
      navigator.clipboard.writeText(text)
        .then(() => alert("Results copied to clipboard!"))
        .catch(err => alert("Failed to copy: " + err));
    } else {
      alert("No results to copy.");
    }
  });

  clearBtn.addEventListener("click", () => {
    resultsBox.textContent = "";
  });
});