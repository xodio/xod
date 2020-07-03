
// clang-format off
{{#global}}
#include <ESP8266WiFi.h>
{{/global}}
// clang-format on

struct State {
};

struct Type {
  ESP8266WiFiClass* wifi;
  WiFiClient *sockets[5];
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    Type inet = { &WiFi, { nullptr, nullptr, nullptr, nullptr, nullptr } };
    emitValue<output_OUT>(ctx, inet);
}
