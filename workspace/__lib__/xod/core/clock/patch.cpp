struct State {
  TimeMs nextTrig;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    State* state = getState(ctx);
    TimeMs tNow = transactionTime();
    TimeMs dt = getValue<input_IVAL>(ctx) * 1000;
    TimeMs tNext = tNow + dt;

    auto isEnabled = getValue<input_EN>(ctx);
    auto isRstDirty = isInputDirty<input_RST>(ctx);

    if (isTimedOut(ctx) && isEnabled && !isRstDirty) {
        emitValue<output_TICK>(ctx, 1);
        state->nextTrig = tNext;
        setTimeout(ctx, dt);
    }

    if (isRstDirty || isInputDirty<input_EN>(ctx)) {
        // Handle enable/disable/reset
        if (dt <= 0 || !isEnabled) {
            // Disable timeout loop on zero IVAL or explicit false on EN
            state->nextTrig = 0;
            clearTimeout(ctx);
        } else if (state->nextTrig < tNow || state->nextTrig > tNext) {
            // Start timeout from scratch
            state->nextTrig = tNext;
            setTimeout(ctx, dt);
        }
    }
}
