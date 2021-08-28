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
    const nameElem = $(elem).find("h2").first();

    $(nameElem).children().remove();

    result.push({
      type: "movie",
      name: $(nameElem).contents().text().trim(),
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

export const topStoriesIds = {
  sq: "s-10250",
  am: "s-11646",
  ar: "s-9106",
  bn: "s-11929",
  bs: "s-10037",
  bg: "s-10257",
  zh: "s-9058?&zhongwen=trad",
  hr: "s-9747",
  "fa-af": "s-10259",
  en: "s-9097",
  fr: "s-10261",
  de: "s-9077",
  el: "s-10507",
  ha: "s-11603",
  hi: "s-11931",
  id: "s-11546",
  sw: "s-11588",
  mk: "s-10339",
  ps: "s-11722",
  "fa-ir": "s-9993",
  pl: "s-11394",
  "pt-002": "s-13918",
  "pt-br": "s-7111",
  ro: "s-10575",
  ru: "s-9119",
  sr: "s-10682",
  es: "s-30684",
  tr: "s-10201",
  uk: "s-9874",
  ur: "s-11933",
};
