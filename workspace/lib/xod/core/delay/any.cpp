struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    TimeMs dt = getValue<input_T>(nid) * 1000;

    if (isInputDirty<input_RST>(nid)) {
        clearTimeout(nid);
    } else if (isInputDirty<input_SET>(nid)) {
        setTimeout(nid, dt);
    } else {
        // It was a scheduled evaluation
        emitValue<output_DONE>(nid, true);
    }
}
