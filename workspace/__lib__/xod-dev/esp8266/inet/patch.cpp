// clang-format off
{{#global}}
#include <ESP8266UART.h>
{{/global}}
// clang-format on

struct State {
};

struct Type {
    uint32_t ip;
    ESP8266* wifi;
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    auto dev = getValue<input_DEV>(ctx);
    auto ip = getValue<input_IP>(ctx);
    Type obj;
    obj.ip = ip;
    obj.wifi = dev.wifi;
    emitValue<output_INET>(ctx, obj);
}
