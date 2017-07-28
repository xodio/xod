struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto x = getValue<input_X>(ctx);
    auto sMin = getValue<input_Smin>(ctx);
    auto sMax = getValue<input_Smax>(ctx);
    auto tMin = getValue<input_Tmin>(ctx);
    auto tMax = getValue<input_Tmax>(ctx);
    auto k = (x - sMin) / (sMax - sMin);
    auto xm = tMin + k * (tMax - tMin);
    emitValue<output_Xm>(ctx, xm);
}
