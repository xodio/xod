#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_UPD

struct State {
    bool received = false;
    TimeMs startTime = 0;
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    auto inet = getValue<input_INET>(ctx);
    emitValue<output_INETU0027>(ctx, inet);

    auto t = getValue<input_T>(ctx);
    auto state = getState(ctx);

    if (isInputDirty<input_UPD>(ctx)) {
        state->startTime = transactionTime();
        setTimeout(ctx, 0);
        return;
    }

    if (isTimedOut(ctx)) {
        bool shouldWait = state->startTime + (t * 1000) > transactionTime();
        if (shouldWait && inet->isConnected()) {
            // No incoming data, but we're still waiting for data
            if (!inet->isReceiving()) {
                setTimeout(ctx, 0);
                return;
            }
            // Receiving data
            state->received = true;
            setTimeout(ctx, 0);
            emitValue<output_Y>(ctx, 1);
            return;
        } else {
            // No more incoming data
            if (state->received && !inet->isReceiving()) {
                state->received = false;
                emitValue<output_END>(ctx, 1);
                return;
            }
            // Timeout error
            raiseError(ctx);
            return;
        }
    }
}
