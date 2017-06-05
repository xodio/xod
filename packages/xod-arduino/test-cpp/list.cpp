
#include <cstring>
#include "catch.hpp"

#define XOD_LIST_CHUNK_SIZE 4
#include "../platform/intrusive_ptr.h"
#include "../platform/list.h"

using namespace xod;

TEST_CASE("List append", "[list]") {
  auto list = List<char>::empty();
  char plain[256] = { 0 };

  SECTION("zero length for empty") {
    REQUIRE(list->length() == 0);
    list->toPlainArrayUnsafe(plain);
    REQUIRE(strlen(plain) == 0);
  }

  SECTION("single element") {
    list = list->append('A');
    REQUIRE(list->length() == 1);

    list->toPlainArrayUnsafe(plain);
    REQUIRE(strcmp(plain, "A") == 0);
  }

  SECTION("few elements under chunk size") {
    list = list->append('A');
    list = list->append('B');
    list = list->append('C');
    REQUIRE(list->length() == 3);

    list->toPlainArrayUnsafe(plain);
    REQUIRE(strcmp(plain, "ABC") == 0);
  }

  SECTION("instances are immutable") {
    auto list1 = list->append('A');
    auto list2 = list1->append('B');
    auto list3 = list2->append('C');
    REQUIRE(list->length() == 0);
    REQUIRE(list1->length() == 1);
    REQUIRE(list2->length() == 2);

    list->toPlainArrayUnsafe(plain);
    REQUIRE(strcmp(plain, "") == 0);

    memset(plain, 0, sizeof plain);
    list1->toPlainArrayUnsafe(plain);
    REQUIRE(strcmp(plain, "A") == 0);

    memset(plain, 0, sizeof plain);
    list2->toPlainArrayUnsafe(plain);
    REQUIRE(strcmp(plain, "AB") == 0);
  }

  SECTION("number of elements equal to chunk size") {
    list = list->append('A');
    list = list->append('B');
    list = list->append('C');
    list = list->append('D');
    REQUIRE(list->length() == 4);

    list->toPlainArrayUnsafe(plain);
    REQUIRE(strcmp(plain, "ABCD") == 0);
  }

  SECTION("number of elements exceeding chunk size") {
    list = list->append('A');
    list = list->append('B');
    list = list->append('C');
    list = list->append('D');
    list = list->append('E');
    REQUIRE(list->length() == 5);

    list->toPlainArrayUnsafe(plain);
    REQUIRE(strcmp(plain, "ABCDE") == 0);
  }
}

TEST_CASE("List concat", "[list]") {
  char plain[256] = { 0 };

  SECTION("empty to empty") {
    auto nil = List<char>::empty()->concat(List<char>::empty());
    REQUIRE(nil->length() == 0);
    REQUIRE(nil->chunkCount() == 0);
  }

  SECTION("something to empty") {
    auto rhs = List<char>::of('X');
    auto list = List<char>::empty()->concat(rhs);
    REQUIRE(list->length() == 1);
    REQUIRE(list->chunkCount() == 1);

    list->toPlainArrayUnsafe(plain);
    REQUIRE(strcmp(plain, "X") == 0);
  }

  SECTION("empty to something") {
    auto lhs = List<char>::of('X');
    auto list = lhs->concat(List<char>::empty());
    REQUIRE(list->length() == 1);
    REQUIRE(list->chunkCount() == 1);

    list->toPlainArrayUnsafe(plain);
    REQUIRE(strcmp(plain, "X") == 0);
  }

  SECTION("something to something") {
    auto lhs = List<char>::of('X');
    auto rhs = List<char>::of('Y');
    auto list = lhs->concat(rhs);
    REQUIRE(list->length() == 2);
    REQUIRE(list->chunkCount() == 1);

    list->toPlainArrayUnsafe(plain);
    REQUIRE(strcmp(plain, "XY") == 0);
  }

  SECTION("something to something with oversize") {
    auto lhs = List<char>::fromPlainArray("ABC", 3);
    auto rhs = List<char>::fromPlainArray("XYZ", 3);
    auto list = lhs->concat(rhs);
    REQUIRE(list->length() == 6);
    REQUIRE(list->chunkCount() == 2);

    list->toPlainArrayUnsafe(plain);
    REQUIRE(strcmp(plain, "ABCXYZ") == 0);
  }
}

TEST_CASE("List plain buffer roundtrip", "[list]") {
  char output[256] = { 0 };

  SECTION("under chunk size") {
    char input[] = "ABC";
    auto list = List<char>::fromPlainArray(input, strlen(input));
    REQUIRE(list->chunkCount() == 1);

    list->toPlainArrayUnsafe(output);
    REQUIRE(strcmp(output, input) == 0);
  }

  SECTION("two chunks") {
    char input[] = "ABCXYZ";
    auto list = List<char>::fromPlainArray(input, strlen(input));
    REQUIRE(list->chunkCount() == 2);

    list->toPlainArrayUnsafe(output);
    REQUIRE(strcmp(output, input) == 0);
  }

  SECTION("many chunks") {
    char input[] = "0123456789ABCDEF";
    auto list = List<char>::fromPlainArray(input, strlen(input));
    REQUIRE(list->chunkCount() == 4);

    list->toPlainArrayUnsafe(output);
    REQUIRE(strcmp(output, input) == 0);
  }
}

TEST_CASE("List iterator", "[list]") {
  SECTION("empty list") {
    auto list = List<char>::empty();
    auto it = list->iterate();
    REQUIRE((bool)it == false);
  }

  SECTION("single item list") {
    auto list = List<char>::of('A');
    auto it = list->iterate();

    REQUIRE(*it == 'A');
    REQUIRE((bool)it == true);

    REQUIRE((bool)++it == false);
  }

  SECTION("multiple items in a single chunk") {
    char input[] = "ABC";
    auto list = List<char>::fromPlainArray(input, strlen(input));
    auto it = list->iterate();

    REQUIRE(*it == 'A');
    REQUIRE((bool)it == true);

    REQUIRE(*++it == 'B');
    REQUIRE((bool)it == true);

    REQUIRE(*++it == 'C');
    REQUIRE((bool)it == true);

    REQUIRE((bool)++it == false);
  }

  SECTION("over two chunks") {
    char input[] = "ABCXYZ";
    size_t len = strlen(input);
    auto list = List<char>::fromPlainArray(input, len);
    auto it = list->iterate();

    for (size_t i = 0; i < len; ++i) {
      REQUIRE(*it == input[i]);
      REQUIRE((bool)it == true);
      ++it;
    }

    REQUIRE((bool)it == false);
  }

  SECTION("over multiple chunks") {
    char input[] = "123456789ABC";
    size_t len = strlen(input);
    auto list = List<char>::fromPlainArray(input, len);
    auto it = list->iterate();

    for (size_t i = 0; i < len; ++i) {
      REQUIRE(*it == input[i]);
      REQUIRE((bool)it == true);
      ++it;
    }

    REQUIRE((bool)it == false);
  }

  SECTION("iteration over the end is idempotent") {
    auto list = List<char>::of('A');
    auto it = list->iterate();
    ++it;
    ++it;
    ++it;
    REQUIRE((bool)it == false);
  }
}
