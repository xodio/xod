
#include "catch.hpp"
#include "../platform/listViews.h"
#include "../platform/listFuncs.h"

using namespace xod;

TEST_CASE("Plain list", "[list]") {
    int input[] = { 12, 23, 42 };
    auto view = PlainListView<int>(input, 3);
    auto list = List<int>(&view);

    SECTION("iteration") {
        auto it = list.iterate();

        REQUIRE((bool)it);
        REQUIRE(*it == 12);

        ++it;
        REQUIRE((bool)it);
        REQUIRE(*it == 23);

        ++it;
        REQUIRE((bool)it);
        REQUIRE(*it == 42);

        ++it;
        REQUIRE(!it);
    }

    SECTION("length") {
        auto len = length(list);
        REQUIRE(len == 3);
    }

    SECTION("dump") {
        int output[10];
        size_t n = dump(list, output);
        REQUIRE(n == 3);
        REQUIRE(output[0] == 12);
        REQUIRE(output[1] == 23);
        REQUIRE(output[2] == 42);
    }
}

TEST_CASE("Concat list", "[list]") {
    int input1[] = { 12, 23 };
    int input2[] = { 42, 56 };
    auto view1 = PlainListView<int>(input1, 2);
    auto view2 = PlainListView<int>(input2, 2);
    auto view = ConcatListView<int>(
            List<int>(&view1),
            List<int>(&view2));
    auto list = List<int>(&view);

    SECTION("iteration") {
        auto it = list.iterate();

        REQUIRE((bool)it);
        REQUIRE(*it == 12);

        ++it;
        REQUIRE((bool)it);
        REQUIRE(*it == 23);

        ++it;
        REQUIRE((bool)it);
        REQUIRE(*it == 42);

        ++it;
        REQUIRE((bool)it);
        REQUIRE(*it == 56);

        ++it;
        REQUIRE(!it);
    }

    SECTION("length") {
        auto len = length(list);
        REQUIRE(len == 4);
    }

    SECTION("dump") {
        int output[10];
        size_t n = dump(list, output);
        REQUIRE(n == 4);
        REQUIRE(output[0] == 12);
        REQUIRE(output[1] == 23);
        REQUIRE(output[2] == 42);
        REQUIRE(output[3] == 56);
    }
}

TEST_CASE("XString", "[list]") {
    SECTION("concatenation") {
        auto part1 = CStringView("Di");
        auto part2 = CStringView("gun!");
        auto view = ConcatListView<char>(XString(&part1), XString(&part2));
        auto list = XString(&view);
        char output[10] = { 0 };
        size_t n = dump(list, output);
        REQUIRE(n == 6);
        REQUIRE(std::string(output) == std::string("Digun!"));
    }
}
