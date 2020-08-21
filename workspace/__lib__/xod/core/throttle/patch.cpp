node {
    bool hasStarted : 1;
    bool shouldEmitOnEnd : 1;

    void evaluate(Context ctx) {
        if (isSettingUp()) {
            hasStarted = false;
            shouldEmitOnEnd = false;
        }
        auto inValue = getValue<input_IN>(ctx);

        if (isInputDirty<input_IN>(ctx)) {
            if (!hasStarted) {
                hasStarted = true;
                emitValue<output_OUT>(ctx, inValue);
                TimeMs dt = getValue<input_T>(ctx) * 1000;
                setTimeout(ctx, dt);
            } else {
                shouldEmitOnEnd = true;
            }
        }

        if (isTimedOut(ctx) && shouldEmitOnEnd) {
            shouldEmitOnEnd = false;
            TimeMs dt = getValue<input_T>(ctx) * 1000;
            setTimeout(ctx, dt);
            emitValue<output_OUT>(ctx, inValue);
        } else if (isTimedOut(ctx)) {
            hasStarted = false;
        }
    }
}
