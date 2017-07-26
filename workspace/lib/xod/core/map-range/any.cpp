struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid) {
    auto x = getValue<input_X>(nid);
    auto sMin = getValue<input_Smin>(nid);
    auto sMax = getValue<input_Smax>(nid);
    auto tMin = getValue<input_Tmin>(nid);
    auto tMax = getValue<input_Tmax>(nid);
    auto k = (x - sMin) / (sMax - sMin);
    auto xm = tMin + k * (tMax - tMin);
    emitValue<output_Xm>(nid, xm);
}
