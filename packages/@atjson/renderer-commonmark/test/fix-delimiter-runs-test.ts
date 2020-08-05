import { fixDelimiterRuns } from "../src";
import * as Tokens from "../src/lib/tokens";

describe("fixDelimiterRuns", () => {
  // *[example](https://example.com/)*\n\n**next line**\n\n
  test("delimiters wrapping links are not parsed as punctuation at paragraph boundaries", () => {
    let stream = [
      Tokens.EmphasisStarStart,
      Tokens.InlineLinkStart,
      "example",
      Tokens.InlineLinkEnd("https://example.com/"),
      Tokens.EmphasisStarEnd,
      Tokens.BlockSeparator,
      Tokens.StrongStarStart,
      "next line",
      Tokens.StrongStarEnd,
      Tokens.BlockSeparator
    ];

    expect(fixDelimiterRuns(stream)).toEqual(stream);
  });

  // **bold:**[link](http://example.com/)
  test("right delimiter runs can be adjacent to left delimiter runs", () => {
    let stream = [
      Tokens.StrongStarStart,
      "bold:",
      Tokens.StrongStarEnd,
      Tokens.InlineLinkStart,
      "link",
      Tokens.InlineLinkEnd("https://example.com/")
    ];

    expect(fixDelimiterRuns(stream)).toEqual(stream);
  });
});
