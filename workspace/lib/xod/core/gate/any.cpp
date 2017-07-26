struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    if (!isInputDirty<input_TRIG>(nid))
        return;

    if (getValue<input_GATE>(nid)) {
        emitValue<output_T>(nid, 1);
    } else {
        emitValue<output_F>(nid, 1);
    }
}
