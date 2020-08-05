import OffsetSource, {
  HorizontalRule,
  List,
  ListItem,
} from "@atjson/offset-annotations";
import CommonmarkRenderer from "../src";
import { ParseAnnotation } from "@atjson/document";

describe("commonmark", () => {
  describe("thematic break", () => {
    test("alone", () => {
      let doc = new OffsetSource({
        content: "\uFFFC",
        annotations: [new HorizontalRule({ start: 0, end: 1 })],
      });

      expect(CommonmarkRenderer.render(doc)).toEqual("***\n");
    });

    test("inside of a list", () => {
      let doc = new OffsetSource({
        content: "* \uFFFC",
        annotations: [
          new List({ start: 0, end: 3, attributes: { type: "bulleted" } }),
          new ParseAnnotation({
            start: 0,
            end: 2,
            attributes: { reason: "List marker" },
          }),
          new ListItem({ start: 2, end: 3 }),
          new HorizontalRule({ start: 2, end: 3 }),
        ],
      });

      expect(CommonmarkRenderer.render(doc)).toEqual("- ***\n\n\n");
    });

    test("inside of an adjacent list", () => {
      let doc = new OffsetSource({
        content: "* one\n- \uFFFC",
        annotations: [
          new List({ start: 0, end: 5, attributes: { type: "bulleted" } }),
          new ParseAnnotation({
            start: 0,
            end: 2,
            attributes: { reason: "List marker" },
          }),
          new ListItem({ start: 2, end: 5 }),
          new ParseAnnotation({
            start: 5,
            end: 6,
            attributes: { reason: "New line" },
          }),
          new List({ start: 6, end: 9, attributes: { type: "bulleted" } }),
          new ParseAnnotation({
            start: 6,
            end: 8,
            attributes: { reason: "List marker" },
          }),
          new ListItem({ start: 8, end: 9 }),
          new HorizontalRule({ start: 8, end: 9 }),
        ],
      });
      expect(CommonmarkRenderer.render(doc)).toEqual("- one\n\n* ---\n\n\n");
    });
  });
});
