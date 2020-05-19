[@bs.module "address"] external ip: unit => string = "ip";

[@bs.module "address"] [@bs.val]
external mac_: (('err, 'mac) => unit) => unit = "mac";

let mac = () =>
  Js.Promise.make((~resolve, ~reject) =>
    mac_((err, res) =>
      err
      |> Js.Nullable.toOption
      |> (
        oErr =>
          switch (oErr) {
          | Some(e) => reject(. e)
          | None => resolve(. res)
          }
      )
    )
  );
