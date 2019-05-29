import * as React from "react";
import { TabLabel } from "./TabLabel";
import styled, { css } from "styled-components";
import { ResetButton } from "./ResetButton";
import { Icon } from "semantic-ui-react";

interface Props {
  tabs: chrome.tabs.Tab[];
  selectedTab?: number | null;
  onSelectTab?: (id: number | null) => void;
}

const TabContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;

  && > * {
    padding: 12px 16px;
    border-left: none;
    &:not(:last-child) {
    }
  }
`;

const CloseButton = styled(ResetButton)`
  color: #5e5e5e;
  padding: 8px;
  margin: -8px;
`;

export const TabList = ({
  tabs,
  selectedTab,
  onSelectTab = () => {}
}: Props) => {
  return (
    <TabContainer>
      {tabs.map(tab => (
        <TabLabel
          selected={selectedTab === tab.id}
          onMouseEnter={() => tab.id != null && onSelectTab(tab.id)}
          onMouseLeave={() => tab.id != null && onSelectTab(null)}
          key={tab.id}
          tab={tab}
          actions={
            <CloseButton
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                tab.id && chrome.tabs.remove(tab.id);
              }}
            >
              <Icon name="close" />
            </CloseButton>
          }
        />
      ))}
    </TabContainer>
  );
};
