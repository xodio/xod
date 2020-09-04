
node {
    bool wasEnabled;
    TimeMs timeToSwitch;
    TimeMs nextSwitchTime;

    void evaluate(Context ctx) {
        TimeMs t = transactionTime();

        bool enabled = getValue<input_EN>(ctx);
        bool reset = isInputDirty<input_RST>(ctx);
        Number period = getValue<input_T>(ctx);
        Number duty = getValue<input_DUTY>(ctx);

        if (reset) {
            emitValue<output_OUT>(ctx, enabled);
            emitValue<output_N>(ctx, 0);
            clearTimeout(ctx);
            // enforce rescheduling at the next stage if enabled
            wasEnabled = false;
        }

        if (enabled && !wasEnabled) {
            // just enabled/resumed
            timeToSwitch = (period * duty) * 1000.0;
            setTimeout(ctx, timeToSwitch);
            nextSwitchTime = t + timeToSwitch;
            emitValue<output_OUT>(ctx, true);
        } else if (!enabled && wasEnabled) {
            // just paused
            // TODO: we can get rid of storing nextSwitchTime if API would
            // have a function to fetch current scheduled time for a ctx
            timeToSwitch = nextSwitchTime - t;
            clearTimeout(ctx);
        } else if (isTimedOut(ctx)) {
            // switch time
            auto newValue = !getValue<output_OUT>(ctx);
            auto k = newValue ? duty : (1.0 - duty);
            timeToSwitch = period * k * 1000.0;

            setTimeout(ctx, timeToSwitch);
            nextSwitchTime = t + timeToSwitch;

            emitValue<output_OUT>(ctx, newValue);
            if (newValue)
                emitValue<output_N>(ctx, getValue<output_N>(ctx) + 1);
        }

        wasEnabled = enabled;
    }
}
