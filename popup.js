const gmailBtn = document.getElementById('gmailBtn');
const outlookBtn = document.getElementById('outlookBtn');
const scanBtn = document.getElementById('scanBtn');
const resultsBox = document.getElementById('resultsBox');
const copyBtn = document.getElementById('copyBtn');

let selectedClient = 'gmail';
scanBtn.disabled=true;

// change email client
gmailBtn.addEventListener('click', () => {
  selectedClient = 'gmail';
  gmailBtn.disabled = true;
  outlookBtn.disabled = false;
  scanBtn.disabled=false;

});

outlookBtn.addEventListener('click', () => {
  selectedClient = 'outlook';
  outlookBtn.disabled = true;
  gmailBtn.disabled = false;
  scanBtn.disabled=false;

});

// scann the  email
scanBtn.addEventListener('click', () => {
  resultsBox.textContent = 'Extracting email text...';

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: selectedClient === 'gmail' ? "extractGmail" : "extractOutlook" }, (response) => {
      if (chrome.runtime.lastError) {
        resultsBox.textContent = 'Error: Content script not loaded. Please try to refresh the page or make sure you are on a email client window. If the issue persists contact the administrador.';
      } else {
        resultsBox.textContent = response?.text || 'No text extracted.';
      }
    });
  });
});

// Copy text 
copyBtn.addEventListener('click', () => {
  const text = resultsBox.textContent;
  if (text.trim()) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Text copied to clipboard!');
    });
  }
});

// clean the results box and reset the app
const clearBtn = document.getElementById('clearBtn');

clearBtn.addEventListener('click', () => {
  resultsBox.textContent = '';
  gmailBtn.disabled = false;
  outlookBtn.disabled = false;
  scanBtn.disabled=true;

});