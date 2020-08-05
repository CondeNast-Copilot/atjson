import Document, {
  Annotation,
  AnnotationJSON,
  UnknownAnnotation,
  is,
} from "@atjson/document";
import { HIR, HIRNode, TextAnnotation } from "@atjson/hir";

interface Mapping {
  [key: string]: string;
}

const escape: Mapping = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

type EscapeCharacter = keyof Mapping;

function doEscape(chr: EscapeCharacter) {
  return escape[chr];
}

export function escapeHTML(text: string): string {
  return text.replace(/[&<>"'`=]/g, doEscape);
}

function flatten<T>(array: Array<T | T[]>): T[] {
  let flattenedArray = [];
  for (let i = 0, len = array.length; i < len; i++) {
    let item = array[i];
    if (Array.isArray(item)) {
      flattenedArray.push(...flatten(item));
    } else if (item != null) {
      flattenedArray.push(item);
    }
  }
  return flattenedArray;
}

function classifyWord(word: string) {
  if (word.length > 0) {
    return word[0].toUpperCase() + word.slice(1);
  }
  return "";
}

// This classify is _specifically_ for our annotation types—
// casing is ignored, and dashes are the only thing allowed.
export function classify(type: string) {
  return type.toLowerCase().split("-").map(classifyWord).join("");
}

export interface Context {
  parent: Annotation<any>;
  previous: Annotation<any> | (AnnotationJSON & { toJSON(): object }) | null;
  next: Annotation<any> | (AnnotationJSON & { toJSON(): object }) | null;
  children: Array<Annotation<any>>;
  document: Document;
}

function isTextAnnotation(a: Annotation<any>): a is TextAnnotation {
  return (
    a.getAnnotationConstructor().vendorPrefix === "atjson" && a.type === "text"
  );
}

function compile(
  renderer: Renderer,
  node: HIRNode,
  context: Partial<Context> & { document: Document }
): any {
  let annotation = node.annotation;
  let childNodes = node.children();
  let childAnnotations = childNodes.map(normalizeChildNode);
  let generator: Iterator<void, any, any[]>;

  if (context.parent == null) {
    generator = renderer.root();
  } else {
    generator = renderer.renderAnnotation(annotation, {
      ...context,
      children: childAnnotations,
    } as Context);
  }

  let result = generator.next();
  if (result.done) {
    return result.value;
  }

  return generator.next(
    flatten(
      childNodes.map(function compileChildNode(
        childNode: HIRNode,
        idx: number
      ) {
        let childContext = {
          parent: annotation || null,
          previous: childAnnotations[idx - 1] || null,
          next: childAnnotations[idx + 1] || null,
          document: context.document,
        };

        if (childNode.type === "text") {
          return renderer.text(childNode.text, {
            ...childContext,
            children: [],
          });
        }

        return compile(renderer, childNode, childContext) as any[];
      })
    )
  ).value;
}

/**
 * This normalizes the child node (from the HIR) to ensure that we only attempt
 * to render _known_ annotations, and converts text nodes (leaf nodes in the HIR)
 * to have the same shape as 'normal' annotations.
 *
 * Usually, a document that contains `UnknownAnnotations` hasn't been fully
 * converted, and if we didn't throw here, we would simply silently fail to
 * render the document properly.
 *
 * It may be that in the future, we'll add a check that converters *must* convert
 * all annotations (and there is a WIP change to make all converters renderers,
 * which would have the same effect in conjunction with this change). In that case,
 * it would be impossible to have a document that has UnknownAnnotations. At
 * the time of writing, though, we haven't made a determination because there
 * are some use cases that would benefit from supporting UnknownAnnotations.
 */
function normalizeChildNode(childNode: HIRNode) {
  if (isTextAnnotation(childNode.annotation)) {
    return textAnnotationFromNode(childNode);
  } else if (is(childNode.annotation, UnknownAnnotation)) {
    // FIXME This is not helpful debugging information, but I'm not sure the best way to surface more detail.
    // eslint-disable-next-line no-console
    console.debug(
      "Encountered unknown annotation in render:",
      childNode.annotation
    );
    throw new Error(
      "Cannot render an unknown annotation. Ensure all annotations are converted or removed before attempting to render."
    );
  } else {
    return childNode.annotation;
  }
}

function textAnnotationFromNode(childNode: HIRNode) {
  return {
    type: "text",
    start: childNode.start,
    end: childNode.end,
    attributes: {
      text: childNode.text,
    },
    toJSON(): object {
      return {
        id: "Any<id>",
        type: "-atjson-text",
        start: childNode.start,
        end: childNode.end,
        attributes: {
          "-atjson-text": childNode.text,
        },
      };
    },
  };
}

export default class Renderer {
  static render<T extends typeof Renderer>(
    this: T,
    ...params: ConstructorParameters<T>
  ) {
    let document = params[0];
    let renderer = new this(document, ...params.slice(1));

    return compile(renderer, new HIR(document).rootNode, { document });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  constructor(_document: Document, ..._args: any[]) {}

  *renderAnnotation(
    annotation: Annotation<any>,
    context: Context
  ): Iterator<void, any, any> {
    let generator =
      (this as any)[annotation.type] ||
      (this as any)[classify(annotation.type)];
    if (generator) {
      return yield* generator.call(this, annotation, context);
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        `[${this.constructor.name}]: No handler present for annotations of type ${annotation.type}. Possibly important information has been dropped.`
      );
      // eslint-disable-next-line no-console
      console.debug("Unsupported annotation:", annotation);
      return yield;
    }
  }

  *root() {
    return yield;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  text(text: string, _: Context): any {
    return text;
  }
}
