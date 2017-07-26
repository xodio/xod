struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    auto x = getValue<Inputs::IN>(nid);
    auto xstr = x
      ? ::xod::List<char>::fromPlainArray("true", 4)
      : ::xod::List<char>::fromPlainArray("false", 5);
    emitValue<Outputs::OUT>(nid, xstr);
}
