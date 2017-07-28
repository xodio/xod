struct State {
  TimeMs nextTrig;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    State* state = getState(ctx);
    TimeMs tNow = transactionTime();
    TimeMs dt = getValue<input_IVAL>(ctx) * 1000;
    TimeMs tNext = tNow + dt;

    if (isInputDirty<input_RST>(ctx)) {
        if (dt == 0) {
            state->nextTrig = 0;
            clearTimeout(ctx);
        } else if (state->nextTrig < tNow || state->nextTrig > tNext) {
            state->nextTrig = tNext;
            setTimeout(ctx, dt);
        }
    } else {
        // It was a scheduled tick
        emitValue<output_TICK>(ctx, 1);
        state->nextTrig = tNext;
        setTimeout(ctx, dt);
    }
}
