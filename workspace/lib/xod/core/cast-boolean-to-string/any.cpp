struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto x = getValue<input_IN>(ctx);
    auto xstr = x
      ? ::xod::List<char>::fromPlainArray("true", 4)
      : ::xod::List<char>::fromPlainArray("false", 5);
    emitValue<output_OUT>(ctx, xstr);
}
