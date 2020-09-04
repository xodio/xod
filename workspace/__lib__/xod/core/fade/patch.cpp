#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_UPD

node {
    TimeMs lastUpdateTime;

    void evaluate(Context ctx) {
        if (!isInputDirty<input_UPD>(ctx)) {
            return;
        }

        TimeMs now = transactionTime();
        Number target = getValue<input_TARG>(ctx);
        Number position = getValue<output_OUT>(ctx);

        if (target == position) {
            // Already done. Store timestamp anyway so that an animation to a new
            // value would not jump at the first update
            lastUpdateTime = now;
            return;
        }

        Number rate = getValue<input_RATE>(ctx);
        TimeMs dtMs = now - lastUpdateTime;
        Number step = (Number)dtMs / 1000. * rate;

        if (target > position) {
            position = min(target, position + step);
        } else {
            position = max(target, position - step);
        }

        emitValue<output_OUT>(ctx, position);
        lastUpdateTime = now;
    }
}
