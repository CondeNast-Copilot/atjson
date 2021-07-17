function without<T>(array: T[], value: T): T[] {
  let presentParts: T[] = [];
  for (let part of array) {
    if (part !== value) {
      presentParts.push(part);
    }
  }

  return presentParts;
}

interface IUrl {
  protocol: string;
  host: string;
  pathname: string;
  hash: string;
  searchParams: { [key: string]: string } | URLSearchParams;
}

function getSearchParam(
  searchParams: { [key: string]: string } | URLSearchParams,
  name: string
) {
  if (searchParams instanceof URLSearchParams) {
    return searchParams.get(name);
  }
  return searchParams[name];
}

function toURL(url: IUrl) {
  let protocol = url.protocol.replace(":", "");
  let result = new URL(`${protocol}://${url.host}`);

  result.pathname = url.pathname;
  result.hash = url.hash;

  let keys: string[];
  if (url.searchParams instanceof URLSearchParams) {
    keys = [...url.searchParams.keys()];
  } else {
    keys = Object.keys(url.searchParams);
  }
  for (let param of keys) {
    let value = getSearchParam(url.searchParams, param);
    if (value) {
      result.searchParams.set(param, value);
    }
  }
  return result.href;
}

function isYouTubeURL(url: IUrl) {
  return isYouTubeEmbedURL(url) || isYouTubeWatchURL(url);
}

// Youtube embed code
// - youtu.be/
// - youtube-nocookie.com/embed/
// - youtube.com/embed
function isYouTubeEmbedURL(url: IUrl) {
  return (
    url.host === "youtu.be" ||
    (["www.youtube-nocookie.com", "www.youtube.com"].includes(url.host) &&
      url.pathname.startsWith("/embed/"))
  );
}

// Youtube watch URLs
// - www.youtube.com/watch?v=
// - m.youtube.com/watch?v=
// - youtube.com/watch?v=
function isYouTubeWatchURL(url: IUrl) {
  return (
    ["www.youtube.com", "m.youtube.com", "youtube.com"].includes(url.host) &&
    url.pathname.startsWith("/watch") &&
    getSearchParam(url.searchParams, "v") !== null
  );
}

function normalizeYouTubeURL(url: IUrl) {
  let normalized =
    url.host === "www.youtube-nocookie.com"
      ? new URL("https://www.youtube-nocookie.com")
      : new URL("https://www.youtube.com");

  let timestamp =
    getSearchParam(url.searchParams, "t") ||
    getSearchParam(url.searchParams, "start");
  if (timestamp) {
    normalized.searchParams.set("start", timestamp);
  }

  if (isYouTubeEmbedURL(url)) {
    let parts = without<string>(url.pathname.split("/"), "");
    let id = parts.pop();
    normalized.pathname = `/embed/${id}`;

    let controls = getSearchParam(url.searchParams, "controls");
    if (controls) {
      normalized.searchParams.set("controls", controls);
    }
  } else {
    normalized.pathname = `/embed/${getSearchParam(url.searchParams, "v")}`;
  }

  return normalized.href;
}

