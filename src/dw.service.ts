import qs from "querystring";
import { FetchFn } from "@mediaurl/sdk/src/tasks";
import fetch from "node-fetch";

export interface InformationSpace {
  id: number;
  news: NewsItem[];
}

export interface NewsItem {}

export interface NewsContent {
  id: number;
  name: string;
  shortTitle: string;
  contentDate: string;
  __typename: "Video" | "Article";
}

export interface InformationSpace {}

export const executeQuery = <T>(
  opName: string,
  payload: any,
  fetcher: FetchFn
): Promise<T> => {
  const url =
    "https://beta.dw.com/graphql?" +
    `&operationName=${opName}` +
    `&variables=${payload}` +
    `&extensions={\"persistedQuery\":{\"version\":1,\"sha256Hash\":\"0318491f2c7acd82aa9c09fe24967508d94dae86c9baebc5377e9161dab8e76b\"}}`;

  console.log({ url });

  return fetcher(url, {
    headers: {
      "content-type": "application/json",
    },
  }).then((resp) => resp.json());
};

export const extractItems = (
  input: any,
  predicate: (item) => boolean,
  acc: any[] = []
) => {
  if (!input) return acc;

  if (predicate(input)) {
    acc.push(input);
  }

  if (Array.isArray(input)) {
    input.forEach((x) => extractItems(x, predicate, acc));
  }

  if (typeof input === "object" && input !== null) {
    Object.values(input).forEach((item) => {
      return extractItems(item, predicate, acc);
    });
  }

  return acc;
};
