struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
    emitLogic(nid, Outputs::__OUT__, getNumber(nid, Inputs::__IN__));
}
