struct State {};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
  double lhs = getNumber(nid, Inputs::LHS);
  double rhs = getNumber(nid, Inputs::RHS);
  bool result = (lhs > rhs);

  emitLogic(nid, Outputs::GT, result);
}
