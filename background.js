chrome.runtime.onInstalled.addListener(() => {
  let lastSearches = [];
  let grouping = true;

  chrome.storage.local.set({ lastSearches });
  chrome.storage.local.set({ grouping });
});