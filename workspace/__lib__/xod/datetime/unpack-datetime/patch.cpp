
struct State {
};

// clang-format off
{{ GENERATED_CODE }}
// clang-format on

bool isLeapYear(int y) {
  return (1970 + y > 0) && !((1970 + y) % 4) && (((1970 + y) % 100) || !((1970 + y) % 400));
}

void evaluate(Context ctx) {
    auto time = getValue<input_IN>(ctx);

    static const uint8_t monthDays[] = { 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 };

    emitValue<output_SEC>(ctx, time % 60);
    time /= 60;
    emitValue<output_MIN>(ctx, time % 60);
    time /= 60;
    emitValue<output_HOUR>(ctx, time % 24);
    time /= 24;

    uint8_t zwday = (time + 4) % 7;
    emitValue<output_WDAY>(ctx, zwday ? zwday : 7);

    uint16_t year = 0;
    uint32_t days = 0;

    while ((days += (isLeapYear(year) ? 366 : 365)) <= time) {
        year++;
    }

    emitValue<output_YEAR>(ctx, year + 1970);

    bool leap = isLeapYear(year);

    days -= leap ? 366 : 365;
    time -= days;

    uint8_t month = 0, monthLength = 0;
    days = 0;

    constexpr uint8_t february = 1;
    for (month = 0; month < 12; month++) {
        monthLength = (month == february) ? (leap ? 29 : 28) : monthDays[month];

        if (time >= monthLength) {
            time -= monthLength;
        } else {
            break;
        }
    }
    emitValue<output_MON>(ctx, month + 1);
    emitValue<output_DAY>(ctx, time + 1);
}
