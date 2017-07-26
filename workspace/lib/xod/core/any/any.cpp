struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    bool p1 = isInputDirty<input_P1>(nid);
    bool p2 = isInputDirty<input_P2>(nid);
    if (p1 || p2)
        emitValue<output_ANY>(nid, true);
}
