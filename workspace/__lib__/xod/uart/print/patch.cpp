struct State {
};

{{ GENERATED_CODE }}

void emitErr(Context ctx) {
    emitValue<output_ERR>(ctx, 1);
}

void evaluate(Context ctx) {
if (!isInputDirty<input_SEND>(ctx))
        return;

    auto uart = getValue<input_UART>(ctx);
    auto data = getValue<input_DATA>(ctx);

    for (auto it = data.iterate(); it; ++it) {
        bool err = !(uart->writeByte((char)*it));
        if (err) return emitErr(ctx);
    }
   if (!uart->writeByte('\r')) return emitErr(ctx);
   if (!uart->writeByte('\n')) return emitErr(ctx);
    uart->flush();
    emitValue<output_DONE>(ctx, 1);
}
