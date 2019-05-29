import * as React from "react";
import { TabLabel } from "./TabLabel";
import styled from "styled-components";
import { Button } from "semantic-ui-react";
import { TabList } from "./TabList";

interface Props {
  tabs: chrome.tabs.Tab[];
  maxTabs: number;
  onShowTabs: () => void;
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

export const TabPreview = ({ tabs, onShowTabs, maxTabs }: Props) => {
  if (tabs.length === 0) {
    return null;
  }

  return (
    <TabContainer>
      {tabs.slice(0, maxTabs).map(tab => (
        <TabLabel key={tab.id} tab={tab} />
      ))}
      {tabs.length > maxTabs ? (
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
          + {tabs.length - maxTabs} tabs
        </Button>
      ) : null}
    </TabContainer>
  );
};
