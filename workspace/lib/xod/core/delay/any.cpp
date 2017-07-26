struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    TimeMs dt = getValue<Inputs::T>(nid) * 1000;

    if (isInputDirty<Inputs::RST>(nid)) {
        clearTimeout(nid);
    } else if (isInputDirty<Inputs::SET>(nid)) {
        setTimeout(nid, dt);
    } else {
        // It was a scheduled evaluation
        emitValue<Outputs::DONE>(nid, true);
    }
}
