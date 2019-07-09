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
    } else if (getValue<output_VAL>(ctx)) {
        // Any call of `emitValue` marks output port as dirty
        // and it means that pulse emited.
        // But the tabtest engine injects `true` or `false` into `output_VAL`
        // so we have to emit pulse only when it's `true`.
        emitValue<output_VAL>(ctx, 1);
    }
}
