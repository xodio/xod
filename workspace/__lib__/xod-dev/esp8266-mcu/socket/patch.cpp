
// clang-format off
{{#global}}
#include <ESP8266WiFi.h>
{{/global}}
// clang-format on

using Type = WiFiClient*;

struct State {
    Type client;
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    auto state = getState(ctx);

    if (isSettingUp()) {
        // Normally, WiFiClient would be constructed on a
        // pre-allocated buffer using a placement new operator.
        // (xod-dev/esp8266/esp8266-device is a nice example)
        // But this `evaluate` will be called only if someone
        // forgot to link a "proper" `socket`(created with `open-tcp`).
        state->client = new WiFiClient();
    }

    emitValue<output_OUT>(ctx, state->client);
}
