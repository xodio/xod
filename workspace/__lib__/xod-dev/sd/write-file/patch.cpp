
struct State {};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {

    auto sd = getValue<input_DEV>(ctx);
    emitValue<output_DEVU0027>(ctx, sd);

    if (!isInputDirty<input_DO>(ctx))
        return;

    char filename[24] = { 0 };
    dump(getValue<input_FILE>(ctx), filename);

    File file = sd->open(filename, O_WRITE | O_CREAT | O_APPEND);

    if (!file) {
        // Failed to open the file. Maybe, SD card gone, try to reinit next time
        raiseError(ctx); // Can't open file
        return;
    }

    XString line = getValue<input_DATA>(ctx);
    size_t lastWriteSize;
    for (auto it = line.iterate(); it; ++it) {
        lastWriteSize = file.print(*it);
        if (lastWriteSize == 0) {
            raiseError(ctx); // No bytes written
            return;
        }
    }

    file.flush();
    file.close();
    emitValue<output_DONE>(ctx, 1);
}
