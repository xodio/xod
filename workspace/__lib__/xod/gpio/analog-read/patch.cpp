#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_UPD

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    const uint8_t port = getValue<input_PORT>(ctx);
    ::pinMode(port, INPUT);
    emitValue<output_VAL>(ctx, ::analogRead(port) / 1023.);
    emitValue<output_DONE>(ctx, 1);
}

template<uint8_t port>
void evaluateTmpl(Context ctx) {
    static_assert(isValidAnalogPort(port), "must be a valid analog port");

    evaluate(ctx);
}
