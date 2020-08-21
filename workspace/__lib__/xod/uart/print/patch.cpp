#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_SEND
#pragma XOD error_raise enable

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_SEND>(ctx))
            return;

        auto uart = getValue<input_UART>(ctx);
        auto data = getValue<input_DATA>(ctx);

        for (auto it = data.iterate(); it; ++it) {
            bool err = !(uart->writeByte((char)*it));
            if (err)
                return raiseError(ctx);
        }
        if (!uart->writeByte('\r'))
            return raiseError(ctx);
        if (!uart->writeByte('\n'))
            return raiseError(ctx);
        uart->flush();
        emitValue<output_DONE>(ctx, 1);
    }
}
