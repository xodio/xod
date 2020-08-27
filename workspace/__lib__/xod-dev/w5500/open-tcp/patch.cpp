#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_CONN
#pragma XOD error_raise enable

#include <SPI.h>
#include <Ethernet2.h>

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_CONN>(ctx))
            return;

        auto client = EthernetClient();
        auto serverName = getValue<input_HOST>(ctx);
        auto port = getValue<input_PORT>(ctx);

        auto len = length(serverName);
        char serverNameBuff[len + 1];
        dump(serverName, serverNameBuff);
        serverNameBuff[len] = '\0';

        if (client.connect(serverNameBuff, port)) {
            emitValue<output_DONE>(ctx, 1);
        } else {
            raiseError(ctx);
        }

        emitValue<output_SOCK>(ctx, client.getSocketNumber());
        emitValue<output_INETU0027>(ctx, getValue<input_INET>(ctx));
    }
}
