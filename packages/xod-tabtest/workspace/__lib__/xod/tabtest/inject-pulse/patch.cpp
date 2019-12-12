#pragma XOD error_raise enable

struct State {
    bool shouldPulse = false;
    bool shouldRaise = false;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    if (state->shouldRaise) {
        raiseError<output_VAL>(ctx);
        state->shouldRaise = false;
    } else if (state->shouldPulse) {
        emitValue<output_VAL>(ctx, 1);
        state->shouldPulse = false;
    }
}
