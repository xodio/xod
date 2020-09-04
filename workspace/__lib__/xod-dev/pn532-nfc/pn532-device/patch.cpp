#pragma XOD require "https://github.com/adafruit/Adafruit_BusIO"
#pragma XOD require "https://github.com/adafruit/Adafruit-PN532"

#include <Adafruit_PN532.h>

node {
    meta {
        using Type = Adafruit_PN532*;
    }

    static_assert(isValidDigitalPort(constant_input_IRQ), "must be a valid digital port");

    Adafruit_PN532 nfc = Adafruit_PN532(constant_input_IRQ, NOT_A_PORT);

    void evaluate(Context ctx) {
        if (!isSettingUp()) return;

        // Initialize the device
        nfc.begin();
        // Ensure the device is working
        uint32_t versiondata = nfc.getFirmwareVersion();
        if (!versiondata) {
          raiseError(ctx);
          return;
        }
        // Configure the device
        nfc.setPassiveActivationRetries(0x01);
        nfc.SAMConfig();

        emitValue<output_DEV>(ctx, &nfc);
    }
}
