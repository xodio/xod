#pragma XOD error_catch enable

struct State {
    bool lastValue;
    bool hadError = false;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    state->lastValue = getValue<input_VAL>(ctx);
    state->hadError = getError<input_VAL>(ctx);
}
