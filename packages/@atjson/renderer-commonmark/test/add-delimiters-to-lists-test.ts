import { addDelimitersToLists } from "../src/lib/add-delimiters-to-lists";
import * as T from "../src/lib/tokens";

describe("addDelimitersToLists", () => {
  describe("numbered lists", () => {
    test("a single list", () => {
      let stream = [
        T.NumberedListStart(1),
        T.ListItemStart(""),
        "one fish",
        T.ListItemEnd,
        T.ListItemStart(""),
        "two fish",
        T.ListItemEnd,
        T.ListItemStart(""),
        "red fish",
        T.ListItemEnd,
        T.ListItemStart(""),
        "blue fish",
        T.ListItemEnd,
        T.NumberedListEnd
      ];

      expect(addDelimitersToLists(stream)).toEqual([
        T.NumberedListStart(1),
        T.ListItemStart("1. "),
        "one fish",
        T.ListItemEnd,
        T.ListItemStart("2. "),
        "two fish",
        T.ListItemEnd,
        T.ListItemStart("3. "),
        "red fish",
        T.ListItemEnd,
        T.ListItemStart("4. "),
        "blue fish",
        T.ListItemEnd,
        T.NumberedListEnd
      ]);
    });

    test("multiple adjacent lists", () => {
      let stream = [
        T.NumberedListStart(1),
        T.ListItemStart(""),
        "one fish",
        T.ListItemEnd,
        T.NumberedListEnd,
        T.NumberedListStart(2),
        T.ListItemStart(""),
        "two fish",
        T.ListItemEnd,
        T.NumberedListEnd,
        T.NumberedListStart(3),
        T.ListItemStart(""),
        "red fish",
        T.ListItemEnd,
        T.NumberedListEnd,
        T.NumberedListStart(5),
        T.ListItemStart(""),
        "blue fish",
        T.ListItemEnd,
        T.NumberedListEnd
      ];

      expect(addDelimitersToLists(stream)).toEqual([
        T.NumberedListStart(1),
        T.ListItemStart("1. "),
        "one fish",
        T.ListItemEnd,
        T.NumberedListEnd,
        T.NumberedListStart(2),
        T.ListItemStart("2) "),
        "two fish",
        T.ListItemEnd,
        T.NumberedListEnd,
        T.NumberedListStart(3),
        T.ListItemStart("3. "),
        "red fish",
        T.ListItemEnd,
        T.NumberedListEnd,
        T.NumberedListStart(5),
        T.ListItemStart("5) "),
        "blue fish",
        T.ListItemEnd,
        T.NumberedListEnd
      ]);
    });

    test("non-adjacent lists use the default markers", () => {
      let stream = [
        T.NumberedListStart(1),
        T.ListItemStart(""),
        "one fish",
        T.ListItemEnd,
        T.ListItemStart(""),
        "two fish",
        T.ListItemEnd,
        T.NumberedListEnd,
        "red fish",
        T.NumberedListStart(3),
        T.ListItemStart(""),
        "blue fish",
        T.ListItemEnd,
        T.NumberedListEnd
      ];

      expect(addDelimitersToLists(stream)).toEqual([
        T.NumberedListStart(1),
        T.ListItemStart("1. "),
        "one fish",
        T.ListItemEnd,
        T.ListItemStart("2. "),
        "two fish",
        T.ListItemEnd,
        T.NumberedListEnd,
        "red fish",
        T.NumberedListStart(3),
        T.ListItemStart("3. "),
        "blue fish",
        T.ListItemEnd,
        T.NumberedListEnd
      ]);
    });

    test("sublists", () => {
      let stream = [
        T.NumberedListStart(1),
        T.ListItemStart(""),
        "one fish",
        T.ListItemEnd,
        T.NumberedListStart(2),
        T.ListItemStart(""),
        "two fish",
        T.ListItemEnd,
        T.NumberedListStart(3),
        T.ListItemStart(""),
        "red fish",
        T.ListItemEnd,
        T.ListItemStart(""),
        "blue fish",
        T.ListItemEnd,
        T.NumberedListEnd,
        T.NumberedListEnd,
        T.NumberedListEnd
      ];

      expect(addDelimitersToLists(stream)).toEqual([
        T.NumberedListStart(1),
        T.ListItemStart("1. "),
        "one fish",
        T.ListItemEnd,
        T.NumberedListStart(2),
        T.ListItemStart("   2. "),
        "two fish",
        T.ListItemEnd,
        T.NumberedListStart(3),
        T.ListItemStart("      3. "),
        "red fish",
        T.ListItemEnd,
        T.ListItemStart("      4. "),
        "blue fish",
        T.ListItemEnd,
        T.NumberedListEnd,
        T.NumberedListEnd,
        T.NumberedListEnd
      ]);
    });

    test("line breaks inside of lists", () => {
      let stream = [
        T.NumberedListStart(1),
        T.ListItemStart(""),
        "one fish",
        T.SoftLineBreak,
        "two fish",
        T.NumberedListStart(22),
        T.ListItemStart(""),
        "red fish",
        T.SoftLineBreak,
        "blue fish",
        T.ListItemEnd,
        T.NumberedListEnd,
        T.NumberedListEnd
      ];

      expect(addDelimitersToLists(stream)).toEqual([
        T.NumberedListStart(1),
        T.ListItemStart("1. "),
        "one fish",
        T.SoftLineBreak,
        "   ",
        "two fish",
        T.NumberedListStart(22),
        T.ListItemStart("   22. "),
        "red fish",
        T.SoftLineBreak,
        "       ",
        "blue fish",
        T.ListItemEnd,
        T.NumberedListEnd,
        T.NumberedListEnd
      ]);
    });
  });

  describe("bulleted lists", () => {
    test("a single list", () => {
      let stream = [
        T.BulletedListStart,
        T.ListItemStart(""),
        "one fish",
        T.ListItemEnd,
        T.ListItemStart(""),
        "two fish",
        T.ListItemEnd,
        T.ListItemStart(""),
        "red fish",
        T.ListItemEnd,
        T.ListItemStart(""),
        "blue fish",
        T.ListItemEnd,
        T.BulletedListEnd
      ];

      expect(addDelimitersToLists(stream)).toEqual([
        T.BulletedListStart,
        T.ListItemStart("- "),
        "one fish",
        T.ListItemEnd,
        T.ListItemStart("- "),
        "two fish",
        T.ListItemEnd,
        T.ListItemStart("- "),
        "red fish",
        T.ListItemEnd,
        T.ListItemStart("- "),
        "blue fish",
        T.ListItemEnd,
        T.BulletedListEnd
      ]);
    });

    test("multiple adjacent lists", () => {
      let stream = [
        T.BulletedListStart,
        T.ListItemStart(""),
        "one fish",
        T.ListItemEnd,
        T.BulletedListEnd,
        T.BulletedListStart,
        T.ListItemStart(""),
        "two fish",
        T.ListItemEnd,
        T.ListItemStart(""),
        "red fish",
        T.ListItemEnd,
        T.BulletedListEnd,
        T.BulletedListStart,
        T.ListItemStart(""),
        "blue fish",
        T.ListItemEnd,
        T.BulletedListEnd
      ];

      expect(addDelimitersToLists(stream)).toEqual([
        T.BulletedListStart,
        T.ListItemStart("- "),
        "one fish",
        T.ListItemEnd,
        T.BulletedListEnd,
        T.BulletedListStart,
        T.ListItemStart("* "),
        "two fish",
        T.ListItemEnd,
        T.ListItemStart("* "),
        "red fish",
        T.ListItemEnd,
        T.BulletedListEnd,
        T.BulletedListStart,
        T.ListItemStart("- "),
        "blue fish",
        T.ListItemEnd,
        T.BulletedListEnd
      ]);
    });

    test("sublists", () => {
      let stream = [
        T.BulletedListStart,
        T.ListItemStart(""),
        "one fish",
        T.ListItemEnd,
        T.BulletedListStart,
        T.ListItemStart(""),
        "two fish",
        T.ListItemEnd,
        T.ListItemStart(""),
        "red fish",
        T.ListItemEnd,
        T.BulletedListStart,
        T.ListItemStart(""),
        "blue fish",
        T.ListItemEnd,
        T.BulletedListEnd,
        T.BulletedListEnd,
        T.BulletedListEnd
      ];

      expect(addDelimitersToLists(stream)).toEqual([
        T.BulletedListStart,
        T.ListItemStart("- "),
        "one fish",
        T.ListItemEnd,
        T.BulletedListStart,
        T.ListItemStart("  - "),
        "two fish",
        T.ListItemEnd,
        T.ListItemStart("  - "),
        "red fish",
        T.ListItemEnd,
        T.BulletedListStart,
        T.ListItemStart("    - "),
        "blue fish",
        T.ListItemEnd,
        T.BulletedListEnd,
        T.BulletedListEnd,
        T.BulletedListEnd
      ]);
    });

    test("non-adjacent lists use the default markers", () => {
      let stream = [
        T.BulletedListStart,
        T.ListItemStart(""),
        "one fish",
        T.ListItemEnd,
        T.BulletedListEnd,
        "two fish",
        T.SoftLineBreak,
        "red fish",
        T.BulletedListStart,
        T.ListItemStart(""),
        "blue fish",
        T.ListItemEnd,
        T.BulletedListEnd
      ];

      expect(addDelimitersToLists(stream)).toEqual([
        T.BulletedListStart,
        T.ListItemStart("- "),
        "one fish",
        T.ListItemEnd,
        T.BulletedListEnd,
        "two fish",
        T.SoftLineBreak,
        "red fish",
        T.BulletedListStart,
        T.ListItemStart("- "),
        "blue fish",
        T.ListItemEnd,
        T.BulletedListEnd
      ]);
    });

    test("soft line breaks inside of lists", () => {
      let stream = [
        T.BulletedListStart,
        T.ListItemStart(""),
        "one fish",
        T.SoftLineBreak,
        "two fish",
        T.SoftLineBreak,
        "red fish",
        T.SoftLineBreak,
        "blue fish",
        T.ListItemEnd,
        T.BulletedListEnd
      ];

      expect(addDelimitersToLists(stream)).toEqual([
        T.BulletedListStart,
        T.ListItemStart("- "),
        "one fish",
        T.SoftLineBreak,
        "  ",
        "two fish",
        T.SoftLineBreak,
        "  ",
        "red fish",
        T.SoftLineBreak,
        "  ",
        "blue fish",
        T.ListItemEnd,
        T.BulletedListEnd
      ]);
    });

    test("thematic breaks inside of lists", () => {
      let stream = [
        T.BulletedListStart,
        T.ListItemStart(""),
        "one fish",
        T.ListItemEnd,
        T.BulletedListEnd,
        T.BulletedListStart,
        T.ListItemStart(""),
        T.ThematicBreak("*"),
        T.ListItemEnd,
        T.BulletedListEnd
      ];

      expect(addDelimitersToLists(stream)).toEqual([
        T.BulletedListStart,
        T.ListItemStart("- "),
        "one fish",
        T.ListItemEnd,
        T.BulletedListEnd,
        T.BulletedListStart,
        T.ListItemStart("* "),
        T.ThematicBreak("-"),
        T.ListItemEnd,
        T.BulletedListEnd
      ]);
    });
  });
});
