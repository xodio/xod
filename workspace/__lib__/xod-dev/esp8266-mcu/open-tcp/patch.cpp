#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_CONN
#pragma XOD error_raise enable

#include <ESP8266WiFi.h>

node {
    WiFiClient client;

    void evaluate(Context ctx) {
        if (isSettingUp()) {
            // Put the pointer to WiFiClient in the sockets array once on the setup
            auto inet = getValue<input_INET>(ctx);
            // Find a free index
            uint8_t socketIdx = 0;
            uint8_t maxIdx = sizeof(inet.sockets) / sizeof(*inet.sockets);
            while (socketIdx < maxIdx) {
                auto curPointer = inet.sockets[socketIdx];
                if (curPointer == nullptr || curPointer == &client) break;
                socketIdx++;
            }
            if (socketIdx >= maxIdx) {
                // No free sockets available
                raiseError(ctx);
            } else {
                // Store the pointer
                inet.sockets[socketIdx] = &client;
                // And emit the index and updated INET once
                emitValue<output_SOCK>(ctx, socketIdx);
                emitValue<output_INETU0027>(ctx, inet);
            }
            return;
        }

        if (!isInputDirty<input_CONN>(ctx))
            return;

        auto serverName = getValue<input_HOST>(ctx);
        auto len = length(serverName);
        char serverNameBuff[len + 1];
        dump(serverName, serverNameBuff);
        serverNameBuff[len] = '\0';

        auto port = getValue<input_PORT>(ctx);

        if (client.connect(serverNameBuff, port)) {
            emitValue<output_DONE>(ctx, 1);
        } else {
            raiseError(ctx);
        }
    }
}
