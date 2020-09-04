#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_RST input_UPD
#pragma XOD dirtieness disable output_OUT

node {
    Number refValue = 0;

    void evaluate(Context ctx) {
        auto inValue = getValue<input_IN>(ctx);

        if (isInputDirty<input_RST>(ctx)) {
            refValue = inValue;
            emitValue<output_OUT>(ctx, 0);
            return;
        }

        if (!isInputDirty<input_UPD>(ctx)) {
          return;
        }

        auto outValue = inValue - refValue;
        emitValue<output_OUT>(ctx, outValue);
        refValue = inValue;
    }
}