// Dailymotion URLs
// - https://www.dailymotion.com/video/:id
function isDailymotionURL(url: IUrl) {
  return (
    url.host?.match(/^[^.]*\.dailymotion\.com/) &&
    (url.pathname?.startsWith("/video") ||
      url.pathname?.match(/^\/[^\\]*\/video\//))
  );
}

function normalizeDailymotionURL(url: IUrl) {
  let normalized = new URL("https://www.dailymotion.com");
  for (let param in url.searchParams) {
    let value = getSearchParam(url.searchParams, param);
    if (value) {
      normalized.searchParams.set(param, value);
    }
  }

  let parts = without<string>(url.pathname.split("/"), "");
  let part = parts.shift();
  while (part !== "video") {
    part = parts.shift();
  }
  let id = parts.shift();
  normalized.pathname = `/embed/video/${id}`;

  return normalized.href;
}

// Vimeo URLs
// - https://vimeo.com/:id
// - https://www.vimeo.com/m/#/:id
// - https://player.vimeo.com/embed/
function isVimeoURL(url: IUrl) {
  return (
    url.host === "vimeo.com" ||
    url.host === "player.vimeo.com" ||
    url.host === "www.vimeo.com"
  );
}

function isVimeoEmbedURL(url: IUrl) {
  return url.host === "player.vimeo.com";
}

function normalizeVimeoURL(url: IUrl) {
  if (isVimeoEmbedURL(url)) {
    // Enforce https ~
    url.protocol = "https";
    return toURL(url);
  }
  let normalized = new URL("https://player.vimeo.com");
  let parts = without<string>(url.pathname.split("/"), "");
  let id = parts.shift();
  normalized.pathname = `/video/${id}`;

  return normalized.href;
}

// Brightcove URLs
// - https://players.brightcove.com/
// - https://bcove.video
// - https://bcove.me
function isBrightcoveURL(url: IUrl) {
  return (
    url.host === "players.brightcove.net" ||
    url.host === "bcove.video" ||
    url.host === "bcove.me"
  );
}

function isTwitchURL(url: IUrl) {
  return (
    isTwitchStreamURL(url) || isTwitchChannelURL(url) || isTwitchClipURL(url)
  );
}

function isTwitchStreamURL(url: IUrl) {
  return (
    (url.host === "player.twitch.tv" &&
      getSearchParam(url.searchParams, "video")) ||
    ((url.host === "www.twitch.tv" || url.host === "m.twitch.tv") &&
      url.pathname.startsWith("/videos"))
  );
}

function isTwitchClipURL(url: IUrl) {
  return (
    url.host === "clips.twitch.tv" ||
    (url.host === "www.twitch.tv" && url.pathname.match(/\/clip\/.*/))
  );
}

function isTwitchChannelURL(url: IUrl) {
  return (
    (url.host === "player.twitch.tv" &&
      getSearchParam(url.searchParams, "channel")) ||
    ((url.host === "www.twitch.tv" || url.host === "m.twitch.tv") &&
      !url.pathname.startsWith("/videos"))
  );
}

function normalizeTwitchURL(url: IUrl) {
  let parent = getSearchParam(url.searchParams, "parent") ?? "www.example.com";
  if (isTwitchClipURL(url)) {
    let clipID =
      getSearchParam(url.searchParams, "clip") ??
      without<string>(url.pathname.split("/"), "").pop();
    return `https://clips.twitch.tv/embed?clip=${clipID}&parent=${parent}`;
  } else if (isTwitchChannelURL(url)) {
    let channelID =
      getSearchParam(url.searchParams, "channel") ??
      without<string>(url.pathname.split("/"), "").pop();
    return `https://player.twitch.tv/?channel=${channelID}&parent=${parent}`;
  } else {
    let videoID =
      getSearchParam(url.searchParams, "video") ??
      without<string>(url.pathname.split("/"), "").pop();
    return `https://player.twitch.tv/?video=${videoID}&parent=${parent}`;
  }
}

function isWirewaxURL(url: IUrl) {
  return url.host === "embedder.wirewax.com";
}

function normalizeWirewaxURL(url: IUrl) {
  let normalized = new URL("https://embedder.wirewax.com");

  let videoId = without<string>(url.pathname.split("/"), "")[0];
  normalized.pathname = `/${videoId}`;
  return normalized.href;
}

export enum Provider {
  YOUTUBE = "YOUTUBE",
  VIMEO = "VIMEO",
  BRIGHTCOVE = "BRIGHTCOVE",
  DAILYMOTION = "DAILYMOTION",
  TWITCH = "TWITCH",
  WIREWAX = "WIREWAX",
  OTHER = "OTHER",
}

export function identify(url: IUrl) {
  if (isYouTubeURL(url)) {
    return {
      provider: Provider.YOUTUBE,
      url: normalizeYouTubeURL(url),
    };
  }

  if (isVimeoURL(url)) {
    return {
      provider: Provider.VIMEO,
      url: normalizeVimeoURL(url),
    };
  }

  if (isDailymotionURL(url)) {
    return {
      provider: Provider.DAILYMOTION,
      url: normalizeDailymotionURL(url),
    };
  }

  if (isBrightcoveURL(url)) {
    return {
      provider: Provider.BRIGHTCOVE,
      url: toURL(url),
    };
  }

  if (isTwitchURL(url)) {
    return {
      provider: Provider.TWITCH,
      url: normalizeTwitchURL(url),
    };
  }

  if (isWirewaxURL(url)) {
    return {
      provider: Provider.WIREWAX,
      url: normalizeWirewaxURL(url),
    };
  }

  return null;
}
