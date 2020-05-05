
node {
    TimeMs nextTrig;

    void evaluate(Context ctx) {
        TimeMs tNow = transactionTime();
        auto ival = getValue<input_IVAL>(ctx);
        if (ival < 0) ival = 0;
        TimeMs dt = ival * 1000;
        TimeMs tNext = tNow + dt;

        auto isEnabled = getValue<input_EN>(ctx);
        auto isRstDirty = isInputDirty<input_RST>(ctx);

        if (isTimedOut(ctx) && isEnabled && !isRstDirty) {
            emitValue<output_TICK>(ctx, 1);
            nextTrig = tNext;
            setTimeout(ctx, dt);
        }

        if (isRstDirty || isInputDirty<input_EN>(ctx)) {
            // Handle enable/disable/reset
            if (!isEnabled) {
                // Disable timeout loop on explicit false on EN
                nextTrig = 0;
                clearTimeout(ctx);
            } else if (nextTrig < tNow || nextTrig > tNext) {
                // Start timeout from scratch
                nextTrig = tNext;
                setTimeout(ctx, dt);
            }
        }
    }
}
