import { MovieItem, PlayableItem, VODItem } from "@mediaurl/sdk/dist";
import cheerio from "cheerio";

export const parseList = (html: string) => {
  const $ = cheerio.load(html);

  const result: VODItem[] = [];

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
): { id: string; name: string }[] => {
  const $ = cheerio.load(html);

  const result = $("div.video[data-media-id]")
    .toArray()
    .map((elem) => {
      return {
        id: $(elem).attr("data-media-id") as string,
        name: $(elem).find('input[name="media_title"]').attr("value") as string,
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
