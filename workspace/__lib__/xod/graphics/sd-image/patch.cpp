
// clang-format off
{{#global}}
#include <ImageSD.h>
{{/global}}
// clang-format on

struct State {
    uint8_t mem[sizeof(ImageSD)];
    ImageSD* imageSD;
    int16_t x, y, w, h;

    char bitmapFSPath[24]; // A 24 chars maximum filepath.
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx) {
    auto state = getState(ctx);

    auto gfx = getValue<input_GFX>(ctx);
    auto sd = getValue<input_SD>(ctx);

    int16_t x = (int16_t)getValue<input_X>(ctx);
    int16_t y = (int16_t)getValue<input_Y>(ctx);
    int16_t w = (int16_t)getValue<input_W>(ctx);
    int16_t h = (int16_t)getValue<input_H>(ctx);

    auto path = getValue<input_FILE>(ctx);

    if (isSettingUp()) {
        state->imageSD = new (state->mem) ImageSD(gfx, sd);
    }

    if (isInputDirty<input_GFX>(ctx)) {
        emitValue<output_GFXU0027>(ctx, state->imageSD); // If upstream is ok pass it.
    }

    if (isSettingUp() || x != state->x || y != state->y || w != state->w || h != state->h || isInputDirty<input_FILE>(ctx)) {
        state->x = x;
        state->y = y;
        state->w = w;
        state->h = h;
        state->imageSD->setImagePosition(x, y, w, h);

        memset(state->bitmapFSPath, '\0', 24);
        dump(path, state->bitmapFSPath);

        if (state->imageSD->linkBitmapFSPath(state->bitmapFSPath)) {
            raiseError<output_GFXU0027>(ctx); // Failed to load BMP file or a file has wrong format/version.
            return;
        }

        emitValue<output_GFXU0027>(ctx, state->imageSD); // Pass only is everthing is ok.
    }

}
