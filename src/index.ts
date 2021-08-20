import * as fs from "fs";
import {
  createAddon,
  ItemResponse,
  MovieItem,
  PlayableItem,
  runCli,
} from "@mediaurl/sdk";
import { extractVideoIds, parseList, parseStreamSources } from "./dw.service";

const dwAddon = createAddon({
  id: "dw",
  name: "News and current affairs from Germany and around the world – DW",
  version: "0.0.0",
  icon: "https://api.faviconkit.com/beta.dw.com/144",
  // Trigger this addon on this kind of items
  itemTypes: ["movie", "series"],
  catalogs: [
    {
      name: "Top stories",
      id: "s-9097",
    },
    {
      name: "Media content",
      id: "s-100826",
    },
  ],
});

dwAddon.registerActionHandler("catalog", async (input, ctx) => {
  console.log("catalog", input);

  const html = await ctx
    .fetch(`https://www.dw.com/en/${input.catalogId}`)
    .then((_) => _.text());

  const items = parseList(html);

  return {
    options: { displayName: true, imageShape: "landscape" },
    items: [
      (input.catalogId === "s-9097"
        ? {
            type: "movie",
            name: "Live TV",
            ids: { id: "/en/s-100825" },
            images: { poster: "https://static.dw.com/image/47222913_304.png" },
          }
        : null) as MovieItem,
      ...items,
    ].filter((_) => _),
    nextCursor: null,
  };
});

dwAddon.registerActionHandler("item", async (input, ctx) => {
  console.log("item", input);

  const common = {
    type: "movie",
    ids: input.ids,
  };
  const isStream = /s-(\d*)$/.test(input.ids.id as string);
  const isVideo = /v-(\d*)$/.test(input.ids.id as string);
  const videoIdMatch = /-(\d*)$/.exec(input.ids.id as string);

  if (!videoIdMatch) {
    throw new Error("Unable to read ID from link");
  }

  if (isStream) {
    const html = await ctx
      .fetch(`https://www.dw.com/en/media-center/live-tv/s-100825?hls=true`)
      .then((_) => _.text());
    return { ...common, sources: await parseStreamSources(html) };
  }

  const getSource = (id: string) => {
    return ctx
      .fetch(`https://www.dw.com/playersources/v-${videoIdMatch[1]}?hls=true`, {
        headers: {
          "content-type": "application/json",
        },
      })
      .then<{ file: string }[]>((_) => _.json());
  };

  const sources: PlayableItem["sources"] = await (isVideo
    ? getSource(videoIdMatch[1]).then((_) => {
        return _.map(({ file }) => {
          return { url: file };
        });
      })
    : ctx
        .fetch(
          `https://www.dw.com/en/merkel-asks-russia-to-pressure-taliban-on-evacuations/a-58915545`
        )
        .then((_) => _.text())
        .then(extractVideoIds)
        .then((results) =>
          Promise.all(
            results.map(({ id, name }) => {
              return getSource(id)
                .then((_) => _[0].file)
                .then((url) => ({ url, name }));
            })
          )
        ));

  return {
    ...common,
    sources,
  };
});

runCli([dwAddon]);
