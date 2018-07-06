{{#global}}
#include <SPI.h>
#include <Ethernet2.h>
{{/global}}

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_SND>(ctx))
        return;

    auto client = EthernetClient(getValue<input_SOCK>(ctx));
    auto msg = getValue<input_MSG>(ctx);

    size_t lastWriteSize;

    for (auto it = msg->iterate(); it; ++it) {
        lastWriteSize = client.write((char)*it);
        if (lastWriteSize == 0) {
            emitValue<output_ERR>(ctx, 1);
            return;
        }
    }

    client.flush();

    emitValue<output_DONE>(ctx, 1);
}
