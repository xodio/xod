#pragma XOD error_raise enable

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_SEND>(ctx))
        return;

    auto wire = getValue<input_I2C>(ctx);

    switch (wire->endTransmission()) {
        case 0: emitValue<output_DONE>(ctx, 1);
                break;
        case 1: raiseError(ctx); // Data too long
                break;
        case 2: raiseError(ctx); // NACK on transmit of address
                break;
        case 3: raiseError(ctx); // NACK on data transmit
                break;
        default:
        case 4: raiseError(ctx);   // Other error
                break;
    }
}
