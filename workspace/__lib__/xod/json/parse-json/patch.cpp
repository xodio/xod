// we only use buffer to validate numbers, booleans and `null`
#define BUFFER_MAX_LENGTH 16

nodespace {
    using ParserState = xod::json_parser::ParserState;

    enum class StackItem : uint8_t {
      OBJECT = 0,
      ARRAY = 1,
      KEY = 2,
      STRING = 3
    };

    bool isFirstCharInNumber(char c) {
        return (c >= '0' && c <= '9') || c == '-';
    }
}

node {
    ParserState parserState;
    StackItem stack[20];
    int stackPos = 0;

    bool doEmitWhitespace = false;
    char buffer[BUFFER_MAX_LENGTH];
    int bufferPos = 0;

    bool hasError = false;

    void reset() {
        parserState = ParserState::START_DOCUMENT;
        bufferPos = 0;
    }

    void raiseErrorUntilReset(Context ctx) {
      hasError = true;
      raiseError(ctx);
    }

    void parse(Context ctx, char c) {
        // valid whitespace characters in JSON (from RFC4627 for JSON) include:
        // space, horizontal tab, line feed or new line, and carriage return.
        // thanks:
        // http://stackoverflow.com/questions/16042274/definition-of-whitespace-in-json
        if ((c == ' ' || c == '\t' || c == '\n' || c == '\r')
            && !(parserState == ParserState::IN_STRING || parserState == ParserState::START_ESCAPE
                || parserState == ParserState::IN_NUMBER || parserState == ParserState::START_DOCUMENT)) {
          return;
        }
        switch (parserState) {
        case ParserState::IN_STRING:
          if (c == '"') {
            endString(ctx);
          } else if (c == '\\') {
            parserState = ParserState::START_ESCAPE;
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
            endObject(ctx);
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
          parserState = ParserState::AFTER_KEY;
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
          StackItem within = stack[stackPos - 1];
          if (within == StackItem::OBJECT) {
            if (c == '}') {
              endObject(ctx);
            } else if (c == ',') {
              parserState = ParserState::IN_OBJECT;
            } else {
                // Expected ',' or '}' while parsing object
                raiseErrorUntilReset(ctx);
            }
          } else if (within == StackItem::ARRAY) {
            if (c == ']') {
              endArray(ctx);
            } else if (c == ',') {
              parserState = ParserState::IN_ARRAY;
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
            // Document must start with object or array.
            // Questionable, but it conforms to https://tools.ietf.org/html/rfc4627
            // which says "A JSON text is a serialized object or array."
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

        if (hasError) return;

        typeof_OUT1 parsed = {};
        parsed.state = parserState;
        parsed.character = c;
        emitValue<output_OUT1>(ctx, parsed);
        emitValue<output_OUT2>(ctx, true);
    }

    void increaseBufferPointer() {
        bufferPos = min(bufferPos + 1, BUFFER_MAX_LENGTH - 1);
    }

    void endString(Context ctx) {
        StackItem popped = stack[stackPos - 1];
        stackPos--;
        if (popped == StackItem::KEY) {
          buffer[bufferPos] = '\0';
          parserState = ParserState::END_KEY;
        } else if (popped == StackItem::STRING) {
          buffer[bufferPos] = '\0';
          parserState = ParserState::AFTER_VALUE;
        } else {
          // Unexpected end of string
          raiseErrorUntilReset(ctx);
        }
        bufferPos = 0;
    }

    void startValue(Context ctx, char c) {
        if (c == '[') {
          startArray();
        } else if (c == '{') {
          startObject();
        } else if (c == '"') {
          startString();
        } else if (isFirstCharInNumber(c)) {
          startNumber(c);
        } else if (c == 't') {
          parserState = ParserState::IN_TRUE;
          buffer[bufferPos] = c;
          increaseBufferPointer();
        } else if (c == 'f') {
          parserState = ParserState::IN_FALSE;
          buffer[bufferPos] = c;
          increaseBufferPointer();
        } else if (c == 'n') {
          parserState = ParserState::IN_NULL;
          buffer[bufferPos] = c;
          increaseBufferPointer();
        } else {
          // Unexpected character for value
          raiseErrorUntilReset(ctx);
        }
    }

    void endArray(Context ctx) {
        StackItem popped = stack[stackPos - 1];
        stackPos--;
        if (popped != StackItem::ARRAY) {
          // Unexpected end of array encountered
          raiseErrorUntilReset(ctx);
        }
        parserState = ParserState::AFTER_ARRAY;
        if (stackPos == 0) {
          endDocument();
        }
    }

    void startKey() {
        stack[stackPos] = StackItem::KEY;
        stackPos++;
        parserState = ParserState::IN_STRING;
    }

    void endObject(Context ctx) {
        StackItem popped = stack[stackPos - 1];
        stackPos--;
        if (popped != StackItem::OBJECT) {
          // Unexpected end of object encountered
          raiseErrorUntilReset(ctx);
        }
        parserState = ParserState::AFTER_OBJECT;
        if (stackPos == 0) {
          endDocument();
        }
    }

    void processEscapeCharacters(Context ctx, char c) {
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

        parserState = ParserState::IN_STRING;
    }

    void endNumber() {
        buffer[bufferPos] = '\0';
        bufferPos = 0;
        parserState = ParserState::AFTER_VALUE;
    }

    void endDocument() {
        parserState = ParserState::DONE;
    }

    void endTrue(Context ctx) {
        buffer[bufferPos] = '\0';
        if (strcmp(buffer, "true") != 0) {
          // Expected "true"
          raiseErrorUntilReset(ctx);
        }
        bufferPos = 0;
        parserState = ParserState::AFTER_VALUE;
    }

    void endFalse(Context ctx) {
        buffer[bufferPos] = '\0';
        if (strcmp(buffer, "false") != 0) {
          // Expected "false"
          raiseErrorUntilReset(ctx);
        }
        bufferPos = 0;
        parserState = ParserState::AFTER_VALUE;
    }

    void endNull(Context ctx) {
        buffer[bufferPos] = '\0';
        if (strcmp(buffer, "null") != 0) {
          // Expected "null"
          raiseErrorUntilReset(ctx);
        }
        bufferPos = 0;
        parserState = ParserState::AFTER_VALUE;
    }

    void startArray() {
        parserState = ParserState::START_ARRAY;
        stack[stackPos] = StackItem::ARRAY;
        stackPos++;
    }

    void startObject() {
        parserState = ParserState::START_OBJECT;
        stack[stackPos] = StackItem::OBJECT;
        stackPos++;
    }

    void startString() {
        stack[stackPos] = StackItem::STRING;
        stackPos++;
        parserState = ParserState::IN_STRING;
    }

    void startNumber(char c) {
        parserState = ParserState::IN_NUMBER;
        buffer[bufferPos] = c;
        increaseBufferPointer();
    }

    void evaluate(Context ctx) {
        if (isSettingUp()) {
          reset();
        }

        if (isInputDirty<input_RST>(ctx)) {
          hasError = false;
          reset();
        }

        if (hasError) {
          return;
        }

        if (!isInputDirty<input_IN2>(ctx)) {
          return;
        }

        auto c = getValue<input_IN1>(ctx);
        parse(ctx, c);
    }
}
