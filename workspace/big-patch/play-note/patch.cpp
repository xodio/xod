
struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx)) return;
    
    auto pin = getValue<input_PIN>(ctx);
    auto frequency = getValue<input_FREQ>(ctx);
    auto duration = getValue<input_DUR>(ctx);
    
    tone(pin, frequency);
    delay(duration*1000);
    noTone(pin);
}
