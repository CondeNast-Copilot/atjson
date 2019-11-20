import { ObjectAnnotation } from "@atjson/document";
import { CaptionSource } from "./caption-source";

export function without<T>(array: T[], value: T): T[] {
  let result: T[] = [];
  return array.reduce((presentParts, part) => {
    if (part !== value) {
      presentParts.push(part);
    }
    return presentParts;
  }, result);
}

export class IframeEmbed<AdditionalAttributes = {}> extends ObjectAnnotation<
  {
    url: string;
    width?: string;
    height?: string;
    caption?: CaptionSource;
    sandbox?: string;
  } & AdditionalAttributes
> {
  static type = "iframe-embed";
  static vendorPrefix = "offset";
  static subdocuments = { caption: CaptionSource };

  get url() {
    try {
      return new URL(this.attributes.url);
    } catch (e) {
      return null;
    }
  }
}
