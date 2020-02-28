open Jest;

open Expect;

let ipRegExp = [%re {|/^(\d{0,3}\.){3}(\d{0,3})/|}];

describe("Dns", () => {
  testPromise("Lookup google.com", () =>
    Dns.lookup("google.com")
    |> Js.Promise.then_(res =>
         expect(res) |> toMatchRe(ipRegExp) |> Js.Promise.resolve
       )
  )
});
