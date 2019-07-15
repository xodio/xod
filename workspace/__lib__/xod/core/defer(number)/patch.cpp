#pragma XOD error_catch enable
#pragma XOD error_raise enable

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto err = getError<input_IN>(ctx);
    if (err) {
        raiseError<output_OUT>(ctx);
        setTimeout(ctx, 0);
    } else {
        if (isInputDirty<input_IN>(ctx)) { // This happens only when all nodes are evaluated
            setTimeout(ctx, 0);
            // This will not have any immediate effect, because
            // deferred nodes are at the very bottom of sorted graph.
            // We do this to just save the value for reemission
            // on deferred-only evaluation.
            emitValue<output_OUT>(ctx, getValue<input_IN>(ctx));
        } else { // deferred-only evaluation pass
            emitValue<output_OUT>(ctx, getValue<output_OUT>(ctx));
        }
    }
}
