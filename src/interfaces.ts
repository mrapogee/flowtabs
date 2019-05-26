export interface WindowTaskState {
  taskName: string;
}

type Messages = { type: "closeWindow"; windowId: number };

export type ExtensionMessage = { isFromTabOnTask: true } & Messages;

export interface AddWindowQuery {
  type: "addWindow";
  name: string;
}

export interface SearchQuery {
  type: "search";
  query: string;
}

export type TabQuery = AddWindowQuery | SearchQuery;
