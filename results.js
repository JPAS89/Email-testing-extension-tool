document.addEventListener('DOMContentLoaded', () => {
    const linksList = document.getElementById('linksList');
    const summaryEl = document.getElementById('summary');
    const copyBtn = document.getElementById('copyBtn');
    const csvBtn = document.getElementById('csvBtn');
    const escapeHTML = (str) => str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  
    // 1. Retrieve the links from session storage
    chrome.storage.session.get(['extractedLinks'], (data) => {
      const links = data.extractedLinks;
      if (!links || links.length === 0) {
        summaryEl.textContent = 'No links found.';
        return;
      }
  
      summaryEl.innerHTML = `Found <strong>${links.length}</strong> links:`;
  
      // 2. Populate the list with the links
      links.forEach(link => {
        const li = document.createElement('li');
        li.innerHTML = `
          <a href="${link.href}" target="_blank" rel="noopener noreferrer">
            <span class="link-text">${escapeHTML(link.text)}</span>
            <span class="link-href">${escapeHTML(link.href)}</span>
          </a>
        `;
        linksList.appendChild(li);
      });
    });
  
    // 3. Set up the copy button listener
    copyBtn.addEventListener('click', () => {
      const linkElements = document.querySelectorAll('#linksList li a');
      const urls = Array.from(linkElements).map(a => a.href);
      const textToCopy = urls.join('\n'); // Correctly uses a single newline
  
      navigator.clipboard.writeText(textToCopy).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = 'Copy All Links';
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy links: ', err);
        alert('Could not copy links to clipboard.');
      });
    });

    // 4. CSV Export button (only URLs)
    csvBtn.addEventListener('click', ()=> {
        const linkElements = document.querySelectorAll('#linksList li a');
        if (linkElements.length === 0){
            alert('No links found');
            return;
        }
        let csvContent = "";
        linkElements.forEach(a =>{
            const href = a.href || '';
            const safeHref = `"${href.replace(/"/g, '""')}"`;
            csvContent += `${safeHref}\n`;
        });
        // Create blob & download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = 'extracted_links.csv';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    });

