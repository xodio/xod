
// clang-format off
{{#global}}
#include <ESP8266WiFi.h>
{{/global}}
// clang-format on

struct State {
};

using Type = ESP8266WiFiClass*;

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    emitValue<output_OUT>(ctx, &WiFi);
}
