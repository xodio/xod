
using xod::json_parser::ParserState;

enum class Stack : uint8_t {
  OBJECT = 0,
  ARRAY = 1,
  KEY = 2,
  STRING = 3
};

bool isFirstCharInNumber(char c) {
    return (c >= '0' && c <= '9') || c == '-';
}

struct ContextObject;

// we only use buffer to validate numbers, booleans and `null`
#define BUFFER_MAX_LENGTH 16

class JsonParser {
  private:
    ParserState state;
    Stack stack[20];
    int stackPos = 0;

    bool doEmitWhitespace = false;
    char buffer[BUFFER_MAX_LENGTH];
    int bufferPos = 0;

    void increaseBufferPointer();
    void endString(ContextObject* ctx);
    void endArray(ContextObject* ctx);
    void startValue(ContextObject* ctx, char c);
    void startKey();
    void processEscapeCharacters(ContextObject* ctx, char c);
    void startNumber(char c);
    void startString();
    void startObject();
    void startArray();
    void endNull(ContextObject* ctx);
    void endFalse(ContextObject* ctx);
    void endTrue(ContextObject* ctx);
    void endDocument();
    void endNumber();
    void endObject();

  public:
    JsonParser();
    void parse(ContextObject* ctx, char c);
    void reset();
};

struct State {
    JsonParser parser;
    bool hasError = false;
};

{{ GENERATED_CODE }}

JsonParser::JsonParser() {
    reset();
}

void JsonParser::reset() {
    state = ParserState::START_DOCUMENT;
    bufferPos = 0;
}

void raiseErrorUntilReset(Context ctx) {
  auto state = getState(ctx);

  state->hasError = true;

  raiseError(ctx);
}

