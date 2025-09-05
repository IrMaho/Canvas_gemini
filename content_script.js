console.log('[Gemini Monitor] Content script loaded. v14.0 (Final Parent Fix)');

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
    logs.push("--- Diagnostic Report Start (v14.0) ---");
    logs.push(`Timestamp: ${new Date().toISOString()}`);

    // ** THE CONTRACT FIX **
    // We establish a contract: I (the assistant) will always prefix canvas titles with "🗿c:".
    // The script will now exclusively look for this prefix in title elements.
    // This makes the detection independent of any website DOM changes.
    
    const CONTRACT_PREFIX = '🗿c:';
    const titleSelector = '.gds-title-m';
    const subtitleSelector = '.creation-timestamp';
    // ** THE CRITICAL UPDATE **: The parent container's class name has changed again.
    // Based on the latest source code, this is the new correct selector.
    const parentSelector = '.response-container'; 
    const contentSelector = '.response-container-content'; 
    
    logs.push(`Starting contract-based scan by looking for titles with prefix: "${CONTRACT_PREFIX}"`);
    
    const allTitles = deepQuerySelectorAll(titleSelector);
    
    logs.push(`Scan found ${allTitles.length} potential titles. Filtering by contract prefix...`);

    const canvases = [];
    if (allTitles.length > 0) {
        allTitles.forEach((titleEl) => {
            const titleText = titleEl.textContent.trim();

            // Check if the title adheres to our contract.
            if (titleText.startsWith(CONTRACT_PREFIX)) {
                logs.push(`  - ✅ Contract match found: "${titleText}"`);
                const parentContainer = titleEl.closest(parentSelector);

                if (parentContainer) {
                    // With the correct parent, now find the content and subtitle within it.
                    const contentEl = parentContainer.querySelector(contentSelector);
                    // The subtitle is often inside a different sibling element, so we search the whole parent.
                    const subtitleEl = parentContainer.querySelector(subtitleSelector);

                    if (contentEl && subtitleEl) {
                        // Remove the prefix for a cleaner display in the popup.
                        const cleanTitle = titleText.substring(CONTRACT_PREFIX.length).trim();
                        const subtitle = subtitleEl.textContent.trim();
                        const content = contentEl.innerHTML;
                        canvases.push({ title: cleanTitle, subtitle, content });
                         logs.push(`  - ✅ Success! Found all parts for "${cleanTitle}"`);
                    } else {
                        logs.push(`  - ⚠️ Warning! Contract match found, but content/subtitle was missing within parent.`);
                    }
                } else {
                    logs.push(`  - ⚠️ Warning! Contract match found, but could not find its parent container ('${parentSelector}').`);
                }
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

