struct State {
    XString lastValue;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    getState(ctx)->lastValue = getValue<input_VAL>(ctx);
}
