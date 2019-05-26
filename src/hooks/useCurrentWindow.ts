import * as React from "react";

export const useCurrentWindow = () => {
  const [windowId, setCurrentWindow] = React.useState<number | null>(null);

  React.useEffect(() => {
    chrome.windows.getCurrent(window => {
      setCurrentWindow(window.id);
    });
  }, []);

  return windowId;
};
