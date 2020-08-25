#pragma XOD error_raise enable

node {
  static const uint8_t RECEHCK_DURATION_MS = 30;
  uint16_t rechecksLeft;

  void evaluate(Context ctx) {
      auto device = getValue<input_DEV>(ctx);

      if (isInputDirty<input_CONN>(ctx)) {
          auto ssid = getValue<input_SSID>(ctx);
          auto ssidLength = length(ssid);
          char _ssid[ssidLength + 1];
          dump(ssid, _ssid);
          _ssid[ssidLength] = '\0';

          auto password = getValue<input_PWD>(ctx);
          auto passwordLength = length(password);
          char _password[passwordLength + 1];
          dump(password, _password);
          _password[passwordLength] = '\0';

          /* Explicitly set the ESP8266 to be a WiFi-client, otherwise, it by default,
             would try to act as both a client and an access-point and could cause
             network-issues with your other WiFi-devices on your WiFi-network. */
          device->mode(WIFI_STA);
          device->begin(_ssid, _password);

          auto timeout = getValue<input_TO>(ctx);
          rechecksLeft = ceil(timeout * 1000.0 / RECEHCK_DURATION_MS);
          setTimeout(ctx, RECEHCK_DURATION_MS);
      }

      if (isTimedOut(ctx)) {
          if (device->status() != WL_CONNECTED) {
              rechecksLeft -= 1;

              if (rechecksLeft == 0) {
                  raiseError(ctx); // Connection failed
              } else {
                  setTimeout(ctx, RECEHCK_DURATION_MS);
              }
          } else {
              emitValue<output_DONE>(ctx, true);
              typeof_INET inet;
              inet.wifi = device;
              emitValue<output_INET>(ctx, inet);
          }
      }
  }
}
