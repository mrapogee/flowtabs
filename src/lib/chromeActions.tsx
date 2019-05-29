export const showTab = (id: number) => {
  chrome.tabs.get(id, tab => {
    chrome.tabs.update(id, { selected: true });
    showWindow(tab.windowId);
  });
};

export const showWindow = (id: number) => {
  return chrome.windows.update(id, { focused: true });
};
