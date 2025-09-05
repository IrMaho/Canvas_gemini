document.addEventListener('DOMContentLoaded', () => {
    const canvasList = document.getElementById('canvasList');
    const statusMessage = document.getElementById('status-message');
    const scanBtn = document.getElementById('scanBtn');
    const logContainer = document.getElementById('log-container');
    
    // Modal elements
    const modal = document.getElementById('content-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    scanBtn.addEventListener('click', () => {
        statusMessage.textContent = 'در حال اسکن...';
        statusMessage.style.display = 'block';
        scanBtn.disabled = true;
        scanBtn.classList.add('loading');
        
        canvasList.innerHTML = '';
        logContainer.textContent = '';
        logContainer.style.display = 'none';

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { action: "scanNow" },
                    (response) => {
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
                
                // Add click listener to show modal
                item.addEventListener('click', () => {
                    modalTitle.textContent = canvas.title;
                    // ** FIX: Use innerHTML to render the code formatting correctly **
                    modalBody.innerHTML = canvas.content;
                    modal.style.display = 'flex';
                });
                
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

    // --- Modal Closing Logic ---
    modalCloseBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close modal if clicking on the overlay
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});

