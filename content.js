let lastClickedElement = null;

document.addEventListener("contextmenu", (event) => {
    lastClickedElement = event.target;
}, true);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getClickedElementText") {
        let text = "";
        if (lastClickedElement) {
            // If the clicked element is an image inside a link, we might want the alt text or the parent anchor's text.
            // Let's traverse up to find the anchor.
            const anchor = lastClickedElement.closest('a');
            if (anchor) {
                text = anchor.innerText || anchor.textContent;
                // If empty (e.g. image link), try alt text of image
                if (!text.trim()) {
                    const img = anchor.querySelector('img');
                    if (img) {
                        text = img.alt;
                    }
                }
            }
        }
        sendResponse({ text: text.trim() });
    } else if (request.action === "showToast") {
        showToast(request.message, request.type);
    }
});

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `markdown-link-copier-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger reflow
    toast.offsetHeight;

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}
