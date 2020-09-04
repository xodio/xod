#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_CHK

#include <Ethernet2.h>

node {
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
}
