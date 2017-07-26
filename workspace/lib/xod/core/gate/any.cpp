struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    if (!isInputDirty<Inputs::TRIG>(nid))
        return;

    if (getValue<Inputs::GATE>(nid)) {
        emitValue<Outputs::T>(nid, 1);
    } else {
        emitValue<Outputs::F>(nid, 1);
    }
}
