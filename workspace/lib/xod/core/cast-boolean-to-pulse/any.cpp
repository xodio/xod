struct State {
  bool state = false;
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
    auto newValue = getValue<Inputs::IN>(nid);

    if (newValue == true && state->state == false)
        emitValue<Outputs::OUT>(nid, 1);

    state->state = newValue;
}
