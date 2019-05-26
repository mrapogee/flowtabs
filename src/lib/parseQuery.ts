import { TabQuery } from "../interfaces";

export const parseQuery = (query: string): TabQuery => {
  if (query.startsWith("+")) {
    return {
      type: "addWindow",
      name: query.slice(1).trim()
    };
  }

  return { type: "search", query };
};