void JsonParser::parse(Context ctx, char c) {
    // valid whitespace characters in JSON (from RFC4627 for JSON) include:
    // space, horizontal tab, line feed or new line, and carriage return.
    // thanks:
    // http://stackoverflow.com/questions/16042274/definition-of-whitespace-in-json
    if ((c == ' ' || c == '\t' || c == '\n' || c == '\r')
        && !(state == ParserState::IN_STRING || state == ParserState::START_ESCAPE
            || state == ParserState::IN_NUMBER || state == ParserState::START_DOCUMENT)) {
      return;
    }
    switch (state) {
    case ParserState::IN_STRING:
      if (c == '"') {
        endString(ctx);
      } else if (c == '\\') {
        state = ParserState::START_ESCAPE;
      } else if ((c < 0x1f) || (c == 0x7f)) {
          // Unescaped control character encountered
          raiseErrorUntilReset(ctx);
      } else {
        buffer[bufferPos] = c;
        increaseBufferPointer();
      }
      break;
    case ParserState::START_ARRAY:
    case ParserState::IN_ARRAY:
      if (c == ']') {
        endArray(ctx);
      } else {
        startValue(ctx, c);
      }
      break;
    case ParserState::START_OBJECT:
    case ParserState::IN_OBJECT:
      if (c == '}') {
        endObject();
      } else if (c == '"') {
        startKey();
      } else {
          // Start of string expected for object key
          raiseErrorUntilReset(ctx);
      }
      break;
    case ParserState::END_KEY:
      if (c != ':') {
          // Expected ':' after key
          raiseErrorUntilReset(ctx);
      }
      state = ParserState::AFTER_KEY;
      break;
    case ParserState::AFTER_KEY:
      startValue(ctx, c);
      break;
    case ParserState::START_ESCAPE:
      processEscapeCharacters(ctx, c);
      break;
    case ParserState::AFTER_ARRAY:
    case ParserState::AFTER_OBJECT:
    case ParserState::AFTER_VALUE: {
      // not safe for size == 0!!!
      Stack within = stack[stackPos - 1];
      if (within == Stack::OBJECT) {
        if (c == '}') {
          endObject();
        } else if (c == ',') {
          state = ParserState::IN_OBJECT;
        } else {
            // Expected ',' or '}' while parsing object
            raiseErrorUntilReset(ctx);
        }
      } else if (within == Stack::ARRAY) {
        if (c == ']') {
          endArray(ctx);
        } else if (c == ',') {
          state = ParserState::IN_ARRAY;
        } else {
            // Expected ',' or ']' while parsing array
            raiseErrorUntilReset(ctx);
        }
      } else {
          // Finished a literal, but unclear what state to move to
          raiseErrorUntilReset(ctx);
      }
    }break;
    case ParserState::IN_NUMBER:
      if (c >= '0' && c <= '9') {
        buffer[bufferPos] = c;
        increaseBufferPointer();
      } else if (c == '.') {
        if (memchr(buffer, '.', bufferPos)) {
          /// Cannot have multiple decimal points in a number
          raiseErrorUntilReset(ctx);
        } else if (memchr(buffer, 'e', bufferPos)) {
          // Cannot have a decimal point in an exponent
          raiseErrorUntilReset(ctx);
        }
        buffer[bufferPos] = c;
        increaseBufferPointer();
      } else if (c == 'e' || c == 'E') {
        if (memchr(buffer, 'e', bufferPos)) {
          // Cannot have multiple exponents in a number
          raiseErrorUntilReset(ctx);
        }
        buffer[bufferPos] = 'e';
        increaseBufferPointer();
      } else if (c == '+' || c == '-') {
        char last = buffer[bufferPos - 1];
        if (last != 'e') {
          // Can only have '+' or '-' after the 'e' in a number.
          raiseErrorUntilReset(ctx);
        }
        buffer[bufferPos] = c;
        increaseBufferPointer();
      } else {
        endNumber();
        // we have consumed one beyond the end of the number
        parse(ctx, c);
      }
      break;
    case ParserState::IN_TRUE:
      buffer[bufferPos] = c;
      increaseBufferPointer();
      if (bufferPos == 4) {
        endTrue(ctx);
      }
      break;
    case ParserState::IN_FALSE:
      buffer[bufferPos] = c;
      increaseBufferPointer();
      if (bufferPos == 5) {
        endFalse(ctx);
      }
      break;
    case ParserState::IN_NULL:
      buffer[bufferPos] = c;
      increaseBufferPointer();
      if (bufferPos == 4) {
        endNull(ctx);
      }
      break;
    case ParserState::START_DOCUMENT:
      if (c == '[') {
        startArray();
      } else if (c == '{') {
        startObject();
      } else {
        // TODO: questionable requirement
        // Document must start with object or array
        raiseErrorUntilReset(ctx);
      }
      break;
    case ParserState::DONE:
      // Expected end of document
      raiseErrorUntilReset(ctx);
    default:
      // Internal error. Reached an unknown state
      raiseErrorUntilReset(ctx);
    }

    ValueType<output_OUT1>::T parsed = {};
    parsed.state = state;
    parsed.character = c;
    emitValue<output_OUT1>(ctx, parsed);
    emitValue<output_OUT2>(ctx, true);
  }

void JsonParser::increaseBufferPointer() {
    bufferPos = min(bufferPos + 1, BUFFER_MAX_LENGTH - 1);
}

void JsonParser::endString(Context ctx) {
    Stack popped = stack[stackPos - 1];
    stackPos--;
    if (popped == Stack::KEY) {
      buffer[bufferPos] = '\0';
      state = ParserState::END_KEY;
    } else if (popped == Stack::STRING) {
      buffer[bufferPos] = '\0';
      state = ParserState::AFTER_VALUE;
    } else {
      // Unexpected end of string
      raiseErrorUntilReset(ctx);
    }
    bufferPos = 0;
}

void JsonParser::startValue(Context ctx, char c) {
    if (c == '[') {
      startArray();
    } else if (c == '{') {
      startObject();
    } else if (c == '"') {
      startString();
    } else if (isFirstCharInNumber(c)) {
      startNumber(c);
    } else if (c == 't') {
      state = ParserState::IN_TRUE;
      buffer[bufferPos] = c;
      increaseBufferPointer();
    } else if (c == 'f') {
      state = ParserState::IN_FALSE;
      buffer[bufferPos] = c;
      increaseBufferPointer();
    } else if (c == 'n') {
      state = ParserState::IN_NULL;
      buffer[bufferPos] = c;
      increaseBufferPointer();
    } else {
      // Unexpected character for value
      raiseErrorUntilReset(ctx);
    }
}

