#pragma XOD error_raise enable

#include <Wire.h>
#include <LiquidCrystal_I2C.h>

node {
    meta {
        struct Type {
            LiquidCrystal_I2C* lcd;
            uint8_t rows;
            uint8_t cols;
        };
    }

    uint8_t mem[sizeof(LiquidCrystal_I2C)];

    void evaluate(Context ctx) {
        uint8_t addr = getValue<input_ADDR>(ctx);
        uint8_t rows = (uint8_t) getValue<input_ROWS>(ctx);
        uint8_t cols = (uint8_t) getValue<input_COLS>(ctx);

        if (addr > 127) {
            raiseError(ctx);
            return;
        }

        Type t;
        t.rows = rows;
        t.cols = cols;
        // do we need `&` here?
        t.lcd = new (mem) LiquidCrystal_I2C(addr, cols, rows);
        t.lcd->begin();

        emitValue<output_DEV>(ctx, t);
    }
}
