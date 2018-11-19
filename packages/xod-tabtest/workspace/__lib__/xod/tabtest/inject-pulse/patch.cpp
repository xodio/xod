struct State {};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (getValue<output_VAL>(ctx)) {
        // Any call of `emitValue` marks output port as dirty
        // and it means that pulse emited.
        // But the tabtest engine injects `true` or `false` into `output_VAL`
        // so we have to emit pulse only when it's `true`.
        emitValue<output_VAL>(ctx, 1);
    }
}
