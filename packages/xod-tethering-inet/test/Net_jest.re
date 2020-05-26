open Jest;

open Net;

describe("Net", () => {
  testAsync(
    "HTTP GET api.xod.io",
    ~timeout=5000,
    finish => {
      let sock = connect(80, "35.184.230.84");
      ignore(
        sock
        |> setEncoding("utf8")
        |> setKeepAlive(false, 0)
        |> setTimeout(1000),
      );
      sock
      ->on("ready", () => {
          ignore(
            sock->write("GET /httpbin/now HTTP/1.1\nHost: api.xod.io\n\n\n"),
          )
        })
      ->on("timeout", () => finish(pass))
      ->ignore;

      ignore(sock);
    },
  )
});
