#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_INIT

#include <ESP8266UART.h>

node {
    uint8_t mem[sizeof(ESP8266)];
    ESP8266* wifi;

    meta {
      struct Type {
          Uart* uart;
          ESP8266* wifi;
      };
    }

    void evaluate(Context ctx) {
        if (!isInputDirty<input_INIT>(ctx))
            return;

        auto uart = getValue<input_UART>(ctx);

        wifi = new (mem) ESP8266(*uart);
        Type obj = { uart, wifi };
        wifi->begin();

        emitValue<output_DEV>(ctx, obj);
        emitValue<output_DONE>(ctx, 1);
    }
}
