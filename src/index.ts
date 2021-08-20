import * as fs from "fs";
import { createAddon, MovieItem, runCli } from "@mediaurl/sdk";
import { executeQuery, extractItems, NewsContent } from "./dw.service";

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
      id: 9097,
    },
  ],
});

dwAddon.registerActionHandler("catalog", async (input, ctx) => {
  console.log("catalog", input);

  const resp = await executeQuery(
    "getNavigationPage",
    JSON.stringify({
      id: input.catalogId,
      lang: "ENGLISH",
    }),
    ctx.fetch
  );

  fs.writeFileSync("dump.json", JSON.stringify(resp));

  const extracted = extractItems(
    resp,
    (_) => ["Video", "Article"].indexOf(_.__typename) !== -1
  );

  return {
    options: { displayName: true, imageShape: "landscape" },
    items: extracted
      .filter((_) => {
        return _.posterImageLink || _.mainContentImageLink;
      })
      .map((_) => {
        return {
          type: "movie",
          ids: { id: _.id },
          name: _.shortTitle,
          images: {
            poster:
              _.posterImageLink?.stillUrl ||
              _.mainContentImageLink?.target.staticUrl.replace(
                "${formatId}",
                "604"
              ),
          },
        };
      }),
    nextCursor: null,
  };
});

dwAddon.registerActionHandler("item", async (input, ctx) => {
  console.log("item", input);
});

runCli([dwAddon]);
