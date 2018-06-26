{{#global}}
#include <Ethernet2.h>
{{/global}}

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_CHK>(ctx))
        return;

    auto client = EthernetClient(getValue<input_SOCK>(ctx));

    if (client.connected()) {
        emitValue<output_Y>(ctx, 1);
    } else {
        emitValue<output_N>(ctx, 1);
    }
}
