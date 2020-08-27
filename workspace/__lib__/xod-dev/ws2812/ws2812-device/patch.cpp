#include <WS2812.h>

node {
    static_assert(isValidDigitalPort(constant_input_PORT), "must be a valid digital port");

    meta {
        using Type = WS2812*;
    }

    uint8_t mem[sizeof(WS2812)];

    void evaluate(Context ctx) {
        if (!isSettingUp()) return;
        uint32_t w = (uint32_t)getValue<input_W>(ctx);
        Type t = new (mem) WS2812(constant_input_PORT, w);
        emitValue<output_DEV>(ctx, t);
    }
}
