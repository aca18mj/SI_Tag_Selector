chrome.runtime.onInstalled.addListener(() => {
  let lastSearches = [];
  let grouping = true;

  chrome.storage.local.set({ lastSearches });
  chrome.storage.local.set({ grouping });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  chrome.tabs.query({ active: true, windowType: "normal", currentWindow: true },
    function (d) {
      if (message == 'extension-ready') {
        chrome.action.setBadgeText({ text: "R", tabId: d[0].id});
      }
    });
})