struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    char str[16];
    auto num = getValue<input_IN>(nid);
    dtostrf(num, 0, 2, str);
    auto xstr = ::xod::List<char>::fromPlainArray(str, strlen(str));
    emitValue<output_OUT>(nid, xstr);
}
