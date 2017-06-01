struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
    char str[16];
    auto num = getValue<Inputs::IN>(nid);
    dtostrf(num, 0, 2, str);
    auto xstr = ::xod::List<char>::fromPlainArray(str, strlen(str));
    emitValue<Outputs::OUT>(nid, xstr);
}
