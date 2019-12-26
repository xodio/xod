{{#global}}
#include <WS2812.h>
{{/global}}

struct State {
    uint8_t mem[sizeof(WS2812)];
};

using Type = WS2812*;

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    State* state = getState(ctx);
    auto port = getValue<input_PORT>(ctx);
    uint32_t w = (uint32_t) getValue<input_W>(ctx);
    Type t = new (state->mem) WS2812(port, w);
    emitValue<output_DEV>(ctx, t);
}
