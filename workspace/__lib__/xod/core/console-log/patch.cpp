struct State { };

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (isSettingUp())
        Serial.begin(115200);

    if (!isInputDirty<input_DUMP>(ctx))
        return;

    auto line = getValue<input_LINE>(ctx);

    for (auto it = line->iterate(); it; ++it)
        Serial.write((char)*it);

    Serial.write('\r');
    Serial.write('\n');

    Serial.flush();
}
