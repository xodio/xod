type t;

[@bs.module ".."]
external getFilename : t => string = "getAttachmentFilename";

[@bs.module ".."]
external getContent : t => string = "getAttachmentContent";

[@bs.module ".."]
external getEncoding : t => string = "getAttachmentEncoding";

let isTabtest = att => getFilename(att) == "patch.test.tsv";
