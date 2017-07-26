struct State {
    bool begun;
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    if (!isInputDirty<input_DUMP>(nid))
        return;

    State* state = getState(nid);
    if (!state->begun) {
        Serial.begin(9600);
    }

    auto line = getValue<input_LINE>(nid);
    if (line) {
        for (auto it = line->iterate(); it; ++it)
            Serial.write((char)*it);
        Serial.write('\r');
        Serial.write('\n');
        Serial.flush();
    }
}
