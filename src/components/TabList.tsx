import * as React from "react";
import { TabLabel } from "./TabLabel";
import styled, { css } from "styled-components";
import { ResetButton } from "./ResetButton";
import { Icon } from "semantic-ui-react";
import { ChromeTab, TabOrderQuery, ChromeWindow, BID } from "../interfaces";
import { handleTabRearrangment } from "../lib/windowUtils";
import { removeTab } from "../lib/chromeActions";

interface Props {
  window: ChromeWindow;
  selectedTab?: BID | null;
  onSelectTab?: (id: BID | null) => void;
  onRearrangeTab: (query: TabOrderQuery) => void;
}

const TabContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;

  && > * {
    border-left: none;
    height: 40px;
    &:not(:last-child) {
    }
  }
`;

const CloseButton = styled(ResetButton)`
  color: #5e5e5e;
  padding: 0 16px;
  align-self: stretch;
  font-size: 16px;

  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }
`;

export const TabList = ({
  window,
  selectedTab,
  onRearrangeTab,
  onSelectTab = () => {}
}: Props) => {
  return (
    <TabContainer>
      {window.tabs.map((tab, index) => (
        <TabLabel
          key={tab.id}
          window={window}
          selected={selectedTab === tab.id}
          onHoverTab={handleTabRearrangment("y", index, tab, onRearrangeTab)}
          onDropTab={tabId => onRearrangeTab({ type: "commit", tabId })}
          onMouseMove={() =>
            tab.id != null && selectedTab !== tab.id && onSelectTab(tab.id)
          }
          onMouseLeave={() => tab.id != null && onSelectTab(null)}
          tab={tab}
          actions={
            <CloseButton
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                removeTab(window.state!, tab.id);
              }}
            >
              <Icon fitted name="close" />
            </CloseButton>
          }
        />
      ))}
    </TabContainer>
  );
};
