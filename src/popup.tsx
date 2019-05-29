import * as React from "react";
import "semantic-ui-css/semantic.min.css";
import "./base.css";
import { render } from "react-dom";
import { WindowTaskState } from "./interfaces";
import { Map } from "immutable";
import { Popup } from "./components/Popup";

chrome.windows.getAll(windows => {
  const initialWindows = Map<string, WindowTaskState>(
    JSON.parse(localStorage.getItem("tabontask-active-tabs") || "{}")
  )
    .mapKeys(key => Number(key))
    .filter((value, key) => windows.some(window => window.id === key));

  render(
    <Popup initialWindowsState={initialWindows} />,
    document.getElementById("app")
  );
});
