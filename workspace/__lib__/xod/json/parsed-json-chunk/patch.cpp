namespace xod {
namespace json_parser {

enum class ParserState : int8_t {
    START_DOCUMENT = 0,
    DONE = -1,
    IN_ARRAY = 1,
    IN_OBJECT = 2,
    END_KEY = 3,
    AFTER_KEY = 4,
    IN_STRING = 5,
    START_ESCAPE = 6,
    IN_NUMBER = 8,
    IN_TRUE = 9,
    IN_FALSE = 10,
    IN_NULL = 11,
    AFTER_VALUE = 12,
    START_ARRAY = 14,
    START_OBJECT = 15,
    AFTER_ARRAY = 16,
    AFTER_OBJECT = 17,
};

} // namespace json_parser
} // namespace xod

node {
    meta {
        struct Type {
            xod::json_parser::ParserState state;
            uint8_t character;
        };
    }
    void evaluate(Context ctx) {
        // not intended to be called
    }
}
