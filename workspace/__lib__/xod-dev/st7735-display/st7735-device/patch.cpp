#include <XST7735.h>

node {
    meta {
        using Type = ST7735*;
    }

    static_assert(isValidDigitalPort(constant_input_CS), "must be a valid digital port");
    static_assert(isValidDigitalPort(constant_input_DC), "must be a valid digital port");
    static_assert(constant_input_RST == 255 || isValidDigitalPort(constant_input_RST), "must be a valid digital port");

    ST7735 dev = ST7735(constant_input_CS, constant_input_DC, constant_input_RST);

    void evaluate(Context ctx) {
        if (!isSettingUp()) return;
        emitValue<output_DEV>(ctx, &dev);
    }
}
