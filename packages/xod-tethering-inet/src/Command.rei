// The module parses a string commands into a strictly typed commands.

open Belt;

type t =
  // "AT" command to ensure that communication with the package works correctly. Should answer "OK"
  | AT
  // Command returns a list of opened connections
  | CIPSTATUS
  // Returns a local IP and Mac addreses
  | CIFSR
  // Turns on or off multiconnection.
  // By defeault, is turned off, which means that only one connection is allowed at the same time.
  | CIPMUX(bool)
  // Pings host
  | PING(Connection.Host.t)
  // DNS lookup for the host
  | CIPDOMAIN(Connection.Host.t)
  // Opens a TCP/UDP socket
  | CIPSTART(Connection.Link.t, Connection.t)
  // Sends data to the opened socket
  | CIPSEND(Connection.Link.t, int)
  // Closes the socket
  | CIPCLOSE(Connection.Link.t);

// Formats a stringly typed commands back to the string
let stringify: t => string;

// Parses a string command to the Command
let parse: string => Result.t(t, Error.t);

// Parses arguments from the command into an array of strings
let parseArguments: string => array(string);
