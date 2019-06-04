import * as React from "react";
import { Button, Dropdown, Icon } from "semantic-ui-react";
import { saveLocalWindowState, deleteSavedWindow } from "../lib/chromeActions";
import { ChromeTab, ChromeWindow, WindowFlowState } from "../interfaces";
import uuid = require("uuid");

interface Props {
  window: ChromeWindow;
  state: WindowFlowState;
}

export const SaveMenu = ({ window, state }: Props) => {
  const [ranSaved, onSetSaved] = React.useState(false);

  if (state.saved) {
    return (
      <Dropdown
        text="Saved"
        floating
        downward
        icon={false}
        trigger={
          <Button style={{ padding: "8px" }} basic size="mini">
            Saved <Icon name="dropdown" style={{ margin: 0 }} />
          </Button>
        }
        className="icon"
      >
        <Dropdown.Menu className="left">
          <Dropdown.Item onClick={() => deleteSavedWindow(state)}>
            <Icon name="trash" />
            <span className="text">Delete</span>
          </Dropdown.Item>
          <Dropdown.Item onClick={() => saveLocalWindowState(state)}>
            <Icon name="copy" />
            <span className="text">Clone</span>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    );
  }

  return (
    <Button
      style={{ padding: "8px" }}
      disabled={ranSaved}
      basic
      size="mini"
      onClick={(e: any) => {
        e.stopPropagation();
        saveLocalWindowState({
          ...state,
          tabs: window.tabs
        });
        onSetSaved(true);
        setTimeout(() => onSetSaved(false), 2000);
      }}
    >
      {ranSaved ? (
        <>
          <Icon name="check" /> Saved
        </>
      ) : (
        "Save"
      )}
    </Button>
  );
};
