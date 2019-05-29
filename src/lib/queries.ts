import { SearchQuery } from "../interfaces";

export const defaultQuery: SearchQuery = {
  type: "search",
  content: "tasks",
  scope: "active",
  query: ""
};
