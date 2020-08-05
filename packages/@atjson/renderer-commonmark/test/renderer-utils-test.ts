import {
  fixDelimiterRuns,
  mergeStrings,
  splitLines,
  streamIncludes,
  hasLeadingWhitespace,
  hasTrailingWhitespace,
  flatMapStringReplace,
  streamFlatMapStringReplace,
  greedilyTakeLeadingWhiteSpace,
  greedilyTakeTrailingWhiteSpace,
} from "../src";

import * as T from "../src/lib/tokens";

describe("commonmark renderer utility functions", () => {
  describe("fixDelimiterRuns", () => {
    test("fixing left delimiter runs basically works", () => {
      let stream = ["some leading text", T.StrongStarStart, ". some bold text"];

      expect(fixDelimiterRuns(stream)).toEqual([
        "some leading text",
        ".",
        " ",
        T.StrongStarStart,
        "some bold text",
      ]);
    });

    test("*(**foo**)*↵", () => {
      let stream = [
        T.EmphasisStarStart,
        "(",
        T.StrongStarStart,
        "foo",
        T.StrongStarEnd,
        ")",
        T.EmphasisStarEnd,
        T.BlockSeparator,
      ];

      expect(fixDelimiterRuns(stream)).toEqual(stream);
    });

    test("fixing right delimiter runs basically works", () => {
      let stream = ["bold text -", T.StrongStarEnd, "some other stuff"];

      expect(fixDelimiterRuns(stream)).toEqual([
        "bold text",
        T.StrongStarEnd,
        " ",
        "-",
        "some other stuff",
      ]);
    });

    test("fixing deeply nested stuff", () => {
      // foo******bar*********baz
      let stream = [
        "foo",
        T.StrongStarStart,
        T.StrongStarStart,
        T.StrongStarStart,
        "bar",
        T.StrongStarEnd,
        T.StrongStarEnd,
        T.StrongStarEnd,
        "\\*\\*\\*baz",
        T.BlockSeparator,
      ];

      expect(fixDelimiterRuns(stream)).toEqual(stream);
    });
  });

  describe("flatMapStringReplace", () => {
    test("escaping list delimiters", () => {
      let string = "1. list item\n2. list item";

      expect(
        flatMapStringReplace(string, /([0-9]+)\.([^\n]+)/, ([, $1, $2]) => {
          return [$1, T.EscapedPunctuation("."), $2];
        })
      ).toEqual([
        "1",
        T.EscapedPunctuation("."),
        " list item",
        "\n",
        "2",
        T.EscapedPunctuation("."),
        " list item",
      ]);
    });
  });

  test("streamFlatMapStringReplace", () => {
    let stream = [
      "test test",
      T.HardLineBreak,
      T.StrongStarStart,
      "test",
      T.StrongStarEnd,
    ];

    expect(
      streamFlatMapStringReplace(stream, /t(.)st/, ([, $1]) => {
        return [$1.repeat(5)];
      })
    ).toEqual([
      "eeeee",
      " ",
      "eeeee",
      T.HardLineBreak,
      T.StrongStarStart,
      "eeeee",
      T.StrongStarEnd,
    ]);
  });

  test("mergeStrings", () => {
    let stream = ["\n", "\n", T.ThematicBreak("*"), "testing", "1\n2"];

    expect(mergeStrings(stream)).toEqual([
      "\n\n",
      T.ThematicBreak("*"),
      "testing1\n2",
    ]);
  });

  test("splitLines", () => {
    let stream = ["test\nstream", T.ThematicBreak("*"), "\nhello\nworld"];

    expect(splitLines(stream)).toEqual([
      ["test"],
      ["stream", T.ThematicBreak("*"), ""],
      ["hello"],
      ["world"],
    ]);
  });

  test("streamIncludes", () => {
    let stream = ["test\n", T.ATXHeading(2), "this is a heading"];

    expect(streamIncludes(stream, "heading")).toBe(true);

    expect(streamIncludes(stream, T.ATXHeading(2))).toBe(true);

    expect(streamIncludes(stream, "test\nthis")).toBe(false);
  });

  test("hasLeadingWhitespace", () => {
    expect(hasLeadingWhitespace(" a string")).toBe(true);
    expect(hasLeadingWhitespace("another string ")).toBe(false);
    expect(hasLeadingWhitespace(T.HardLineBreak)).toBe(true);
    expect(hasLeadingWhitespace(T.StrongStarEnd)).toBe(false);
  });

  test("hasTrailingWhitespaces", () => {
    expect(hasTrailingWhitespace("test string ")).toBe(true);
    expect(hasTrailingWhitespace(" hello")).toBe(false);
    expect(hasTrailingWhitespace(T.HardLineBreak)).toBe(true);
    expect(hasTrailingWhitespace(T.EmphasisStarStart)).toBe(false);
  });

  describe("greedilyTakeLeadingWhitespace", () => {
    test("single string", () => {
      let stream = [T.StrongStarStart, " test"];

      expect(greedilyTakeLeadingWhiteSpace(stream, 1)).toEqual({
        leadingSpaces: [" "],
        trailingStream: [],
        splitLeadingString: "test",
      });
    });

    test("complex case", () => {
      let stream1 = [
        " ",
        T.HardLineBreak,
        "\t\ttest\n",
        T.StrongStarStart,
        "some stuff",
        T.StrongStarEnd,
      ];

      expect(greedilyTakeLeadingWhiteSpace(stream1, 0)).toEqual({
        leadingSpaces: [" ", T.HardLineBreak, "\t\t"],
        trailingStream: [T.StrongStarStart, "some stuff", T.StrongStarEnd],
        splitLeadingString: "test\n",
      });
    });
  });

  describe("greedilyTakeTrailingWhitespace", () => {
    test("stops taking whitespace if it reaches a string with trailing spaces", () => {
      let stream = [T.EmphasisStarStart, " ", "-italic- ", T.EmphasisStarEnd];

      expect(greedilyTakeTrailingWhiteSpace(stream, 2)).toEqual({
        trailingSpaces: [" "],
        leadingStream: [T.EmphasisStarStart, " "],
        splitTrailingString: "-italic-",
      });
    });

    test("a complex case", () => {
      let stream = ["some stuff\n", T.HardLineBreak, "\t\n"];

      expect(greedilyTakeTrailingWhiteSpace(stream, 2)).toEqual({
        trailingSpaces: ["\n", T.HardLineBreak, "\t\n"],
        leadingStream: [],
        splitTrailingString: "some stuff",
      });
    });

    test("a simple case", () => {
      let stream = ["bold text ", T.StrongStarEnd, "some other text"];

      expect(greedilyTakeTrailingWhiteSpace(stream, 0)).toEqual({
        trailingSpaces: [" "],
        leadingStream: [],
        splitTrailingString: "bold text",
      });
    });
  });
});
