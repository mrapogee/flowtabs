import * as React from "react";
import { Map } from "immutable";
import { TAB } from "./lib/dragTypes";

export interface WindowFlowState {
  stateId: string | null;
  windowId: number | null;
  name: string;
  sync: boolean;
  saved: boolean;
  tabs?: ChromeTab[];
}

export interface FlowWindowStateSet {
  [taskId: string]: WindowFlowState;
}

export interface WindowMappings {
  [windowId: string]: string;
}

export type BID = string | number;

export interface ChromeWindow<ID = string | number> {
  id: ID;
  active: boolean;
  state?: WindowFlowState;
  tabs: ChromeTab[];
}

export interface ChromeTab<ID = number | string> {
  id: ID;
  url: string;
  title: string;
  favIconUrl: string | null;
  windowId: number;
}

export type WindowState = Map<number, WindowFlowState>;

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

export type RectCorner = { y: "top" | "bottom"; x: "left" | "right" };

export interface DragTabItem {
  type: typeof TAB;
  tab: ChromeTab;
}

export type TabOrderPreviewQuery = {
  type: "preview";
  windowId: BID;
  tab: ChromeTab;
  by: number;
  siblingId: BID | null;
};

export type TypeOrderCommitQuery = { type: "commit"; tabId: BID };

export type TabOrderQuery = TabOrderPreviewQuery | TypeOrderCommitQuery;
