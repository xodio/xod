{{#global}}
#include <SPI.h>
#include <Ethernet2.h>
{{/global}}

struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_CONN>(ctx))
        return;

    auto dev = getValue<input_DEV>(ctx);

    Ethernet.init(dev.cs);
    ValueType<output_INET>::T inet;

#if defined(WIZ550io_WITH_MACADDRESS)
    if (Ethernet.begin() == 0) {
#else
    if (Ethernet.begin(dev.mac) == 0) {
#endif
        inet.ip = (uint32_t)0;
        inet.isConnected = false;
        emitValue<output_ERR>(ctx, 1);
    } else {
        inet.ip = (uint32_t)Ethernet.localIP();
        inet.isConnected = true;
        emitValue<output_DONE>(ctx, 1);
    }

    emitValue<output_INET>(ctx, inet);
}
