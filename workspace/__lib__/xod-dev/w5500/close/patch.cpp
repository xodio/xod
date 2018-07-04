{{#global}}
#include <SPI.h>
#include <Ethernet2.h>
{{/global}}

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_CLS>(ctx))
        return;

    auto client = EthernetClient(getValue<input_SOCK>(ctx));
    client.stop();
    emitValue<output_DONE>(ctx, 1);
}
