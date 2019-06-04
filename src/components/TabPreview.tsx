import * as React from "react";
import { TabLabel } from "./TabLabel";
import styled from "styled-components";
import { Button } from "semantic-ui-react";
import { ChromeTab, TabOrderQuery, ChromeWindow } from "../interfaces";
import { handleTabRearrangment } from "../lib/windowUtils";

interface Props {
  window: ChromeWindow;
  maxTabs: number;
  onShowTabs: () => void;
  onRearrangeTab: (query: TabOrderQuery) => void;
}

const TabContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(auto, max-content));
  width: 100%;
  padding: 8px 8px 16px 8px;

  > * {
    &:not(:first-child) {
      border-left: 1px solid rgba(0, 0, 0, 0.2);
    }
  }
`;

export const TabPreview = ({
  window,
  onShowTabs,
  onRearrangeTab,
  maxTabs
}: Props) => {
  if (window.tabs.length === 0) {
    return null;
  }

  return (
    <TabContainer>
      {window.tabs.slice(0, maxTabs).map((tab, index) => (
        <TabLabel
          key={tab.id}
          window={window}
          tab={tab}
          onHoverTab={handleTabRearrangment("x", index, tab, onRearrangeTab)}
          onDropTab={tabId => onRearrangeTab({ type: "commit", tabId })}
        />
      ))}
      {window.tabs.length > maxTabs ? (
        <Button
          onClick={e => {
            e.stopPropagation();
            onShowTabs();
          }}
          style={{
            borderLeft: "none",
            marginRight: "8px!important",
            whiteSpace: "nowrap"
          }}
          size="mini"
        >
          + {window.tabs.length - maxTabs} tabs
        </Button>
      ) : null}
    </TabContainer>
  );
};
