#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_UPD

node {
    bool received = false;
    TimeMs startTime = 0;

    void evaluate(Context ctx) {
        auto inet = getValue<input_INET>(ctx);
        emitValue<output_INETU0027>(ctx, inet);

        auto t = getValue<input_T>(ctx);

        if (isInputDirty<input_UPD>(ctx)) {
            startTime = transactionTime();
            setTimeout(ctx, 0);
            return;
        }

        if (isTimedOut(ctx)) {
            bool shouldWait = startTime + (t * 1000) > transactionTime();
            if (shouldWait && inet->isConnected()) {
                // No incoming data, but we're still waiting for data
                if (!inet->isReceiving()) {
                    setTimeout(ctx, 0);
                    return;
                }
                // Receiving data
                received = true;
                setTimeout(ctx, 0);
                emitValue<output_Y>(ctx, 1);
                return;
            } else {
                // No more incoming data
                if (received && !inet->isReceiving()) {
                    received = false;
                    emitValue<output_END>(ctx, 1);
                    return;
                }
                // Timeout error
                raiseError(ctx);
                return;
            }
        }
    }
}
