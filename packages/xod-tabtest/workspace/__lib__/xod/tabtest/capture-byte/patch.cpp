#pragma XOD error_catch enable

struct State {
    uint8_t lastValue;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    getState(ctx)->lastValue = getValue<input_VAL>(ctx);
}
