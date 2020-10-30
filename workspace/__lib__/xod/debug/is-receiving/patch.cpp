#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_UPD

node {
    bool received = false;
    TimeMs startTime = 0;
    bool isWaiting = false;

    void evaluate(Context ctx) {
        auto inet = getValue<input_INET>(ctx);
        emitValue<output_INETU0027>(ctx, inet);

        auto t = getValue<input_T>(ctx);

        if (isInputDirty<input_UPD>(ctx)) {
            startTime = transactionTime();
            setImmediate();
            isWaiting = true;
        }

        if (isWaiting) {
            bool shouldWait = startTime + (t * 1000) > transactionTime();
            if (shouldWait && inet->isConnected()) {
                // No incoming data, but we're still waiting for data
                if (!inet->isReceiving()) {
                    setImmediate();
                    return;
                }
                // Receiving data
                received = true;
                startTime = transactionTime();
                setImmediate();
                emitValue<output_Y>(ctx, 1);
            } else {
                isWaiting = false;
                // No more incoming data
                if (received && !inet->isReceiving()) {
                    received = false;
                    emitValue<output_END>(ctx, 1);
                    return;
                }
                // Timeout error
                raiseError(ctx);
            }
        }
    }
}
