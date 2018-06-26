{{#global}}
#include <SPI.h>
#include <Ethernet2.h>
{{/global}}

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_READ>(ctx))
        return;

    auto client = EthernetClient(getValue<input_SOCK>(ctx));
    uint8_t b = client.read();

    emitValue<output_B>(ctx, b);
    emitValue<output_DONE>(ctx, 1);
}
