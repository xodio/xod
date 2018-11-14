
#include "catch.hpp"
#include "../platform/types.h"
#include "../platform/listViews.h"
#include "../platform/listFuncs.h"
#include "../platform/formatNumber.h"
#include <XStringFormat.inl>

xod::XStringCString convertAndTest(xod::Number val, unsigned int prec, char* sout) {
  xod::formatNumber(val, prec, sout);
  return xod::XStringCString(sout);
}

TEST_CASE("Number to XString conversion", "[list]") {
    char str [16];

    SECTION("Integer numbers") {
      REQUIRE(convertAndTest((xod::Number) 0, 0, str) == xod::XStringCString("0"));
      REQUIRE(convertAndTest((xod::Number) -1, 1, str) == xod::XStringCString("-1"));
      REQUIRE(convertAndTest((xod::Number) 42, 5, str) == xod::XStringCString("42"));
      REQUIRE(convertAndTest((xod::Number) -579, 1, str) == xod::XStringCString("-579"));
      REQUIRE(convertAndTest((xod::Number) 21474836, 0, str) == xod::XStringCString("21474836"));
      REQUIRE(convertAndTest((xod::Number) 21474836, 6, str) == xod::XStringCString("21474836"));
    }
    SECTION("Numbers with floating point") {
      REQUIRE(convertAndTest((xod::Number) 0.25, 0, str) == xod::XStringCString("0"));
      REQUIRE(convertAndTest((xod::Number) 0.51, 0, str) == xod::XStringCString("1"));
      REQUIRE(convertAndTest((xod::Number) 0.451, 1, str) == xod::XStringCString("0.5"));
      REQUIRE(convertAndTest((xod::Number) 0.451, 2, str) == xod::XStringCString("0.45"));
      REQUIRE(convertAndTest((xod::Number) 0.7385, 4, str) == xod::XStringCString("0.7385"));
      REQUIRE(convertAndTest((xod::Number) 0.73855, 4, str) == xod::XStringCString("0.7386"));
      REQUIRE(convertAndTest((xod::Number) 123.456, 0, str) == xod::XStringCString("123"));
      REQUIRE(convertAndTest((xod::Number) 123.456, 2, str) == xod::XStringCString("123.46"));

      REQUIRE(convertAndTest((xod::Number) -0.25, 0, str) == xod::XStringCString("0"));
      REQUIRE(convertAndTest((xod::Number) -0.5, 0, str) == xod::XStringCString("0"));
      REQUIRE(convertAndTest((xod::Number) -0.451, 1, str) == xod::XStringCString("-0.5"));
      REQUIRE(convertAndTest((xod::Number) -0.6, 0, str) == xod::XStringCString("-1"));
      REQUIRE(convertAndTest((xod::Number) -0.7385, 4, str) == xod::XStringCString("-0.7385"));
      REQUIRE(convertAndTest((xod::Number) -0.73855, 4, str) == xod::XStringCString("-0.7386"));
      REQUIRE(convertAndTest((xod::Number) -123.456, 0, str) == xod::XStringCString("-123"));
      REQUIRE(convertAndTest((xod::Number) -123.456, 2, str) == xod::XStringCString("-123.46"));
    }
    SECTION("NaNs") {
      REQUIRE(convertAndTest((xod::Number) NAN, 0, str) == xod::XStringCString("NaN"));
      REQUIRE(convertAndTest((xod::Number) NAN, 2, str) == xod::XStringCString("NaN"));
    }
    SECTION("Infinities") {
      REQUIRE(convertAndTest((xod::Number) INFINITY, 0, str) == xod::XStringCString("Inf"));
      REQUIRE(convertAndTest((xod::Number) INFINITY, 5, str) == xod::XStringCString("Inf"));
      REQUIRE(convertAndTest((xod::Number) -INFINITY, 0, str) == xod::XStringCString("-Inf"));
      REQUIRE(convertAndTest((xod::Number) -INFINITY, 5, str) == xod::XStringCString("-Inf"));
    }
    SECTION("Overflowing numbers") {
      REQUIRE(convertAndTest((xod::Number) 99000000000, 0, str) == xod::XStringCString("OVF"));
      REQUIRE(convertAndTest((xod::Number) 99000000000, 2, str) == xod::XStringCString("OVF"));
      REQUIRE(convertAndTest((xod::Number) -99000000000, 0, str) == xod::XStringCString("-OVF"));
      REQUIRE(convertAndTest((xod::Number) -99000000000, 2, str) == xod::XStringCString("-OVF"));
    }
}
