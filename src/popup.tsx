import * as React from "react";
import "semantic-ui-css/semantic.min.css";
import "./base.css";
import { render } from "react-dom";
import { Popup } from "./components/Popup";
import { DragDropContextProvider } from "react-dnd";
import HTML5Backend from "react-dnd-html5-backend";

render(
  <DragDropContextProvider backend={HTML5Backend}>
    <Popup />
  </DragDropContextProvider>,

  document.getElementById("app")
);
