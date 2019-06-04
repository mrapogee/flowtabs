import { from } from "rxjs";

export const getCurrentWindow = () => {
  return from(
    new Promise<number>(resolve => {
      chrome.windows.getCurrent(window => {
        resolve(window.id);
      });
    })
  );
};
