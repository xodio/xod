#pragma XOD error_raise enable
#pragma XOD error_catch enable

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto defError = getError<input_DEF>(ctx);

    if (defError) {
        // "DEF" input should not contain an error — reraise it
        raiseError(ctx);
    } else {
        emitValue<output_OUT>(ctx, getError<input_IN>(ctx) ? getValue<input_DEF>(ctx) : getValue<input_IN>(ctx));
    }
}
