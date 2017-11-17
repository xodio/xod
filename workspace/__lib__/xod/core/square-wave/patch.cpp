struct State {
    bool wasEnabled;
    TimeMs timeToSwitch;
    TimeMs nextSwitchTime;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    State* state = getState(ctx);
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
        state->wasEnabled = false;
    }

    if (enabled && !state->wasEnabled) {
        // just enabled/resumed
        state->timeToSwitch = (period * duty) * 1000.0;
        setTimeout(ctx, state->timeToSwitch);
        state->nextSwitchTime = t + state->timeToSwitch;
        emitValue<output_OUT>(ctx, true);
    } else if (!enabled && state->wasEnabled) {
        // just paused
        // TODO: we can get rid of storing nextSwitchTime if API would
        // have a function to fetch current scheduled time for a ctx
        state->timeToSwitch = state->nextSwitchTime - t;
        clearTimeout(ctx);
    } else if (isTimedOut(ctx)) {
        // switch time
        auto newValue = !getValue<output_OUT>(ctx);
        auto k = newValue ? duty : (1.0 - duty);
        state->timeToSwitch = period * k * 1000.0;

        setTimeout(ctx, state->timeToSwitch);
        state->nextSwitchTime = t + state->timeToSwitch;

        emitValue<output_OUT>(ctx, newValue);
        if (newValue)
            emitValue<output_N>(ctx, getValue<output_N>(ctx) + 1);
    }

    state->wasEnabled = enabled;
}
