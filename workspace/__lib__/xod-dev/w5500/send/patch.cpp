#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_SEND
#pragma XOD error_raise enable

#include <SPI.h>
#include <Ethernet2.h>

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_SEND>(ctx))
            return;

        auto socket = getValue<input_SOCK>(ctx);
        auto client = EthernetClient(socket);
        auto msg = getValue<input_MSG>(ctx);

        size_t lastWriteSize;

        for (auto it = msg->iterate(); it; ++it) {
            lastWriteSize = client.write((char)*it);
            if (lastWriteSize == 0) {
                raiseError(ctx);
                return;
            }
        }

        client.flush();

        emitValue<output_DONE>(ctx, 1);
        emitValue<output_SOCKU0027>(ctx, socket);
        emitValue<output_INETU0027>(ctx, getValue<input_INET>(ctx));
    }
}
