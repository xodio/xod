
{{#global}}
#include <SPI.h>
#include <SD.h>
{{/global}}

struct State {
    bool begun;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_W>(ctx))
        return;

    auto state = getState(ctx);

    if (!state->begun) {
        // First time use, initialize
        auto csPin = getValue<input_CS>(ctx);
        state->begun = SD.begin(csPin);
    }

    if (!state->begun) {
        // Initialization failed (wrong connection, no SD card)
        emitValue<output_ERR>(ctx, true);
        return;
    }

    char filename[16] = { 0 };
    dump(getValue<input_FILE>(ctx), filename);
    File file = SD.open(filename, O_WRITE | O_CREAT | O_APPEND);
    if (!file) {
        // Failed to open the file. Maybe, SD card gone,
        // try to reinit next time
        state->begun = false;
        emitValue<output_ERR>(ctx, true);
        return;
    }

    XString line = getValue<input_LINE>(ctx);
    for (auto it = line.iterate(); it; ++it)
        file.print(*it);

    file.print('\n');
    file.flush();
    file.close();
    emitValue<output_ERR>(ctx, false);
}
