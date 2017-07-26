struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    char str[16];
    auto num = getValue<Inputs::NUM>(nid);
    auto dig = getValue<Inputs::DIG>(nid);
    dtostrf(num, 0, dig, str);
    auto xstr = ::xod::List<char>::fromPlainArray(str, strlen(str));
    emitValue<Outputs::STR>(nid, xstr);
}
