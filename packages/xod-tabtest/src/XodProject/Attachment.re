type t;

[@bs.module "xod-project"]
external getFilename : t => string = "getAttachmentFilename";

[@bs.module "xod-project"]
external getContent : t => string = "getAttachmentContent";

[@bs.module "xod-project"]
external getEncoding : t => string = "getAttachmentEncoding";
