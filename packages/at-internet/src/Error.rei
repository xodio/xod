type t =
  | UNKNOWN_COMMAND
  | INVALID_ARGUMENTS
  | EXPECTED_ARGUMENTS(int)
  | INVALID_HOSTNAME(string)
  | INVALID_PORT(string)
  | INVALID_CONNECTION_TYPE(string)
  | INVALID_KEEPALIVE(string)
  | INVALID_LINKID(string);

let stringify: t => string;
