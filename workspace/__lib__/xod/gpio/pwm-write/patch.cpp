#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_UPD

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

        const uint8_t port = getValue<input_PORT>(ctx);

        auto duty = getValue<input_DUTY>(ctx);
        duty = duty > 1 ? 1 : (duty < 0 ? 0 : duty);
        int val = (int)(duty * pwmRange);

        ::pinMode(port, OUTPUT);
        ::analogWrite(port, val);
        emitValue<output_DONE>(ctx, 1);
    }
}