void JsonParser::endArray(Context ctx) {
    Stack popped = stack[stackPos - 1];
    stackPos--;
    if (popped != Stack::ARRAY) {
      // Unexpected end of array encountered
      raiseErrorUntilReset(ctx);
    }
    state = ParserState::AFTER_ARRAY;
    if (stackPos == 0) {
      endDocument();
    }
}

void JsonParser::startKey() {
    stack[stackPos] = Stack::KEY;
    stackPos++;
    state = ParserState::IN_STRING;
}

void JsonParser::endObject() {
    Stack popped = stack[stackPos];
    stackPos--;
    if (popped != Stack::OBJECT) {
      // throw new ParsingError($this->_line_number, $this->_char_number,
      // "Unexpected end of object encountered.");
    }
    state = ParserState::AFTER_OBJECT;
    if (stackPos == 0) {
      endDocument();
    }
}

void JsonParser::processEscapeCharacters(Context ctx, char c) {
    if (c == '"') {
      buffer[bufferPos] = '"';
      increaseBufferPointer();
    } else if (c == '\\') {
      buffer[bufferPos] = '\\';
      increaseBufferPointer();
    } else if (c == '/') {
      buffer[bufferPos] = '/';
      increaseBufferPointer();
    } else if (c == 'b') {
      buffer[bufferPos] = 0x08;
      increaseBufferPointer();
    } else if (c == 'f') {
      buffer[bufferPos] = '\f';
      increaseBufferPointer();
    } else if (c == 'n') {
      buffer[bufferPos] = '\n';
      increaseBufferPointer();
    } else if (c == 'r') {
      buffer[bufferPos] = '\r';
      increaseBufferPointer();
    } else if (c == 't') {
      buffer[bufferPos] = '\t';
      increaseBufferPointer();
    } else {
      // Expected escaped character after backslash
      raiseErrorUntilReset(ctx);
    }

    state = ParserState::IN_STRING;
}

void JsonParser::endNumber() {
    buffer[bufferPos] = '\0';
    bufferPos = 0;
    state = ParserState::AFTER_VALUE;
}

void JsonParser::endDocument() {
    state = ParserState::DONE;
}

void JsonParser::endTrue(Context ctx) {
    buffer[bufferPos] = '\0';
    if (strcmp(buffer, "true") != 0) {
      // Expected "true"
      raiseErrorUntilReset(ctx);
    }
    bufferPos = 0;
    state = ParserState::AFTER_VALUE;
}

void JsonParser::endFalse(Context ctx) {
    buffer[bufferPos] = '\0';
    if (strcmp(buffer, "false") != 0) {
      // Expected "false"
      raiseErrorUntilReset(ctx);
    }
    bufferPos = 0;
    state = ParserState::AFTER_VALUE;
}

void JsonParser::endNull(Context ctx) {
    buffer[bufferPos] = '\0';
    if (strcmp(buffer, "null") != 0) {
      // Expected "null"
      raiseErrorUntilReset(ctx);
    }
    bufferPos = 0;
    state = ParserState::AFTER_VALUE;
}

void JsonParser::startArray() {
    state = ParserState::START_ARRAY;
    stack[stackPos] = Stack::ARRAY;
    stackPos++;
}

void JsonParser::startObject() {
    state = ParserState::START_OBJECT;
    stack[stackPos] = Stack::OBJECT;
    stackPos++;
}

void JsonParser::startString() {
    stack[stackPos] = Stack::STRING;
    stackPos++;
    state = ParserState::IN_STRING;
}

void JsonParser::startNumber(char c) {
    state = ParserState::IN_NUMBER;
    buffer[bufferPos] = c;
    increaseBufferPointer();
}

void evaluate(Context ctx) {
    auto state = getState(ctx);

    if (isInputDirty<input_RST>(ctx)) {
      state->hasError = false;
      state->parser.reset();
    }

    if (state->hasError) {
      raiseError(ctx);
      return;
    }

    if (!isInputDirty<input_IN2>(ctx)) {
      return;
    }

    auto c = getValue<input_IN1>(ctx);
    state->parser.parse(ctx, c);
}
