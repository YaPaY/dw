import * as qs from "querystring";
import {
  createAddon,
  ItemResponse,
  MovieItem,
  PlayableItem,
  runCli,
} from "@mediaurl/sdk";
import { extractVideoIds, parseList, parseStreamSources } from "./dw.service";

const searchID = "__SEARCH";

const dwAddon = createAddon({
  id: "dw",
  name: "DW | News and current affairs from Germany and around the world",
  version: "0.0.0",
  icon: "https://api.faviconkit.com/beta.dw.com/144",
  itemTypes: ["movie"],
  catalogs: [
    {
      name: "Top stories",
      id: "s-9097",
      features: { search: { enabled: false } },
    },
    {
      name: "Media content",
      id: searchID,
      features: { search: { enabled: true } },
    },
  ],
});

dwAddon.registerActionHandler("catalog", async (input, ctx) => {
  console.log("catalog", input);

  const isSearch = input.catalogId === searchID;
  const cursor = <number>input.cursor || 1;

  const items = await (isSearch
    ? ctx
        .fetch(
          `https://www.dw.com/mediafilter/research?` +
            qs.stringify({
              lang: "en",
              showteasers: true,
              showfilter: true,
              pagenumber: cursor,
              filter: input.search,
            })
        )
        .then((_) => _.text())
        .then(parseList)
    : ctx
        .fetch(`https://www.dw.com/en/${input.catalogId}`)
        .then((_) => _.text())
        .then(parseList));

  return {
    options: { displayName: true, imageShape: "landscape" },
    items: [
      (input.catalogId === "s-9097"
        ? {
            type: "movie",
            name: "Live TV 🔴",
            ids: { id: "/en/s-100825" },
            images: { poster: "https://static.dw.com/image/47222913_304.png" },
          }
        : null) as MovieItem,
      ...items,
    ].filter((_) => _),
    nextCursor: items.length && isSearch ? cursor + 1 : null,
  };
});

dwAddon.registerActionHandler("item", async (input, ctx) => {
  console.log("item", input);

  const common: Partial<MovieItem> = {
    type: "movie",
    ids: input.ids,
  };
  const isStream = /s-(\d*)$/.test(input.ids.id as string);
  const isVideo = /\/v-(\d*)$/.test(input.ids.id as string);
  const videoIdMatch = /-(\d*)$/.exec(input.ids.id as string);

  if (!videoIdMatch) {
    throw new Error("Unable to read ID from link");
  }

  if (isStream) {
    const html = await ctx
      .fetch(`https://www.dw.com/en/media-center/live-tv/s-100825?hls=true`)
      .then((_) => _.text());

    return <MovieItem>{ ...common, sources: parseStreamSources(html) };
  }

  const getSource = (id: string) => {
    return ctx
      .fetch(`https://www.dw.com/playersources/v-${id}?hls=true`, {
        headers: {
          "content-type": "application/json",
        },
      })
      .then<{ file: string }[]>((_) => _.json());
  };

  const sources: PlayableItem["sources"] = await (isVideo
    ? getSource(videoIdMatch[1]).then((_) => {
        return _.map(({ file }) => {
          return { url: file, name: "DW" };
        });
      })
    : ctx
        .fetch(`https://www.dw.com/${input.ids.id}`)
        .then((_) => _.text())
        .then(extractVideoIds)
        .then((results) => {
          return Promise.all(
            results.map(({ id, name, url, playerType }) => {
              return url
                ? {
                    url,
                    name:
                      playerType === "video" ? name : `${name} (${playerType})`,
                  }
                : getSource(id)
                    .then((_) => _[0].file)
                    .then((url) => ({ url, name }));
            })
          );
        }));

  return <MovieItem>{
    ...common,
    sources,
  };
});

runCli([dwAddon]);
