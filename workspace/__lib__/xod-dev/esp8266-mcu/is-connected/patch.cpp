
// clang-format off
{{#global}}
#include <ESP8266WiFi.h>
{{/global}}
// clang-format on

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto device = getValue<input_DEV>(ctx);

    emitValue<output_OUT>(ctx, device->status() == WL_CONNECTED);
}
