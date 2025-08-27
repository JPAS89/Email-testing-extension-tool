// verify if an element is visible
function isVisible(el) {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           el.offsetParent !== null;
  }
  
  // extracts live text from  DOM recursively 
  function getVisibleText(node) {
    let text = '';
    if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== '') {
      text += node.nodeValue.trim() + ' ';
    } else if (node.nodeType === Node.ELEMENT_NODE && isVisible(node)) {
      // skips outlook banners
    if (node.classList.contains('x_MsoNormalTable')) return text;
     //if (node.style && node.style.backgroundColor === 'rgb(255, 255, 0)') return text;  
      const blockTags = ['P', 'DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'TR', 'TABLE', 'UL', 'OL', 'LI'];
      let isBlock = blockTags.includes(node.nodeName);
  
      if (isBlock) text += '\n';
  
      for (let child of node.childNodes) {
        text += getVisibleText(child);
      }
  
      if (isBlock) text += '\n';
    }
    return text;
  }
  
  //  get the text from Gmail
  function extractGmailContent() {
    const emailContainer = document.querySelector('.ii.gt'); // Gmail email body selector
  
    if (!emailContainer) {
      return 'No email content found (.ii.gt not detected).';
    }
  
    let liveText = getVisibleText(emailContainer)
      .replace(/\n\s*\n/g, '\n') // Remove multiple blank lines
      .replace(/\s+\n/g, '\n')   // Remove extra spaces before new lines
      .replace(/\s+([.,;!?])/g, '$1') // deletes blank spaces before punctuaction symbols
      .trim();
  
    return liveText || 'No visible text extracted.';
  }

  // get the live texto from oUTLOOK
  function extractOutlookContent() {
    let emailContainer =
      document.querySelector('[aria-label="Message body"]') ||
      document.querySelector('#x_body-fix') ||
      document.querySelector('#focused div[role="document"]');
  
    if (!emailContainer) {
      return 'No email content found in Outlook.';
    }
  
    // deletes banners from outlook (e.g "External to the Group")
    const banners = emailContainer.querySelectorAll('table[style*="background-color:#ffff00"], .x_MsoNormalTable');
    banners.forEach(banner => banner.remove());
  
    let liveText = getVisibleText(emailContainer)
      .replace(/\n\s*\n/g, '\n')   // Remove multiple blank lines
      .replace(/\s+\n/g, '\n')     // Remove extra spaces before new lines
      .replace(/\s+([.,;!?])/g, '$1') // deletes blank spaces before punctuaction symbols
      .replace(/\s{2,}/g, ' ')     // quita espacios múltiples
      .trim();
  
    return liveText || 'No visible text extracted.';
  }
  
  
  // Listener to get messages from  popup or background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractGmail") {
      sendResponse({ text: extractGmailContent() });
    }
  
    if (request.action === "extractOutlook") {
      sendResponse({ text: extractOutlookContent() });
    }
  
    return true;
  });
  