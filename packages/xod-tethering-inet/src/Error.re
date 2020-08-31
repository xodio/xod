type t =
  | UNKNOWN_COMMAND
  | INVALID_ARGUMENTS
  | EXPECTED_ARGUMENTS(int)
  | INVALID_HOSTNAME(string)
  | INVALID_PORT(string)
  | INVALID_CONNECTION_TYPE(string)
  | INVALID_KEEPALIVE(string)
  | INVALID_LINKID(string);

let stringify = error =>
  switch (error) {
  | UNKNOWN_COMMAND => "UNKNOWN COMMAND"
  | INVALID_ARGUMENTS => "INVALID ARGUMENTS"
  | EXPECTED_ARGUMENTS(a) =>
    "EXPECTED ARGUMENTS (" ++ Js.String.make(a) ++ ")"
  | INVALID_HOSTNAME(a) => "INVALID HOSTNAME (" ++ a ++ ")"
  | INVALID_PORT(a) => "INVALID PORT (" ++ a ++ ")"
  | INVALID_CONNECTION_TYPE(a) => "INVALID CONNECTION TYPE (" ++ a ++ ")"
  | INVALID_KEEPALIVE(a) => "INVALID KEEPALIVE ARGUMENT (" ++ a ++ ")"
  | INVALID_LINKID(a) => "INVALID LINKID ARGUMENT (" ++ a ++ ")"
  };