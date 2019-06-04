import * as React from "react";
import styled from "styled-components";
import { Input, Label, Icon } from "semantic-ui-react";
import { parseQuery, getQueryModifiers, getQueryText } from "../lib/parseQuery";
import { TabQuery, PropsOf } from "../interfaces";

type Props = {
  query: TabQuery;
  onChange: (query: TabQuery) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

const SearchInput = styled(Input)`
  margin: 16px;
  margin-bottom: 0;

  .ui.label {
    display: block;
  }
`;

const QueryLabel = styled(Label)`
  background-color: rgba(0, 0, 0, 0.1) !important;
  border: 1px solid rgba(34, 36, 38, 0.15) !important;
  border-right: none;
  box-sizing: border-box;
`;

const modifierIcons = {
  "+": "add" as "add",
  "@": "at" as "at",
  "#": "hashtag" as "hashtag",
  "*": "asterisk" as "asterisk"
};

export const QueryInput = ({
  query,
  onChange,
  onKeyDown = () => {}
}: Props) => {
  const modifiers = getQueryModifiers(query);

  return (
    <SearchInput
      icon={query.type !== "addWindow"}
      labelPosition={modifiers.length > 0 ? "left" : undefined}
      placeholder={query.type === "addWindow" ? "New window name" : "Search"}
      autoFocus
      value={getQueryText(query)}
      onKeyDown={(e: any) => {
        if (e.key === "Backspace" && modifiers.length > 0) {
          if (e.target.selectionStart === 0 && e.target.selectionEnd === 0) {
            onChange(
              parseQuery(modifiers.slice(0, -1).join("") + getQueryText(query))
            );
          }
        }

        onKeyDown(e);
      }}
      onChange={(e: any) => {
        onChange(parseQuery(modifiers.join("") + e.target.value));
      }}
    >
      {modifiers.length > 0 && (
        <QueryLabel>
          {modifiers.map((modifier, index) => (
            <Icon
              key={modifier}
              style={{ margin: 0, marginLeft: index === 0 ? 0 : "8px" }}
              name={modifierIcons[modifier]}
            />
          ))}
        </QueryLabel>
      )}
      <input />
      {query.type !== "addWindow" && <Icon name="search" />}
    </SearchInput>
  );
};
