import { InlineAnnotation } from "@atjson/document";

export class Link extends InlineAnnotation<{
  url: string;
  title?: string;
  rel?: string;
  target?: string;
  isAffiliateLink?: boolean;
  isButton?: boolean;
}> {
  static vendorPrefix = "offset";
  static type = "link";
}
