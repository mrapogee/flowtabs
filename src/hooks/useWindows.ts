import * as React from "react";

export const useWindows = () => {
  const [windows, setWindows] = React.useState<chrome.windows.Window[] | null>(
    null
  );

  React.useEffect(() => {
    const updateWindows = () => {
      chrome.windows.getAll(windows => {
        setWindows(windows);
      });
    };

    chrome.windows.onRemoved.addListener(updateWindows);
    chrome.windows.onCreated.addListener(updateWindows);

    updateWindows();

    return () => {
      chrome.windows.onCreated.removeListener(updateWindows);
      chrome.windows.onRemoved.removeListener(updateWindows);
    };
  }, []);

  return windows == null
    ? windows
    : windows.filter(window => window.type === "normal");
};
