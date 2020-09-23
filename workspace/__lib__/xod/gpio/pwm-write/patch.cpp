#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_UPD

#ifdef ESP32
#include <analogWrite.h>
#endif

node {
    #ifdef PWMRANGE
    static constexpr Number pwmRange = PWMRANGE;
    #else
    static constexpr Number pwmRange = 255.0;
    #endif

    void evaluate(Context ctx) {
        static_assert(isValidDigitalPort(constant_input_PORT), "must be a valid digital port");

        if (!isInputDirty<input_UPD>(ctx))
            return;

        auto duty = getValue<input_DUTY>(ctx);
        duty = duty > 1 ? 1 : (duty < 0 ? 0 : duty);
        int val = (int)(duty * pwmRange);

        pinMode(constant_input_PORT, OUTPUT);
        analogWrite(constant_input_PORT, val);

        emitValue<output_DONE>(ctx, 1);
    }
}
