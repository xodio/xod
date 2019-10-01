
struct State {};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_IN2>(ctx)) return;

    auto sharedString = getValue<input_IN1>(ctx);

    auto str = getValue<input_IN2>(ctx);

    auto end = dump(str, sharedString->str);

    sharedString->str[end] = '\0';
}
