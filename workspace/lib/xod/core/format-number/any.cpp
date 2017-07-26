struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    char str[16];
    auto num = getValue<input_NUM>(nid);
    auto dig = getValue<input_DIG>(nid);
    dtostrf(num, 0, dig, str);
    auto xstr = ::xod::List<char>::fromPlainArray(str, strlen(str));
    emitValue<output_STR>(nid, xstr);
}
