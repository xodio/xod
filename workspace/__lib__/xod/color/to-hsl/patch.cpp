
struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

void evaluate(Context ctx)
{

    auto color = getValue<input_IN>(ctx);
    float r = color.r / 255.0f;
    float g = color.g / 255.0f;
    float b = color.b / 255.0f;

    float _min = min(min(r, g), b);
    float _max = max(max(r, g), b);
    float delta = _max - _min;

    float l, s;
    float hue;

    l = (_max + _min) / 2;

    if (delta == 0) {
        hue = 0;
        s = 0;
    }
    else {
        s = (l <= 0.5) ? (delta / (_max + _min)) : (delta / (2 - _max - _min));

        if (r == _max) {
            hue = ((g - b) / 6) / delta;
        }
        else if (g == _max) {
            hue = (1.0f / 3) + ((b - r) / 6) / delta;
        }
        else {
            hue = (2.0f / 3) + ((r - g) / 6) / delta;
        }

        if (hue < 0)
            hue += 1;
        if (hue > 1)
            hue -= 1;
    }
    emitValue<output_H>(ctx, hue);
    emitValue<output_S>(ctx, s);
    emitValue<output_L>(ctx, l);
}

