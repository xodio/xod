struct State {
};

<% GENERATED_CODE %>

void evaluate(NodeId nid, State* state) {
    emitLogic(nid, Outputs::OUT, getNumber(nid, Inputs::IN));
}
