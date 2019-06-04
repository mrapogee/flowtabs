import * as React from "react";
import styled from "styled-components";
import { Menu, Button } from "semantic-ui-react";
import {
  WindowState,
  TabQuery,
  SearchScope,
  ChromeWindow
} from "../interfaces";
import { QueryInput } from "./QueryInput";
import { defaultQuery } from "../lib/queries";

interface Props {
  query: TabQuery;
  onChangeQuery: (query: TabQuery) => void;
}

const HeaderContainer = styled.div`
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  z-index: 5;
  display: flex;
  align-items: stretch;
  flex-direction: column;
`;

const PaddedMenu = styled(Menu)`
  &&& {
    margin-right: auto !important;
    border-bottom: none !important;
    padding-bottom: 1px;
    margin-bottom: 0 !important;
  }
`;

const NavContainer = styled.div`
  display: flex;
  padding-top: 8px;
  align-items: center;
  padding-left: 16px;
  padding-right: 16px;
`;

const ContentTypeContainer = styled.div`
  && .ui.button.active {
    background-color: rgba(0, 0, 0, 0.1) !important;
    color: inherit !important;
  }
`;

const ScopeMenuItem = styled(Menu.Item)`
  line-height: 24px !important;
`;

const updateScope = (query: TabQuery, scope: SearchScope): TabQuery => {
  if (query.type === "search") {
    return {
      ...query,
      scope: scope
    };
  }

  return {
    type: "search",
    scope,
    content: "tasks",
    query: ""
  };
};

export const PopupHeader = ({ query, onChangeQuery }: Props) => {
  return (
    <HeaderContainer>
      <QueryInput query={query} onChange={onChangeQuery} />
      <NavContainer>
        <PaddedMenu pointing secondary>
          <ScopeMenuItem
            onClick={() => onChangeQuery(updateScope(query, "active"))}
            active={query.type !== "search" || query.scope === "active"}
            name="Active"
          />
          <ScopeMenuItem
            onClick={() => onChangeQuery(updateScope(query, "saved"))}
            active={query.type === "search" && query.scope === "saved"}
            name="Saved"
          />
          <ScopeMenuItem
            onClick={() => onChangeQuery(updateScope(query, "all"))}
            active={query.type === "search" && query.scope === "all"}
            name="All"
          />
        </PaddedMenu>
        <ContentTypeContainer>
          Search:
          <Button.Group basic size="mini" style={{ marginLeft: "8px" }}>
            <Button
              toggle
              onClick={() =>
                onChangeQuery(
                  query.type === "search"
                    ? { ...query, content: "tasks" }
                    : defaultQuery
                )
              }
              active={query.type !== "search" || query.content !== "tabs"}
            >
              Windows
            </Button>
            <Button
              toggle
              onClick={() => {
                onChangeQuery(
                  query.type === "search"
                    ? { ...query, content: "tabs" }
                    : {
                        type: "search",
                        content: "tabs",
                        scope: "active",
                        query: ""
                      }
                );
              }}
              active={query.type === "search" && query.content === "tabs"}
            >
              Tabs
            </Button>
          </Button.Group>
        </ContentTypeContainer>
      </NavContainer>
    </HeaderContainer>
  );
};
