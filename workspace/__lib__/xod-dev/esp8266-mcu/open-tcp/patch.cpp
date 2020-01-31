#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_CONN
#pragma XOD error_raise enable

// clang-format off
{{#global}}
#include <ESP8266WiFi.h>
{{/global}}
// clang-format on

struct State {
    WiFiClient client;
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    if (!isInputDirty<input_CONN>(ctx))
        return;

    auto serverName = getValue<input_SRV>(ctx);
    auto len = length(serverName);
    char serverNameBuff[len + 1];
    dump(serverName, serverNameBuff);
    serverNameBuff[len] = '\0';

    auto port = getValue<input_PORT>(ctx);

    auto state = getState(ctx);
    if (state->client.connect(serverNameBuff, port)) {
        emitValue<output_DONE>(ctx, 1);
    } else {
        raiseError(ctx);
    }

    emitValue<output_SOCK>(ctx, &state->client);
}
