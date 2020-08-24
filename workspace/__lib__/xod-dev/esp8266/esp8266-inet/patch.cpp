#include <ESP8266UART.h>

node {
    meta {
        struct Type {
            uint32_t ip;
            ESP8266* wifi;
        };
    }
    void evaluate(Context ctx) {
        auto dev = getValue<input_DEV>(ctx);
        auto ip = getValue<input_IP>(ctx);
        Type obj;
        obj.ip = ip;
        obj.wifi = dev.wifi;
        emitValue<output_INET>(ctx, obj);
    }
}
