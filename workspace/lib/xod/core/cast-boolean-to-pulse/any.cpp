struct State {
  bool state = false;
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    State* state = getState(nid);
    auto newValue = getValue<input_IN>(nid);

    if (newValue == true && state->state == false)
        emitValue<output_OUT>(nid, 1);

    state->state = newValue;
}
