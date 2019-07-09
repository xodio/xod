#pragma XOD error_raise enable

struct State {
    bool shouldRaise = false;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    if (state->shouldRaise) {
        raiseError<output_VAL>(ctx);
        state->shouldRaise = false;
    } else {
        emitValue<output_VAL>(ctx, getValue<output_VAL>(ctx));
    }
}
