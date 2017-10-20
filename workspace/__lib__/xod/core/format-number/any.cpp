struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    char str[16];
    auto num = getValue<input_NUM>(ctx);
    auto dig = getValue<input_DIG>(ctx);
    dtostrf(num, 0, dig, str);
    auto xstr = ::xod::List<char>::fromPlainArray(str, strlen(str));
    emitValue<output_STR>(ctx, xstr);
}
