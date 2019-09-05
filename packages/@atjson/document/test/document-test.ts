import TestSource, { Bold, Paragraph } from "./test-source";
import { ParseAnnotation } from "../src";

describe("Document#canonical", () => {
  test("parse tokens are properly removed", () => {
    let testDoc = new TestSource({
      content: "<b>Hello</b>,\n World!",
      annotations: [
        new ParseAnnotation({ start: 0, end: 3 }),
        new ParseAnnotation({ start: 8, end: 12 }),
        new Paragraph({ start: 0, end: 13 }),
        new Bold({ start: 0, end: 12 })
      ]
    });

    expect(testDoc.canonical()).toMatchObject({
      contentType: "application/vnd.atjson+test",
      content: "Hello,\n World!",
      annotations: [
        {
          type: "bold",
          start: 0,
          end: 5,
          attributes: {}
        },
        {
          type: "paragraph",
          start: 0,
          end: 6,
          attributes: {}
        }
      ]
    });
  });
});

describe("Document#equals", () => {
  test("documents are correctly compared for equality", () => {
    let leftHandSideTestDoc = new TestSource({
      content: "<b>Hello</b>,\n World!",
      annotations: [
        new ParseAnnotation({ start: 0, end: 3 }),
        new ParseAnnotation({ start: 8, end: 12 }),
        new Paragraph({ start: 0, end: 13 }),
        new Bold({ start: 0, end: 12 })
      ]
    });

    let rightHandSideTestDoc = new TestSource({
      content: "<b>Hello</b>,\n <blink>World!</blink>",
      annotations: [
        new ParseAnnotation({ start: 15, end: 22 }),
        new ParseAnnotation({ start: 28, end: 36 }),
        new ParseAnnotation({ start: 0, end: 3 }),
        new ParseAnnotation({ start: 8, end: 12 }),
        new Paragraph({ start: 0, end: 13 }),
        new Bold({ start: 0, end: 12 })
      ]
    });

    let unequalRightHandSideTestDoc = new TestSource({
      content: "<b>Hello</b>,\n <blink>World!</blink>",
      annotations: [
        new ParseAnnotation({ start: 15, end: 22 }),
        new ParseAnnotation({ start: 28, end: 36 }),
        new ParseAnnotation({ start: 0, end: 3 }),
        new ParseAnnotation({ start: 8, end: 12 }),
        new Paragraph({ start: 0, end: 13 })
      ]
    });

    expect(leftHandSideTestDoc.equals(rightHandSideTestDoc)).toBe(true);
    expect(leftHandSideTestDoc.equals(unequalRightHandSideTestDoc)).toBe(false);
  });

  test("annotation attributes are correctly compared for equality", () => {
    let leftHandSideTestDoc = new TestSource({
      content: "\uFFFC",
      annotations: [
        {
          id: "1",
          type: "-test-image",
          start: 0,
          end: 1,
          attributes: {
            "-test-url": "http://www.example.com/test.jpg",
            "-test-caption": {
              content: "An example caption",
              annotations: [
                {
                  type: "-test-italic",
                  start: 3,
                  end: 10,
                  attributes: {}
                }
              ]
            }
          }
        }
      ]
    });

    let rightHandSideTestDoc = new TestSource({
      content: "\uFFFC",
      annotations: [
        {
          id: "1",
          type: "-test-image",
          start: 0,
          end: 1,
          attributes: {
            "-test-url": "http://www.example.com/test.jpg",
            "-test-caption": {
              content: "An example caption",
              annotations: [
                {
                  type: "-test-italic",
                  start: 3,
                  end: 10,
                  attributes: {}
                }
              ]
            }
          }
        }
      ]
    });

    let unequalRightHandSideTestDoc = new TestSource({
      content: "\uFFFC",
      annotations: [
        {
          id: "1",
          type: "-test-image",
          start: 0,
          end: 1,
          attributes: {
            "-test-url": "http://www.example.com/test.jpg",
            "-test-caption": {
              content: "An example caption",
              annotations: [
                {
                  type: "-test-italic",
                  start: 4,
                  end: 10,
                  attributes: {}
                }
              ]
            }
          }
        }
      ]
    });

    expect(leftHandSideTestDoc.equals(rightHandSideTestDoc)).toBe(true);
    expect(leftHandSideTestDoc.equals(unequalRightHandSideTestDoc)).toBe(false);
  });

  test("HTML documents and MD documents are correctly compared for equality", () => {
    let MDTestDoc = new TestSource({
      content: "Hello, **world**",
      annotations: [
        new ParseAnnotation({ start: 14, end: 16 }),
        new ParseAnnotation({ start: 7, end: 9 }),
        new Bold({ start: 7, end: 16 })
      ]
    });

    let HTMLTestDoc = new TestSource({
      content: "Hello, <b>world</b>",
      annotations: [
        new ParseAnnotation({ start: 7, end: 10 }),
        new ParseAnnotation({ start: 15, end: 19 }),
        new Bold({ start: 7, end: 19 })
      ]
    });
    expect(MDTestDoc.equals(HTMLTestDoc)).toBe(true);
  });
});