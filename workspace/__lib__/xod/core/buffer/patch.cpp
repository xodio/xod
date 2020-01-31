#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_UPD

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    emitValue<output_MEM>(ctx, getValue<input_NEW>(ctx));
}
