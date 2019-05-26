import * as React from "react";

export const useTabs = (window: chrome.windows.Window) => {
  const [tabs, setTabs] = React.useState<chrome.tabs.Tab[]>([]);

  React.useEffect(() => {
    const updateTabs = () => {
      chrome.tabs.query({ windowId: window.id }, tabs => {
        setTabs(tabs);
      });
    };

    chrome.tabs.onUpdated.addListener(updateTabs);
    chrome.tabs.onRemoved.addListener(updateTabs);
    chrome.tabs.onCreated.addListener(updateTabs);

    updateTabs();

    return () => {
      chrome.tabs.onUpdated.removeListener(updateTabs);
      chrome.tabs.onRemoved.removeListener(updateTabs);
      chrome.tabs.onCreated.removeListener(updateTabs);
    };
  }, [window.id]);

  return tabs;
};
