struct State {
    bool begun;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_DUMP>(ctx))
        return;

    State* state = getState(ctx);
    if (!state->begun) {
        Serial.begin(115200);
        state->begun = true;
    }

    auto line = getValue<input_LINE>(ctx);
    if (line) {
        for (auto it = line->iterate(); it; ++it)
            Serial.write((char)*it);
        Serial.write('\r');
        Serial.write('\n');
        Serial.flush();
    }
}
