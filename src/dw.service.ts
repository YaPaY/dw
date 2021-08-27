import { MovieItem, PlayableItem, VODItem } from "@mediaurl/sdk/dist";
import cheerio from "cheerio";

export const parseList = (html: string) => {
  const $ = cheerio.load(html);

  const result: MovieItem[] = [];

  const elements = [
    // Top stories page
    ...$("div.col2.basicTeaser").toArray(),

    // Search page
    ...$("div.news.searchres").toArray(),
  ];

  elements.forEach((elem) => {
    result.push({
      type: "movie",
      name: $(elem).find("h2").contents().first().text().trim(),
      description: $(elem).find("p").first().text(),
      ids: { id: $(elem).find("a").attr("href") as string },
      images: { poster: $(elem).find("img").attr("src") },
    });
  });

  return result;
};

export const extractVideoIds = (
  html: string
): {
  id: string;
  name: string;
  url?: string;
  playerType: "audio" | "video";
}[] => {
  const $ = cheerio.load(html);

  const result = $("div.mediaItem[data-media-id]")
    .toArray()
    .map((elem) => {
      return {
        url: $(elem).find('input[name="file_name"]').attr("value") as string,
        id: $(elem).attr("data-media-id") as string,
        name: $(elem).find('input[name="media_title"]').attr("value") as string,
        playerType: $(elem).find('input[name="player_type"]').attr("value") as
          | "audio"
          | "video",
      };
    });

  return result;
};

export const parseStreamSources = (html: string): MovieItem["sources"] => {
  const $ = cheerio.load(html);

  return $("div.mediaItem")
    .toArray()
    .map((elem) => {
      return {
        name: $(elem)
          .find('input[name="channel_name"]')
          .attr("value") as string,
        url: $(elem).find('input[name="file_name"]').attr("value") as string,
      };
    });
};

export const getRegionLinks = (html: string): { [locale: string]: string } => {
  const result = {};
  const $ = cheerio.load(html);

  $("#languageSection a")
    .toArray()
    .reduce((acc, elem) => {
      const href = $(elem).attr("href") as string;
      const region = href
        .split("/")
        .filter((_) => _)
        .shift();
      const id = href.split("/").pop();

      if (region) {
        acc[region] = id;
      }

      return acc;
    }, result);

  return result;
};
