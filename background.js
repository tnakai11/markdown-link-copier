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
        } else if (selectionText) {
            // Just text selected, not a link context (but we allowed 'selection' context).
            // If it's not a link, maybe we just ignore or copy as is? 
            // The user specifically asked for "selected link".
            // If they right click plain text, 'linkUrl' will be undefined.
            // We can just do nothing or maybe treat it as a potential link if it looks like one?
            // Let's stick to the requirement: "selected link".
            // So if linkUrl is missing, we probably shouldn't do anything or maybe just copy the text.
            // But the context menu says "Copy as Markdown".
            // If I select text "foo" and right click, "Copy as Markdown" -> maybe nothing?
            // Let's focus on the "link" context mainly.
        }
    }
});

function copyToClipboard(text, tabId) {
    // We can use scripting to execute a copy command in the tab
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (textToCopy) => {
            navigator.clipboard.writeText(textToCopy).then(() => {
                console.log('Copied to clipboard:', textToCopy);
            }).catch(err => {
                console.error('Failed to copy:', err);
            });
        },
        args: [text]
    });
}
