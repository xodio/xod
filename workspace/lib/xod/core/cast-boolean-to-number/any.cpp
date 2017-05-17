struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
    emitNumber(nid, Outputs::__OUT__, getLogic(nid, Inputs::__IN__));
}
