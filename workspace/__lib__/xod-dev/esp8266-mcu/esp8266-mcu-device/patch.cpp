#include <ESP8266WiFi.h>

node {
    meta {
        using Type = ESP8266WiFiClass*;
    }

    void evaluate(Context ctx) {
        emitValue<output_OUT>(ctx, &WiFi);
    }
}
