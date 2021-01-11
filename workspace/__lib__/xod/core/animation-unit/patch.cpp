node {
    TimeMs prevTime;

    void evaluate(Context ctx) {
        auto now = transactionTime();
        auto rate = max((Number)0, getValue<input_RATE>(ctx));
        auto out = getValue<output_OUT>(ctx);

        if (isInputDirty<input_FWD>(ctx)) {
            // Fast forward to 1.0
            emitValue<output_OUT>(ctx, 1);
            emitValue<output_ACT>(ctx, false);
            clearTimeout(ctx);
            return;
        }

        if (isInputDirty<input_PLAY>(ctx)) {
            // Start animation from scratch
            emitValue<output_OUT>(ctx, 0);
            emitValue<output_ACT>(ctx, true);
            prevTime = now;
            setTimeout(ctx, 0);
            return;
        }

        if (isInputDirty<input_REV>(ctx)) {
            // Rewind to 0.0 and cancel animation
            emitValue<output_OUT>(ctx, 0);
            emitValue<output_ACT>(ctx, false);
            clearTimeout(ctx);
            return;
        }

        if (isTimedOut(ctx)) {
            // Continue animation
            auto dt = now - prevTime;
            out += dt / 1000.0 * rate;

            if (out >= 1) {
                emitValue<output_OUT>(ctx, 1);
                emitValue<output_ACT>(ctx, false);
                emitValue<output_DONE>(ctx, 1);
            } else {
                emitValue<output_OUT>(ctx, out);
                emitValue<output_ACT>(ctx, true);
                prevTime = now;
                setTimeout(ctx, 0);
            }
        }
    }
}
