#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_CLS

#include <SPI.h>
#include <Ethernet2.h>

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_CLS>(ctx))
            return;

        auto client = EthernetClient(getValue<input_SOCK>(ctx));
        client.stop();
        emitValue<output_DONE>(ctx, 1);
        emitValue<output_INETU0027>(ctx, getValue<input_INET>(ctx));
    }
}
