import { VideoURLs } from "../src";

describe("VideoURLs", () => {
  describe("brightcove", () => {
    test.each([
      "https://players.brightcove.net/635709154001/default_default/index.html?videoId=4898526370001",
      "https://players.brightcove.net/635709154001/default_default/index.html?videoId=5648767050001",
    ])("%s", (url) => {
      expect(VideoURLs.identify(new URL(url))).toEqual({
        url,
        provider: VideoURLs.Provider.BRIGHTCOVE,
      });
    });
  });

  describe("dailymotion", () => {
    test.each([
      "https://www.dailymotion.com/video/x73oxxw",
      "https://www.dailymotion.com/embed/video/x73oxxw",
    ])("%s", (url) => {
      expect(VideoURLs.identify(new URL(url))).toEqual({
        url: "https://www.dailymotion.com/embed/video/x73oxxw",
        provider: VideoURLs.Provider.DAILYMOTION,
      });
    });
  });

  describe("Vimeo", () => {
    test.each([
      "https://vimeo.com/156254412",
      "https://www.vimeo.com/156254412",
      "http://vimeo.com/156254412",
      "http://player.vimeo.com/video/156254412",
    ])("%s", (url) => {
      expect(VideoURLs.identify(new URL(url))).toEqual({
        url: "https://player.vimeo.com/video/156254412",
        provider: VideoURLs.Provider.VIMEO,
      });
    });
  });

  describe("YouTube", () => {
    test.each([
      "https://www.youtube.com/watch?v=Mh5LY4Mz15o",
      "https://m.youtube.com/watch/?v=Mh5LY4Mz15o",
      "https://youtu.be/Mh5LY4Mz15o",
      "https://www.youtube.com/embed/Mh5LY4Mz15o",
    ])("%s", (url) => {
      expect(VideoURLs.identify(new URL(url))).toEqual({
        url: "https://www.youtube.com/embed/Mh5LY4Mz15o",
        provider: VideoURLs.Provider.YOUTUBE,
      });
    });

    test.each([
      "https://www.youtube.com/watch?v=Mh5LY4Mz15o&t=20",
      "https://m.youtube.com/watch/?v=Mh5LY4Mz15o&t=20",
      "https://youtu.be/Mh5LY4Mz15o?start=20",
      "https://www.youtube.com/embed/Mh5LY4Mz15o?start=20",
    ])("%s", (url) => {
      expect(VideoURLs.identify(new URL(url))).toEqual({
        url: "https://www.youtube.com/embed/Mh5LY4Mz15o?start=20",
        provider: VideoURLs.Provider.YOUTUBE,
      });
    });
  });

  describe("Twitch", () => {
    test.each([
      "https://www.twitch.tv/videos/956002196",
      "https://m.twitch.tv/videos/956002196",
      "https://player.twitch.tv/?video=956002196",
      "https://player.twitch.tv/?video=956002196&parent=www.example.com",
    ])("%s", (url) => {
      expect(VideoURLs.identify(new URL(url))).toEqual({
        url: "https://player.twitch.tv/?video=956002196&parent=www.example.com",
        provider: VideoURLs.Provider.TWITCH,
      });
    });

    test.each([
      "https://www.twitch.tv/dunkstream",
      "https://m.twitch.tv/dunkstream",
      "https://player.twitch.tv/?channel=dunkstream",
      "https://player.twitch.tv/?channel=dunkstream&parent=www.example.com",
    ])("%s", (url) => {
      expect(VideoURLs.identify(new URL(url))).toEqual({
        url: "https://player.twitch.tv/?channel=dunkstream&parent=www.example.com",
        provider: VideoURLs.Provider.TWITCH,
      });
    });

    test.each([
      "https://www.twitch.tv/fanbyte/clip/MistyPluckyNeanderthalWow-1bomfgLj4qFB3uO-?filter=clips&range=7d&sort=time",
      "https://clips.twitch.tv/MistyPluckyNeanderthalWow-1bomfgLj4qFB3uO-",
      "https://clips.twitch.tv/embed?clip=MistyPluckyNeanderthalWow-1bomfgLj4qFB3uO-",
      "https://clips.twitch.tv/embed?clip=MistyPluckyNeanderthalWow-1bomfgLj4qFB3uO-&parent=www.example.com",
    ])("%s", (url) => {
      expect(VideoURLs.identify(new URL(url))).toEqual({
        url: "https://clips.twitch.tv/embed?clip=MistyPluckyNeanderthalWow-1bomfgLj4qFB3uO-&parent=www.example.com",
        provider: VideoURLs.Provider.TWITCH,
      });
    });

    test.each([
      "https://player.twitch.tv/?video=956002196&parent=www.wired.com",
      "https://player.twitch.tv/?channel=dunkstream&parent=www.wired.com",
      "https://clips.twitch.tv/embed?clip=MistyPluckyNeanderthalWow-1bomfgLj4qFB3uO-&parent=www.wired.com",
    ])("%s", (url) => {
      expect(VideoURLs.identify(new URL(url))).toEqual({
        url,
        provider: VideoURLs.Provider.TWITCH,
      });
    });
  });

  describe("wirewax", () => {
    test.each([
      "https://embedder.wirewax.com/8203724",
      "https://embedder.wirewax.com/8203724/example",
    ])("%s", (url) => {
      expect(VideoURLs.identify(new URL(url))).toEqual({
        url: "https://embedder.wirewax.com/8203724",
        provider: VideoURLs.Provider.WIREWAX,
      });
    });
  });
});
