{{#global}}
#include <Wire.h>
{{/global}}

struct State {
    TwoWire* i2c;
    uint8_t addr;
};

using Type = State*;

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto dev = getState(ctx);
    dev->i2c = getValue<input_I2C>(ctx);
    dev->addr = getValue<input_ADDR>(ctx);
    emitValue<output_DEV>(ctx, dev);
}
