struct State {
    bool begun;
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
    if (!isInputDirty<Inputs::DUMP>(nid))
        return;

    if (!state->begun) {
        Serial.begin(9600);
    }

    auto line = getValue<Inputs::LINE>(nid);
    if (line) {
        for (auto it = line->iterate(); it; ++it)
            Serial.write((char)*it);
        Serial.write('\n');
        Serial.flush();
    }
}
