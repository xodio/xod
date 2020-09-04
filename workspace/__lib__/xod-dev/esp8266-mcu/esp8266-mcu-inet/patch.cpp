#include <ESP8266WiFi.h>

node {
    meta {
        struct Type {
          ESP8266WiFiClass* wifi;
          WiFiClient *sockets[5];
        };
    }

    void evaluate(Context ctx) {
        Type inet = { &WiFi, { nullptr, nullptr, nullptr, nullptr, nullptr } };
        emitValue<output_OUT>(ctx, inet);
    }
}
