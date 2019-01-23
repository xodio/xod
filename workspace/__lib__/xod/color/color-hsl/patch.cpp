
struct State {};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

float hueToRgb(float v1, float v2, float vH) {
  if (vH < 0) vH += 1.0f;

  if (vH > 1.0f) vH -= 1.0f;

  if ((6.0f * vH) < 1.0f) return (v1 + (v2 - v1) * 6.0f * vH);

  if ((2.0f * vH) < 1.0f) return v2;

  if ((3.0f * vH) < 2.0f) return (v1 + (v2 - v1) * ((2.0f / 3.0f) - vH) * 6.0f);

  return v1;
}

void evaluate(Context ctx) {
  float h = getValue<input_H>(ctx);
  float s = getValue<input_S>(ctx);
  float l = getValue<input_L>(ctx);

  uint8_t r, g, b;

  if (s == 0) {
    r = g = b = ceil(l * 255.0f);
  } else {
    float v2 = (l < 0.5) ? (l * (1.0f + s)) : ((l + s) - (l * s));
    float v1 = 2.0f * l - v2;

    r = round(255.0f * hueToRgb(v1, v2, h + (1.0f / 3.0f)));
    g = round(255.0f * hueToRgb(v1, v2, h));
    b = round(255.0f * hueToRgb(v1, v2, h - (1.0f / 3.0f)));
  }

  ValueType<output_OUT>::T obj = {r, g, b};
  emitValue<output_OUT>(ctx, obj);
}
