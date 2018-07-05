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

    auto ip = IPAddress(getValue<input_IP>(ctx));
    auto dns = IPAddress(getValue<input_DNS>(ctx));
    auto gateway = IPAddress(getValue<input_GTW>(ctx));
    auto subnet = IPAddress(getValue<input_SBN>(ctx));

    // if no DNS was provided
    if((uint32_t)dns == 0) {
        // Assume the DNS server will be the machine on the same network as the local IP
        // but with last octet being '1'
        dns = ip;
        dns[3] = 1;
    }

    if((uint32_t)gateway == 0) {
        gateway = ip;
        gateway[3] = 1;
    }

    if((uint32_t)subnet == 0) {
        subnet = IPAddress(255,255,255,0);
    }

#if defined(WIZ550io_WITH_MACADDRESS)
    Ethernet.begin(ip, dns, gateway, subnet);
#else
    Ethernet.begin(dev.mac, ip, dns, gateway, subnet);
#endif

    inet.ip = (uint32_t)Ethernet.localIP();
    inet.isConnected = true;
    emitValue<output_INET>(ctx, inet);
    emitValue<output_DONE>(ctx, 1);
}
