#pragma XOD evaluate_on_pin disable
#pragma XOD evaluate_on_pin enable input_CONN
#pragma XOD error_raise enable

#include <SPI.h>
#include <Ethernet2.h>

node {
    void evaluate(Context ctx) {
        if (!isInputDirty<input_CONN>(ctx))
            return;

        auto dev = getValue<input_DEV>(ctx);

        Ethernet.init(dev.cs);
        typeof_INET inet;

        #if defined(WIZ550io_WITH_MACADDRESS)
        #define MACADRESS
        #else
        #define MACADRESS dev.mac
        #endif

        if (Ethernet.begin(MACADRESS) == 0) {
            inet.ip = (uint32_t)0;
            inet.isConnected = false;
            raiseError(ctx);
            return;
        } else {
            inet.ip = (uint32_t)Ethernet.localIP();
            inet.isConnected = true;
            emitValue<output_DONE>(ctx, 1);
        }

        emitValue<output_INET>(ctx, inet);
    }
}
