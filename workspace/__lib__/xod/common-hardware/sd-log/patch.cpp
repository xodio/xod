
#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_W
#pragma XOD error_raise enable

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
        raiseError(ctx);
        return;
    }

    char filename[16] = { 0 };
    dump(getValue<input_FILE>(ctx), filename);
    File file = SD.open(filename, O_WRITE | O_CREAT | O_APPEND);
    if (!file) {
        // Failed to open the file. Maybe, SD card gone,
        // try to reinit next time
        state->begun = false;
        raiseError(ctx); // Can't open file
        return;
    }

    XString line = getValue<input_LINE>(ctx);
    size_t lastWriteSize;
    for (auto it = line.iterate(); it; ++it) {
        lastWriteSize = file.print(*it);
        if (lastWriteSize == 0) {
            state->begun = false;
            raiseError(ctx); // No bytes written
            return;
        }
    }

    file.print('\n');
    file.flush();
    file.close();
    emitValue<output_DONE>(ctx, 1);
}
