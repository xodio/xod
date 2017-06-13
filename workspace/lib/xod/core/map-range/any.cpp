struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
    auto x = getValue<Inputs::X>(nid);
    auto sMin = getValue<Inputs::Smin>(nid);
    auto sMax = getValue<Inputs::Smax>(nid);
    auto tMin = getValue<Inputs::Tmin>(nid);
    auto tMax = getValue<Inputs::Tmax>(nid);
    auto k = (x - sMin) / (sMax - sMin);
    auto xm = tMin + k * (tMax - tMin);
    emitValue<Outputs::Xm>(nid, xm);
}
