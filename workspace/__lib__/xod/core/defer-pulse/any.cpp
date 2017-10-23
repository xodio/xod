struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    State* state = getState(ctx);

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
