
struct State {};

static const uint8_t constant_output_OUT = remove_pointer<typeof_DEV>::type::port;

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    // We don't need to worry about emitting from constant outputs.
    // Outputs will be always dirty on boot, and then the value will never change anyway.
}
