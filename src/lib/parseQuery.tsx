import { TabQuery, SearchScope, SearchContent } from "../interfaces";
import { defaultQuery } from "./queries";

const searchModifierPattern = /^[@#\*]+/;

export const parseQuery = (query: string): TabQuery => {
  if (query == "") {
    return defaultQuery;
  }

  if (query.startsWith("+")) {
    return {
      type: "addWindow",
      name: query.slice(1)
    };
  }

  const match = query.match(searchModifierPattern);

  if (match == null) {
    return {
      type: "search",
      content: "tasks",
      scope: "active",
      query: query
    };
  }

  const [modifiersText] = match;

  const modifiers = modifiersText.split("").reverse();

  const content: SearchContent = modifiers.some(value => value === "#")
    ? "tabs"
    : "tasks";

  const scopeModIndex = modifiers.findIndex(mod => mod === "*" || mod === "@");
  const scope: SearchScope =
    scopeModIndex === -1
      ? "active"
      : modifiers[scopeModIndex] === "*"
      ? "all"
      : "saved";

  return {
    type: "search",
    scope,
    content,
    query: query.slice(modifiersText.length)
  };
};

const getContentModifiers = (content: SearchContent): Modifier[] => {
  if (content === "tabs") {
    return ["#"];
  }

  return [];
};

const getScopeModifiers = (scope: SearchScope): Modifier[] => {
  if (scope === "all") {
    return ["*"];
  }

  if (scope === "saved") {
    return ["@"];
  }

  return [];
};

const getScopeSymbol = (scope: SearchScope) => {
  if (scope === "all") {
    return "*";
  }

  if (scope === "saved") {
    return "@";
  }

  return "";
};

export const generateQueryString = (tabQuery: TabQuery): string => {
  if (tabQuery.type === "search") {
    const scopeSymbol = getScopeSymbol(tabQuery.scope);
    const contentSymbol = tabQuery.content === "tasks" ? "" : "#";

    return `${contentSymbol}${scopeSymbol}${tabQuery.query}`;
  }

  return `+${tabQuery.name}`;
};

export const getQueryText = (query: TabQuery) => {
  if (query.type === "addWindow") {
    return query.name;
  }

  if (query.type === "search") {
    return query.query;
  }

  return "";
};

export type Modifier = "+" | "@" | "*" | "#";

export const getQueryModifiers = (tabQuery: TabQuery): Modifier[] => {
  if (tabQuery.type === "addWindow") {
    return ["+"];
  }

  return [
    ...getContentModifiers(tabQuery.content),
    ...getScopeModifiers(tabQuery.scope)
  ];
};
