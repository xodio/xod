
static const unsigned char icon[] PROGMEM = {

0b00000000, 0b00000000, //
0b00000001, 0b10000000, //        ##
0b00000011, 0b11000000, //       ####
0b00000111, 0b11100000, //      ######
0b00001111, 0b11110000, //     ########
0b00001111, 0b11110000, //     ########
0b00011111, 0b11111000, //    ##########
0b00011111, 0b11011000, //    ####### ##
0b00111111, 0b10011100, //   #######  ###
0b00111111, 0b10011100, //   #######  ###
0b00111111, 0b00011100, //   ######   ###
0b00011110, 0b00111000, //    ####   ###
0b00011111, 0b11111000, //    ##########
0b00001111, 0b11110000, //     ########
0b00000011, 0b11000000, //       ####
0b00000000, 0b00000000, //

};

struct State {
    uint8_t mem[sizeof(Bitmap)];
    Bitmap* myBitmap;
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    state->myBitmap = new Bitmap(icon, 0, 16, 16);
    emitValue<output_BMP>(ctx, state->myBitmap);
}
