constexpr unsigned long SECS_PER_MIN = 60;
constexpr unsigned long SECS_PER_HOUR = 3600;
constexpr unsigned long SECS_PER_DAY = 24 * SECS_PER_HOUR;


struct State {
};

using Type = uint32_t;

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

bool isLeapYear(int y) {
  return (1970 + y > 0) && !((1970 + y) % 4) && (((1970 + y) % 100) || !((1970 + y) % 400));
}

void evaluate(Context ctx) {

    static const uint8_t monthDays[] = { 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 };

    uint16_t fullYear = getValue<input_YEAR>(ctx);
    uint8_t mon = getValue<input_MON>(ctx);
    uint8_t day = getValue<input_DAY>(ctx);
    uint8_t hour = getValue<input_HOUR>(ctx);
    uint8_t min = getValue<input_MIN>(ctx);
    uint8_t sec = getValue<input_SEC>(ctx);

    uint8_t year = fullYear - 1970;

    uint8_t i;
    Type seconds = year * (SECS_PER_DAY * 365);

    for (i = 0; i < year; i++) {
        if (isLeapYear(i)) {
            seconds += SECS_PER_DAY;
        }
    }

    bool leap = isLeapYear(year);
    constexpr uint8_t february = 2;
    for (i = 1; i < mon; ++i) {
        seconds += SECS_PER_DAY * ((i == february && leap) ? 29 : monthDays[i - 1]);
    }

    seconds += (day - 1) * SECS_PER_DAY;
    seconds += hour * SECS_PER_HOUR;
    seconds += min * SECS_PER_MIN;
    seconds += sec;
    emitValue<output_OUT>(ctx, seconds);
}
