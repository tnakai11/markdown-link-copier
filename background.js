// Create the context menu item
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "copy-as-markdown",
        title: "Copy as Markdown",
        contexts: ["link", "selection"]
    });
});

// Handle the click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "copy-as-markdown") {
        // We need to get the link text. 
        // info.selectionText might be available if text was selected.
        // info.linkUrl is the URL.

        const linkUrl = info.linkUrl;
        const selectionText = info.selectionText;

        if (linkUrl) {
            // It's a link.
            // If we have selectionText, use it.
            // If not, we might want to try to get the text from the element.
            // For now, let's try to send a message to the content script to get the text of the clicked element if selectionText is missing.

            if (selectionText) {
                copyToClipboard(`[${selectionText}](${linkUrl})`, tab.id);
            } else {
                // Ask content script for the text of the element that was right-clicked
                chrome.tabs.sendMessage(tab.id, { action: "getClickedElementText", url: linkUrl }, (response) => {
                    const text = response && response.text ? response.text : "Link";
                    copyToClipboard(`[${text}](${linkUrl})`, tab.id);
                });
            }
        } else {
            // selectionText is present but linkUrl is missing (not a link).
            // Show a toast to explain why it wasn't copied as a link.
            console.log("Sending toast: No link detected.");
            chrome.tabs.sendMessage(tab.id, {
                action: "showToast",
                message: "No link detected in selection. Please right-click on a link.",
                type: "error"
            });
        }
    }
});

function copyToClipboard(text, tabId) {
    // We can use scripting to execute a copy command in the tab
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (textToCopy) => {
            return navigator.clipboard.writeText(textToCopy)
                .then(() => true)
                .catch(err => {
                    console.error('Failed to copy:', err);
                    return false;
                });
        },
        args: [text]
    }, (results) => {
        if (chrome.runtime.lastError || !results || !results[0] || results[0].result !== true) {
            showErrorToast(tabId);
        } else {
            // Optional: Show success toast
            // showSuccessToast(tabId);
        }
    });
}

function showErrorToast(tabId) {
    console.log("Attempting to show error toast...");
    chrome.tabs.sendMessage(tabId, {
        action: "showToast",
        message: "Failed to copy link to clipboard.",
        type: "error"
    });
}
