document.addEventListener('DOMContentLoaded', () => {
    const canvasList = document.getElementById('canvasList');
    const statusMessage = document.getElementById('status-message');
    const scanBtn = document.getElementById('scanBtn');
    const logContainer = document.getElementById('log-container');

    scanBtn.addEventListener('click', () => {
        // UI feedback for scanning
        statusMessage.textContent = 'در حال اسکن...';
        statusMessage.style.display = 'block';
        scanBtn.disabled = true;
        scanBtn.classList.add('loading');
        
        // Clear previous results
        canvasList.innerHTML = '';
        logContainer.textContent = '';
        logContainer.style.display = 'none';

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { action: "scanNow" },
                    (response) => {
                        // Restore button state
                        scanBtn.disabled = false;
                        scanBtn.classList.remove('loading');

                        if (chrome.runtime.lastError) {
                            statusMessage.textContent = 'خطا در ارتباط با صفحه. لطفاً صفحه Gemini را رفرش کرده و دوباره امتحان کنید.';
                            console.error(chrome.runtime.lastError.message);
                            return;
                        }

                        if (response && response.report) {
                            renderReport(response.report);
                        } else {
                            statusMessage.textContent = 'پاسخ نامعتبری از اسکریپت دریافت شد.';
                        }
                    }
                );
            } else {
                statusMessage.textContent = 'تب فعال پیدا نشد.';
                scanBtn.disabled = false;
                scanBtn.classList.remove('loading');
            }
        });
    });

    function renderReport(report) {
        const { canvases, logs } = report;

        if (canvases.length > 0) {
            statusMessage.style.display = 'none';
            logContainer.style.display = 'none';
            
            // Show newest first
            canvases.reverse().forEach(canvas => {
                const item = document.createElement('li');
                item.className = 'canvas-item';
                item.innerHTML = `
                    <div class="canvas-icon">📄</div>
                    <div class="canvas-details">
                        <div class="canvas-title">${escapeHTML(canvas.title)}</div>
                        <div class="canvas-subtitle">${escapeHTML(canvas.subtitle)}</div>
                    </div>
                `;
                canvasList.appendChild(item);
            });
        } else {
            statusMessage.textContent = 'هیچ Canvas معتبری یافت نشد. گزارش عیب‌یابی را برای بررسی ارسال کنید.';
            statusMessage.style.display = 'block';
            logContainer.textContent = logs.join('\n');
            logContainer.style.display = 'block';
        }
    }

    function escapeHTML(str) {
        const p = document.createElement('p');
        p.textContent = str;
        return p.innerHTML;
    }
});
