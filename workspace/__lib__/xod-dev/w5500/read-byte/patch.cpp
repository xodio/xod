#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_READ

#pragma XOD error_raise enable

#include <SPI.h>
#include <Ethernet2.h>

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_READ>(ctx))
            return;

        auto client = EthernetClient(getValue<input_SOCK>(ctx));
        uint8_t b = client.read();

        if (!b) {
            raiseError(ctx);
            return;
        }

        emitValue<output_B>(ctx, b);
        emitValue<output_DONE>(ctx, 1);
    }
}
