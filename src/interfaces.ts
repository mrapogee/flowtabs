import * as React from "react";
import { Map } from "immutable";
import { Input } from "semantic-ui-react";

export interface WindowTaskState {
  savedTaskId: string | null;
  taskName: string;
}

export type WindowState = Map<number, WindowTaskState>;

export type SearchScope = "active" | "saved" | "all";
export type SearchContent = "tabs" | "tasks";

export interface AddWindowQuery {
  type: "addWindow";
  name: string;
}

export interface SearchQuery {
  type: "search";
  content: SearchContent;
  scope: SearchScope;
  query: string;
}

export type TabQuery = AddWindowQuery | SearchQuery;

export type PropsOf<T> = T extends React.ComponentType<infer props>
  ? props
  : never;
