console.log('[Gemini Monitor] Content script loaded. v6.0 (Deep Search Re-enabled)');

// This function recursively searches through the document and all open shadow roots.
// This is critical as the target elements are inside a shadow DOM.
function deepQuerySelectorAll(selector, root = document) {
    let results = [];
    try {
        results.push(...root.querySelectorAll(selector));
    } catch (e) {
        // Ignore errors in edge cases
    }
    
    const elementsWithShadowRoot = root.querySelectorAll('*');
    elementsWithShadowRoot.forEach(element => {
        if (element.shadowRoot && element.shadowRoot.mode === 'open') {
             results.push(...deepQuerySelectorAll(selector, element.shadowRoot));
        }
    });
    
    return results;
}

function runFullScan() {
    const logs = [];
    logs.push("--- Diagnostic Report Start (v6.0) ---");
    logs.push(`Timestamp: ${new Date().toISOString()}`);

    // ** مهم: استفاده از انتخاب‌گرهای نهایی همراه با جستجوی عمیق **
    const mainSelector = '.attachment-container.immersive-entry-chip';
    const titleSelector = '.gds-title-m';
    const subtitleSelector = '.creation-timestamp';
    
    logs.push(`Starting deep scan with selector: "${mainSelector}"`);
    
    const canvasElements = deepQuerySelectorAll(mainSelector);
    
    logs.push(`Deep scan finished. Found ${canvasElements.length} total canvas containers.`);

    const canvases = [];
    if (canvasElements.length > 0) {
        logs.push("Analyzing found elements...");
        canvasElements.forEach((el, index) => {
            const titleEl = el.querySelector(titleSelector);
            const subtitleEl = el.querySelector(subtitleSelector);

            if (titleEl && subtitleEl) {
                const title = titleEl.textContent.trim();
                const subtitle = subtitleEl.textContent.trim();
                logs.push(`  - ✅ Success! Found Canvas: "${title}"`);
                canvases.push({ title, subtitle });
            } else {
                 logs.push(`  - ⚠️ Warning! Found a container but it was missing title or subtitle.`);
            }
        });
    }
    
    logs.push(`Scan complete. Total valid canvases found: ${canvases.length}.`);
    logs.push("--- Diagnostic Report End ---");
    
    return { canvases, logs }; 
}

// --- Message Listener ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scanNow") {
        const scanResult = runFullScan();
        sendResponse({ report: scanResult });
    }
    return true; // Keep message channel open for async response
});

