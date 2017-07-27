struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    char str[16];
    auto num = getValue<input_IN>(ctx);
    dtostrf(num, 0, 2, str);
    auto xstr = ::xod::List<char>::fromPlainArray(str, strlen(str));
    emitValue<output_OUT>(ctx, xstr);
}
