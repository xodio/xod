#pragma XOD error_raise enable

#include <LiquidCrystal.h>

node {
    meta {
      struct Type {
          LiquidCrystal* lcd;
          uint8_t rows;
          uint8_t cols;
      };
    }

    static_assert(isValidDigitalPort(constant_input_RS), "must be a valid digital port");
    static_assert(isValidDigitalPort(constant_input_EN), "must be a valid digital port");
    static_assert(isValidDigitalPort(constant_input_D4), "must be a valid digital port");
    static_assert(isValidDigitalPort(constant_input_D5), "must be a valid digital port");
    static_assert(isValidDigitalPort(constant_input_D6), "must be a valid digital port");
    static_assert(isValidDigitalPort(constant_input_D7), "must be a valid digital port");

    LiquidCrystal lcd = LiquidCrystal(
      constant_input_RS,
      constant_input_EN,
      constant_input_D4,
      constant_input_D5,
      constant_input_D6,
      constant_input_D7
    );

    void evaluate(Context ctx) {
        uint8_t rows = (uint8_t) getValue<input_ROWS>(ctx);
        uint8_t cols = (uint8_t) getValue<input_COLS>(ctx);

        Type t;
        t.rows = rows;
        t.cols = cols;
        t.lcd = &lcd;
        t.lcd->begin(t.cols, t.rows);

        emitValue<output_DEV>(ctx, t);
    }
}
