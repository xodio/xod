#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_DUMP

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_DUMP>(ctx))
            return;

        auto line = getValue<input_LINE>(ctx);

        for (auto it = line->iterate(); it; ++it)
            XOD_DEBUG_SERIAL.write((char)*it);

        XOD_DEBUG_SERIAL.write('\r');
        XOD_DEBUG_SERIAL.write('\n');

        XOD_DEBUG_SERIAL.flush();
    }
}
