struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    auto x = getValue<input_X>(nid);
    auto minX = getValue<input_MIN>(nid);
    auto maxX = getValue<input_MAX>(nid);
    emitValue<output_XC>(nid, x < minX ? minX : (x > maxX ? maxX : x));
}
