struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    bool p1 = isInputDirty<Inputs::P1>(nid);
    bool p2 = isInputDirty<Inputs::P2>(nid);
    if (p1 || p2)
        emitValue<Outputs::ANY>(nid, true);
}
