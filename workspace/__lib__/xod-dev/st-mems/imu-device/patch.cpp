#include <Wire.h>

node {
    meta {
        struct Device {
            TwoWire* i2c;
            uint8_t addr;
            Number mult;
        };

        using Type = Device*;
    }

    Device dev;
    void evaluate(Context ctx) {
        dev.i2c = getValue<input_I2C>(ctx);
        dev.addr = getValue<input_ADDR>(ctx);
        dev.mult = getValue<input_MULT>(ctx);
        emitValue<output_DEV>(ctx, &dev);
    }
}
