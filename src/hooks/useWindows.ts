import * as React from "react";

const getTabs = (windowId: number) => {
  return new Promise<chrome.tabs.Tab[]>(resolve => {
    chrome.tabs.query({ windowId }, tabs => resolve(tabs));
  });
};

const getWindows = () => {
  return new Promise<chrome.windows.Window[]>(resolve => {
    chrome.windows.getAll(resolve);
  });
};

export const useWindows = () => {
  const [windows, setWindows] = React.useState<chrome.windows.Window[] | null>(
    null
  );

  React.useEffect(() => {
    const updateWindows = async () => {
      const windows = await getWindows();

      for (const window of windows) {
        window.tabs = await getTabs(window.id);
      }

      setWindows(windows);
    };

    chrome.windows.onRemoved.addListener(updateWindows);
    chrome.windows.onCreated.addListener(updateWindows);
    chrome.tabs.onUpdated.addListener(updateWindows);
    chrome.tabs.onRemoved.addListener(updateWindows);
    chrome.tabs.onCreated.addListener(updateWindows);

    updateWindows();

    return () => {
      chrome.windows.onCreated.removeListener(updateWindows);
      chrome.windows.onRemoved.removeListener(updateWindows);
      chrome.tabs.onUpdated.removeListener(updateWindows);
      chrome.tabs.onRemoved.removeListener(updateWindows);
      chrome.tabs.onCreated.removeListener(updateWindows);
    };
  }, []);

  return windows == null
    ? windows
    : windows.filter(window => window.type === "normal");
};
