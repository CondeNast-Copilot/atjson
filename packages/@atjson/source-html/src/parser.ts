import { AnnotationJSON, ParseAnnotation } from "@atjson/document";
import * as parse5 from "parse5";

function isElement(
  node: parse5.DefaultTreeNode
): node is parse5.DefaultTreeElement {
  return (
    node.nodeName !== undefined &&
    node.nodeName !== "#text" &&
    node.nodeName !== ""
  );
}

function isDocumentFragment(
  node: parse5.DocumentFragment
): node is parse5.DefaultTreeDocumentFragment {
  let nodeName = "nodeName" in node ? node.nodeName : null;
  return nodeName === "#document-fragment";
}

function isText(
  node: parse5.DefaultTreeNode
): node is parse5.DefaultTreeTextNode {
  return node.nodeName === "#text";
}

function getAttributes(node: parse5.DefaultTreeElement): NonNullable<any> {
  let attrs: NonNullable<any> = (node.attrs || []).reduce(
    (attributes: NonNullable<any>, attr: parse5.Attribute) => {
      if (attr.name.indexOf("data-") === 0) {
        if (attributes["-html-dataset"] == null)
          attributes["-html-dataset"] = {};
        attributes["-html-dataset"][attr.name.slice(5)] = attr.value;
      } else {
        attributes[`-html-${attr.name}`] = attr.value;
      }
      return attributes;
    },
    {}
  );

  let href = attrs["-html-href"];
  if (node.tagName === "a" && typeof href === "string") {
    attrs["-html-href"] = decodeURI(href);
  }
  return attrs;
}

export default class Parser {
  content: string;

  annotations: AnnotationJSON[];

  private html: string;

  private offset: number;

  constructor(html: string) {
    this.html = html;
    this.content = "";
    this.annotations = [];
    this.offset = 0;

    let tree = parse5.parseFragment(html, { sourceCodeLocationInfo: true });
    if (isDocumentFragment(tree)) {
      this.walk(tree.childNodes);
    } else {
      throw new Error("Invalid return from parser. Failing.");
    }
  }

  walk(nodes: parse5.DefaultTreeNode[]) {
    return (nodes || []).forEach(node => {
      if (isElement(node)) {
        let elementNode = node;
        let annotationGenerator = this.convertNodeToAnnotation(elementNode);
        // <tag>
        annotationGenerator.next();
        this.walk(elementNode.childNodes);
        // </tag>
        annotationGenerator.next();
      } else if (isText(node)) {
        let textNode = node;
        let location = textNode.sourceCodeLocation;
        if (location) {
          let html = this.html.slice(location.startOffset, location.endOffset);
          let text = textNode.value;
          this.content += text;
          this.offset += html.length - text.length;
        }
      }
    });
  }

  convertTag(
    node: parse5.DefaultTreeElement,
    which: "startTag" | "endTag"
  ): number {
    let location = node.sourceCodeLocation;
    if (location == null) return -1;

    let { startOffset: start, endOffset: end } = location[which];
    let reason =
      which === "startTag" ? `<${node.tagName}>` : `</${node.tagName}>`;
    this.annotations.push(
      new ParseAnnotation({
        attributes: { reason },
        start: start - this.offset,
        end: end - this.offset
      })
    );
    this.content += this.html.slice(start, end);
    return end - this.offset;
  }

  *convertNodeToAnnotation(
    node: parse5.DefaultTreeElement
  ): IterableIterator<void> {
    let location = node.sourceCodeLocation;
    let tagName = node.tagName;

    if (location == null) {
      yield;
      return;
    }

    if (location.startTag && location.endTag) {
      let start = this.convertTag(node, "startTag");

      yield;

      this.annotations.push({
        type: `-html-${tagName}`,
        attributes: getAttributes(node),
        start,
        end: location.endTag.startOffset - this.offset
      });

      this.convertTag(node, "endTag");
    } else if (location.startTag) {
      let start = this.convertTag(node, "startTag");

      yield;

      this.annotations.push({
        type: `-html-${tagName}`,
        attributes: getAttributes(node),
        start,
        end: location.endOffset - this.offset
      });
    } else {
      let start = location.startOffset - this.offset;
      let end = location.endOffset - this.offset;

      this.content += this.html.slice(location.startOffset, location.endOffset);
      this.annotations.push(
        new ParseAnnotation({
          attributes: { reason: `<${tagName}/>` },
          start,
          end
        }),
        {
          type: `-html-${tagName}`,
          attributes: getAttributes(node),
          start,
          end
        }
      );

      yield;
    }
  }
}
