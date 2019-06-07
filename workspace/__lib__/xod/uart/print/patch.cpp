#pragma XOD error_raise enable

struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void raiseErr(Context ctx) {
    raiseError(ctx); // No bytes written
}

void evaluate(Context ctx) {
    if (!isInputDirty<input_SEND>(ctx))
        return;

    auto uart = getValue<input_UART>(ctx);
    auto data = getValue<input_DATA>(ctx);

    for (auto it = data.iterate(); it; ++it) {
        bool err = !(uart->writeByte((char)*it));
        if (err)
            return raiseErr(ctx);
    }
    if (!uart->writeByte('\r'))
        return raiseErr(ctx);
    if (!uart->writeByte('\n'))
        return raiseErr(ctx);
    uart->flush();
    emitValue<output_DONE>(ctx, 1);
}
