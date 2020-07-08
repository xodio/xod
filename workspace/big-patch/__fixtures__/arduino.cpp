// The sketch is auto-generated with XOD (https://xod.io).
//
// You can compile and upload it to an Arduino-compatible board with
// Arduino IDE.
//
// Rough code overview:
//
// - Configuration section
// - STL shim
// - Immutable list classes and functions
// - XOD runtime environment
// - Native node implementation
// - Program graph definition
//
// Search for comments fenced with '====' and '----' to navigate through
// the major code blocks.

#include <Arduino.h>
#include <inttypes.h>


/*=============================================================================
 *
 *
 * Configuration
 *
 *
 =============================================================================*/

// Uncomment to turn on debug of the program
//#define XOD_DEBUG

// Uncomment to trace the program runtime in the Serial Monitor
//#define XOD_DEBUG_ENABLE_TRACE


// Uncomment to make possible simulation of the program
//#define XOD_SIMULATION

#ifdef XOD_SIMULATION
#include <WasmSerial.h>
#define XOD_DEBUG_SERIAL WasmSerial
#else
#define XOD_DEBUG_SERIAL DEBUG_SERIAL
#endif

/*=============================================================================
 *
 *
 * STL shim. Provides implementation for vital std::* constructs
 *
 *
 =============================================================================*/

namespace xod {
namespace std {

template< class T > struct remove_reference      {typedef T type;};
template< class T > struct remove_reference<T&>  {typedef T type;};
template< class T > struct remove_reference<T&&> {typedef T type;};

template <class T>
typename remove_reference<T>::type&& move(T&& a) {
    return static_cast<typename remove_reference<T>::type&&>(a);
}

} // namespace std
} // namespace xod

/*=============================================================================
 *
 *
 * Basic XOD types
 *
 *
 =============================================================================*/
namespace xod {
#if __SIZEOF_FLOAT__ == 4
typedef float Number;
#else
typedef double Number;
#endif
typedef bool Logic;
typedef unsigned long TimeMs;
typedef uint8_t ErrorFlags;

struct Pulse {
    Pulse() {}
    Pulse(bool) {}
    Pulse(int) {}
};

struct XColor {
    constexpr XColor()
        : r(0)
        , g(0)
        , b(0) {}
    constexpr XColor(uint8_t cr, uint8_t cg, uint8_t cb)
        : r(cr)
        , g(cg)
        , b(cb) {}
    uint8_t r, g, b;
};

} // namespace xod

/*=============================================================================
 *
 *
 * XOD-specific list/array implementations
 *
 *
 =============================================================================*/

#ifndef XOD_LIST_H
#define XOD_LIST_H

namespace xod {
namespace detail {

/*
 * Cursors are used internaly by iterators and list views. They are not exposed
 * directly to a list consumer.
 *
 * The base `Cursor` is an interface which provides the bare minimum of methods
 * to facilitate a single iteration pass.
 */
template<typename T> class Cursor {
  public:
    virtual ~Cursor() { }
    virtual bool isValid() const = 0;
    virtual bool value(T* out) const = 0;
    virtual void next() = 0;
};

template<typename T> class NilCursor : public Cursor<T> {
  public:
    virtual bool isValid() const { return false; }
    virtual bool value(T*) const { return false; }
    virtual void next() { }
};

} // namespace detail

/*
 * Iterator is an object used to iterate a list once.
 *
 * Users create new iterators by calling `someList.iterate()`.
 * Iterators are created on stack and are supposed to have a
 * short live, e.g. for a duration of `for` loop or node’s
 * `evaluate` function. Iterators can’t be copied.
 *
 * Implemented as a pimpl pattern wrapper over the cursor.
 * Once created for a cursor, an iterator owns that cursor
 * and will delete the cursor object once destroyed itself.
 */
template<typename T>
class Iterator {
  public:
    static Iterator<T> nil() {
        return Iterator<T>(new detail::NilCursor<T>());
    }

    Iterator(detail::Cursor<T>* cursor)
        : _cursor(cursor)
    { }

    ~Iterator() {
        if (_cursor)
            delete _cursor;
    }

    Iterator(const Iterator& that) = delete;
    Iterator& operator=(const Iterator& that) = delete;

    Iterator(Iterator&& it)
        : _cursor(it._cursor)
    {
        it._cursor = nullptr;
    }

    Iterator& operator=(Iterator&& it) {
        auto tmp = it._cursor;
        it._cursor = _cursor;
        _cursor = tmp;
        return *this;
    }

    operator bool() const { return _cursor->isValid(); }

    bool value(T* out) const {
        return _cursor->value(out);
    }

    T operator*() const {
        T out;
        _cursor->value(&out);
        return out;
    }

    Iterator& operator++() {
        _cursor->next();
        return *this;
    }

  private:
    detail::Cursor<T>* _cursor;
};

/*
 * An interface for a list view. A particular list view provides a new
 * kind of iteration over existing data. This way we can use list slices,
 * list concatenations, list rotations, etc without introducing new data
 * buffers. We just change the way already existing data is iterated.
 *
 * ListView is not exposed to a list user directly, it is used internally
 * by the List class. However, deriving a new ListView is necessary if you
 * make a new list/string processing node.
 */
template<typename T> class ListView {
  public:
    virtual Iterator<T> iterate() const = 0;
};

/*
 * The list as it seen by data consumers. Have a single method `iterate`
 * to create a new iterator.
 *
 * Implemented as pimpl pattern wrapper over a list view. Takes pointer
 * to a list view in constructor and expects the view will be alive for
 * the whole life time of the list.
 */
template<typename T> class List {
  public:
    constexpr List()
        : _view(nullptr)
    { }

    List(const ListView<T>* view)
        : _view(view)
    { }

    Iterator<T> iterate() const {
        return _view ? _view->iterate() : Iterator<T>::nil();
    }

    // pre 0.15.0 backward compatibility
    List* operator->() __attribute__ ((deprecated)) { return this; }
    const List* operator->() const __attribute__ ((deprecated)) { return this; }

  private:
    const ListView<T>* _view;
};

/*
 * A list view over an old good plain C array.
 *
 * Expects the array will be alive for the whole life time of the
 * view.
 */
template<typename T> class PlainListView : public ListView<T> {
  public:
    class Cursor : public detail::Cursor<T> {
      public:
        Cursor(const PlainListView* owner)
            : _owner(owner)
            , _idx(0)
        { }

        bool isValid() const override {
            return _idx < _owner->_len;
        }

        bool value(T* out) const override {
            if (!isValid())
                return false;
            *out = _owner->_data[_idx];
            return true;
        }

        void next() override { ++_idx; }

      private:
        const PlainListView* _owner;
        size_t _idx;
    };

  public:
    PlainListView(const T* data, size_t len)
        : _data(data)
        , _len(len)
    { }

    virtual Iterator<T> iterate() const override {
        return Iterator<T>(new Cursor(this));
    }

  private:
    friend class Cursor;
    const T* _data;
    size_t _len;
};

/*
 * A list view over a null-terminated C-String.
 *
 * Expects the char buffer will be alive for the whole life time of the view.
 * You can use string literals as a buffer, since they are persistent for
 * the program execution time.
 */
class CStringView : public ListView<char> {
  public:
    class Cursor : public detail::Cursor<char> {
      public:
        Cursor(const char* str)
            : _ptr(str)
        { }

        bool isValid() const override {
            return (bool)*_ptr;
        }

        bool value(char* out) const override {
            *out = *_ptr;
            return (bool)*_ptr;
        }

        void next() override { ++_ptr; }

      private:
        const char* _ptr;
    };

  public:
    CStringView(const char* str = nullptr)
        : _str(str)
    { }

    CStringView& operator=(const CStringView& rhs) {
        _str = rhs._str;
        return *this;
    }

    virtual Iterator<char> iterate() const override {
        return _str ? Iterator<char>(new Cursor(_str)) : Iterator<char>::nil();
    }

  private:
    friend class Cursor;
    const char* _str;
};

/*
 * A list view over two other lists (Left and Right) which first iterates the
 * left one, and when exhausted, iterates the right one.
 *
 * Expects both Left and Right to be alive for the whole view life time.
 */
template<typename T> class ConcatListView : public ListView<T> {
  public:
    class Cursor : public detail::Cursor<T> {
      public:
        Cursor(Iterator<T>&& left, Iterator<T>&& right)
            : _left(std::move(left))
            , _right(std::move(right))
        { }

        bool isValid() const override {
            return _left || _right;
        }

        bool value(T* out) const override {
            return _left.value(out) || _right.value(out);
        }

        void next() override {
            _left ? ++_left : ++_right;
        }

      private:
        Iterator<T> _left;
        Iterator<T> _right;
    };

  public:
    ConcatListView() { }

    ConcatListView(List<T> left, List<T> right)
        : _left(left)
        , _right(right)
    { }

    ConcatListView& operator=(const ConcatListView& rhs) {
        _left = rhs._left;
        _right = rhs._right;
        return *this;
    }

    virtual Iterator<T> iterate() const override {
        return Iterator<T>(new Cursor(_left.iterate(), _right.iterate()));
    }

  private:
    friend class Cursor;
    List<T> _left;
    List<T> _right;
};

//----------------------------------------------------------------------------
// Text string helpers
//----------------------------------------------------------------------------

using XString = List<char>;

/*
 * List and list view in a single pack. An utility used to define constant
 * string literals in XOD.
 */
class XStringCString : public XString {
  public:
    XStringCString(const char* str)
        : XString(&_view)
        , _view(str)
    { }

  private:
    CStringView _view;
};

} // namespace xod

#endif

/*=============================================================================
 *
 *
 * Functions to work with memory
 *
 *
 =============================================================================*/

// Define the placement new operator for cores that do not provide their own.
// Note, this definition takes precedence over the existing one (if any). We found no C++ way
// to use the existing implementation _and_ this implementation if not yet defined.
template<typename T>
void* operator new(size_t, T* ptr) noexcept {
    return ptr;
}

/*=============================================================================
 *
 *
 * UART Classes, that wraps Serials
 *
 *
 =============================================================================*/


#if ARDUINO_API_VERSION >= 10001
class arduino::HardwareSerial;
#else
class HardwareSerial;
#endif
class SoftwareSerial;

namespace xod {

class Uart {
  private:
    long _baud;

  protected:
    bool _started = false;

  public:
    Uart(long baud) {
        _baud = baud;
    }

    virtual void begin() = 0;

    virtual void end() = 0;

    virtual void flush() = 0;

    virtual bool available() = 0;

    virtual bool writeByte(uint8_t) = 0;

    virtual bool readByte(uint8_t*) = 0;

    virtual SoftwareSerial* toSoftwareSerial() {
      return nullptr;
    }

    virtual HardwareSerial* toHardwareSerial() {
      return nullptr;
    }

    void changeBaudRate(long baud) {
      _baud = baud;
      if (_started) {
        end();
        begin();
      }
    }

    long getBaudRate() const {
      return _baud;
    }

    Stream* toStream() {
      Stream* stream = (Stream*) toHardwareSerial();
      if (stream) return stream;
      return (Stream*) toSoftwareSerial();
    }
};

class HardwareUart : public Uart {
  private:
    HardwareSerial* _serial;

  public:
    HardwareUart(HardwareSerial& hserial, uint32_t baud = 115200) : Uart(baud) {
      _serial = &hserial;
    }

    void begin();
    void end();
    void flush();

    bool available() {
      return (bool) _serial->available();
    }

    bool writeByte(uint8_t byte) {
      return (bool) _serial->write(byte);
    }

    bool readByte(uint8_t* out) {
      int data = _serial->read();
      if (data == -1) return false;
      *out = data;
      return true;
    }

    HardwareSerial* toHardwareSerial() {
      return _serial;
    }
};

void HardwareUart::begin() {
  _started = true;
  _serial->begin(getBaudRate());
};
void HardwareUart::end() {
  _started = false;
  _serial->end();
};
void HardwareUart::flush() {
  _serial->flush();
};

} // namespace xod

/*=============================================================================
 *
 *
 * Basic algorithms for XOD lists
 *
 *
 =============================================================================*/

#ifndef XOD_LIST_FUNCS_H
#define XOD_LIST_FUNCS_H



namespace xod {

/*
 * Folds a list from left. Also known as "reduce".
 */
template<typename T, typename TR>
TR foldl(List<T> xs, TR (*func)(TR, T), TR acc) {
    for (auto it = xs.iterate(); it; ++it)
        acc = func(acc, *it);
    return acc;
}

template<typename T> size_t lengthReducer(size_t len, T) {
    return len + 1;
}

/*
 * Computes length of a list.
 */
template<typename T> size_t length(List<T> xs) {
    return foldl(xs, lengthReducer<T>, (size_t)0);
}

template<typename T> T* dumpReducer(T* buff, T x) {
    *buff = x;
    return buff + 1;
}

/*
 * Copies a list content into a memory buffer.
 *
 * It is expected that `outBuff` has enough size to fit all the data.
 */
template<typename T> size_t dump(List<T> xs, T* outBuff) {
    T* buffEnd = foldl(xs, dumpReducer, outBuff);
    return buffEnd - outBuff;
}

/*
 * Compares two lists.
 */
template<typename T> bool equal(List<T> lhs, List<T> rhs) {
    auto lhsIt = lhs.iterate();
    auto rhsIt = rhs.iterate();

    for (; lhsIt && rhsIt; ++lhsIt, ++rhsIt) {
        if (*lhsIt != *rhsIt) return false;
    }

    return !lhsIt && !rhsIt;
}

template<typename T> bool operator == (List<T> lhs, List<T> rhs) {
  return equal(lhs, rhs);
}

} // namespace xod

#endif

/*=============================================================================
 *
 *
 * Format Numbers
 *
 *
 =============================================================================*/

/**
 * Provide `formatNumber` cross-platform number to string converter function.
 *
 * Taken from here:
 * https://github.com/client9/stringencoders/blob/master/src/modp_numtoa.c
 * Original function name: `modp_dtoa2`.
 *
 * Modified:
 * - `isnan` instead of tricky comparing and return "NaN"
 * - handle Infinity values and return "Inf" or "-Inf"
 * - return `OVF` and `-OVF` for numbers bigger than max possible, instead of using `sprintf`
 * - use `Number` instead of double
 * - if negative number rounds to zero, return just "0" instead of "-0"
 *
 * This is a replacement of `dtostrf`.
 */

#ifndef XOD_FORMAT_NUMBER_H
#define XOD_FORMAT_NUMBER_H

namespace xod {

/**
 * Powers of 10
 * 10^0 to 10^9
 */
static const Number powers_of_10[] = { 1, 10, 100, 1000, 10000, 100000, 1000000,
    10000000, 100000000, 1000000000 };

static void strreverse(char* begin, char* end) {
    char aux;
    while (end > begin)
        aux = *end, *end-- = *begin, *begin++ = aux;
};

size_t formatNumber(Number value, int prec, char* str) {
    if (isnan(value)) {
        strcpy(str, "NaN");
        return (size_t)3;
    }

    if (isinf(value)) {
        bool isNegative = value < 0;
        strcpy(str, isNegative ? "-Inf" : "Inf");
        return (size_t)isNegative ? 4 : 3;
    }

    /* if input is larger than thres_max return "OVF" */
    const Number thres_max = (Number)(0x7FFFFFFF);

    Number diff = 0.0;
    char* wstr = str;

    if (prec < 0) {
        prec = 0;
    } else if (prec > 9) {
        /* precision of >= 10 can lead to overflow errors */
        prec = 9;
    }

    /* we'll work in positive values and deal with the
	   negative sign issue later */
    int neg = 0;
    if (value < 0) {
        neg = 1;
        value = -value;
    }

    uint32_t whole = (uint32_t)value;
    Number tmp = (value - whole) * powers_of_10[prec];
    uint32_t frac = (uint32_t)(tmp);
    diff = tmp - frac;

    if (diff > 0.5) {
        ++frac;
        /* handle rollover, e.g.  case 0.99 with prec 1 is 1.0  */
        if (frac >= powers_of_10[prec]) {
            frac = 0;
            ++whole;
        }
    } else if (diff == 0.5 && prec > 0 && (frac & 1)) {
        /* if halfway, round up if odd, OR
		   if last digit is 0.  That last part is strange */
        ++frac;
        if (frac >= powers_of_10[prec]) {
            frac = 0;
            ++whole;
        }
    } else if (diff == 0.5 && prec == 0 && (whole & 1)) {
        ++frac;
        if (frac >= powers_of_10[prec]) {
            frac = 0;
            ++whole;
        }
    }

    if (value > thres_max) {
        if (neg) {
            strcpy(str, "-OVF");
            return (size_t)4;
        }
        strcpy(str, "OVF");
        return (size_t)3;
    }

    int has_decimal = 0;
    int count = prec;
    bool notzero = frac > 0;

    while (count > 0) {
        --count;
        *wstr++ = (char)(48 + (frac % 10));
        frac /= 10;
        has_decimal = 1;
    }

    if (frac > 0) {
        ++whole;
    }

    /* add decimal */
    if (has_decimal) {
        *wstr++ = '.';
    }

    notzero = notzero || whole > 0;

    /* do whole part
	 * Take care of sign conversion
	 * Number is reversed.
	 */
    do
        *wstr++ = (char)(48 + (whole % 10));
    while (whole /= 10);

    if (neg && notzero) {
        *wstr++ = '-';
    }
    *wstr = '\0';
    strreverse(str, wstr - 1);
    return (size_t)(wstr - str);
}

} // namespace xod
#endif


/*=============================================================================
 *
 *
 * Runtime
 *
 *
 =============================================================================*/

//----------------------------------------------------------------------------
// Debug routines
//----------------------------------------------------------------------------
// #ifndef DEBUG_SERIAL
#if defined(XOD_DEBUG) && !defined(DEBUG_SERIAL)
#  define DEBUG_SERIAL Serial
#endif

#if defined(XOD_DEBUG) && defined(XOD_DEBUG_ENABLE_TRACE)
#  define XOD_TRACE(x)      { DEBUG_SERIAL.print(x); DEBUG_SERIAL.flush(); }
#  define XOD_TRACE_LN(x)   { DEBUG_SERIAL.println(x); DEBUG_SERIAL.flush(); }
#  define XOD_TRACE_F(x)    XOD_TRACE(F(x))
#  define XOD_TRACE_FLN(x)  XOD_TRACE_LN(F(x))
#else
#  define XOD_TRACE(x)
#  define XOD_TRACE_LN(x)
#  define XOD_TRACE_F(x)
#  define XOD_TRACE_FLN(x)
#endif

//----------------------------------------------------------------------------
// PGM space utilities
//----------------------------------------------------------------------------
#define pgm_read_nodeid(address) (pgm_read_word(address))

/*
 * Workaround for bugs:
 * https://github.com/arduino/ArduinoCore-sam/pull/43
 * https://github.com/arduino/ArduinoCore-samd/pull/253
 * Remove after the PRs merge
 */
#if !defined(ARDUINO_ARCH_AVR) && defined(pgm_read_ptr)
#  undef pgm_read_ptr
#  define pgm_read_ptr(addr) (*(const void **)(addr))
#endif

namespace xod {
//----------------------------------------------------------------------------
// Global variables
//----------------------------------------------------------------------------

TimeMs g_transactionTime;
bool g_isSettingUp;
bool g_isEarlyDeferPass;

//----------------------------------------------------------------------------
// Metaprogramming utilities
//----------------------------------------------------------------------------

template<typename T> struct always_false {
    enum { value = 0 };
};

//----------------------------------------------------------------------------
// Forward declarations
//----------------------------------------------------------------------------

TimeMs transactionTime();
void runTransaction();

//----------------------------------------------------------------------------
// Engine (private API)
//----------------------------------------------------------------------------

namespace detail {

template<typename NodeT>
bool isTimedOut(const NodeT* node) {
    TimeMs t = node->timeoutAt;
    // TODO: deal with uint32 overflow
    return t && t < transactionTime();
}

template<typename NodeT>
void clearTimeout(NodeT* node) {
    node->timeoutAt = 0;
}

template<typename NodeT>
void clearStaleTimeout(NodeT* node) {
    if (isTimedOut(node))
        clearTimeout(node);
}

void printErrorToDebugSerial(uint16_t nodeId, ErrorFlags errorFlags) {
#if defined(XOD_DEBUG) || defined(XOD_SIMULATION)
    XOD_DEBUG_SERIAL.print(F("+XOD_ERR:"));
    XOD_DEBUG_SERIAL.print(g_transactionTime);
    XOD_DEBUG_SERIAL.print(':');
    XOD_DEBUG_SERIAL.print(nodeId);
    XOD_DEBUG_SERIAL.print(':');
    XOD_DEBUG_SERIAL.print(errorFlags, DEC);
    XOD_DEBUG_SERIAL.print('\r');
    XOD_DEBUG_SERIAL.print('\n');
#endif
}

} // namespace detail

//----------------------------------------------------------------------------
// Public API (can be used by native nodes’ `evaluate` functions)
//----------------------------------------------------------------------------

TimeMs transactionTime() {
    return g_transactionTime;
}

bool isSettingUp() {
    return g_isSettingUp;
}

bool isEarlyDeferPass() {
    return g_isEarlyDeferPass;
}

template<typename ContextT>
void setTimeout(ContextT* ctx, TimeMs timeout) {
    ctx->_node->timeoutAt = transactionTime() + timeout;
}

template<typename ContextT>
void clearTimeout(ContextT* ctx) {
    detail::clearTimeout(ctx->_node);
}

template<typename ContextT>
bool isTimedOut(const ContextT* ctx) {
    return detail::isTimedOut(ctx->_node);
}

bool isValidDigitalPort(uint8_t port) {
#if defined(__AVR__) && defined(NUM_DIGITAL_PINS)
    return port < NUM_DIGITAL_PINS;
#else
    return true;
#endif
}

bool isValidAnalogPort(uint8_t port) {
#if defined(__AVR__) && defined(NUM_ANALOG_INPUTS)
    return port >= A0 && port < A0 + NUM_ANALOG_INPUTS;
#else
    return true;
#endif
}

} // namespace xod

//----------------------------------------------------------------------------
// Entry point
//----------------------------------------------------------------------------
void setup() {
    // FIXME: looks like there is a rounding bug. Waiting for 100ms fights it
    delay(100);

#if defined(XOD_DEBUG) || defined(XOD_SIMULATION)
    XOD_DEBUG_SERIAL.begin(115200);
    XOD_DEBUG_SERIAL.setTimeout(10);
#endif
    XOD_TRACE_FLN("\n\nProgram started");

    xod::g_isSettingUp = true;
    xod::runTransaction();
    xod::g_isSettingUp = false;
}

void loop() {
    xod::runTransaction();
}

/*=============================================================================
 *
 *
 * Native node implementations
 *
 *
 =============================================================================*/

namespace xod {

//-----------------------------------------------------------------------------
// xod-dev/text-lcd/text-lcd-i2c-device implementation
//-----------------------------------------------------------------------------
namespace xod_dev__text_lcd__text_lcd_i2c_device {

//#pragma XOD error_raise enable

// --- Enter global namespace ---
}}
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

namespace xod {
namespace xod_dev__text_lcd__text_lcd_i2c_device {
// --- Back to local namespace ---
struct State {
    uint8_t mem[sizeof(LiquidCrystal_I2C)];
};

struct Type {
    LiquidCrystal_I2C* lcd;
    uint8_t rows;
    uint8_t cols;
};

union NodeErrors {
    struct {
        bool output_DEV : 1;
    };

    ErrorFlags flags;
};

struct Node {
    NodeErrors errors;
    xod_dev__text_lcd__text_lcd_i2c_device::Type output_DEV;
    State state;
};

struct input_ADDR { };
struct input_COLS { };
struct input_ROWS { };
struct output_DEV { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_ADDR> { using T = uint8_t; };
template<> struct ValueType<input_COLS> { using T = Number; };
template<> struct ValueType<input_ROWS> { using T = Number; };
template<> struct ValueType<output_DEV> { using T = xod_dev__text_lcd__text_lcd_i2c_device::Type; };

struct ContextObject {
    Node* _node;

    uint8_t _input_ADDR;
    Number _input_COLS;
    Number _input_ROWS;

    bool _isOutputDirty_DEV : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_ADDR input_COLS input_ROWS" \
            " output_DEV");
}

template<> uint8_t getValue<input_ADDR>(Context ctx) {
    return ctx->_input_ADDR;
}
template<> Number getValue<input_COLS>(Context ctx) {
    return ctx->_input_COLS;
}
template<> Number getValue<input_ROWS>(Context ctx) {
    return ctx->_input_ROWS;
}
template<> xod_dev__text_lcd__text_lcd_i2c_device::Type getValue<output_DEV>(Context ctx) {
    return ctx->_node->output_DEV;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_DEV");
}

template<> void emitValue<output_DEV>(Context ctx, xod_dev__text_lcd__text_lcd_i2c_device::Type val) {
    ctx->_node->output_DEV = val;
    ctx->_isOutputDirty_DEV = true;
    ctx->_node->errors.output_DEV = false;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

template<typename OutputT> void raiseError(Context ctx) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_DEV");
}

template<> void raiseError<output_DEV>(Context ctx) {
    ctx->_node->errors.output_DEV = true;
    ctx->_isOutputDirty_DEV = true;
}

void raiseError(Context ctx) {
    ctx->_node->errors.output_DEV = true;
    ctx->_isOutputDirty_DEV = true;
}

void evaluate(Context ctx) {
    State* state = getState(ctx);

    uint8_t addr = getValue<input_ADDR>(ctx);
    uint8_t rows = (uint8_t) getValue<input_ROWS>(ctx);
    uint8_t cols = (uint8_t) getValue<input_COLS>(ctx);

    if (addr > 127) {
        raiseError(ctx);
        return;
    }

    Type t;
    t.rows = rows;
    t.cols = cols;
    t.lcd = new (state->mem) LiquidCrystal_I2C(addr, cols, rows);
    t.lcd->begin();

    emitValue<output_DEV>(ctx, t);
}

} // namespace xod_dev__text_lcd__text_lcd_i2c_device

//-----------------------------------------------------------------------------
// xod-dev/servo/servo-device implementation
//-----------------------------------------------------------------------------
namespace xod_dev__servo__servo_device {

//#pragma XOD error_raise enable

// --- Enter global namespace ---
}}
#include <Servo.h>

namespace xod {
namespace xod_dev__servo__servo_device {
// --- Back to local namespace ---
/*
  A wrapper around the stock Servo object because we need to keep some details
  which the original object hides in private fields. This over-protection leads
  to increased RAM usage to duplicate the data. A pull request to the original
  library asking to add field read methods would be nice.
*/
class XServo : public Servo {
  protected:
    // Here are the duplicates
    uint8_t port;
    int pulseMin;
    int pulseMax;

  public:
    // Set pulse duration according the given `value` and set pulseMin, pulseMax
    // The value is clipped to the [0; 1] range
    void write01(Number value) {
        ensureAttached();
        int pseudoAngle = constrain((int)(value * 180), 0, 180);
        this->write(pseudoAngle);
    }

    // Performs Servo::attach with the parameters set previously
    void ensureAttached() {
        if (this->attached())
            return;

        this->attach(port, pulseMin, pulseMax);
    }

    Number read01() {
        int us = this->readMicroseconds();
        return (Number)(us - pulseMin) / (Number)(pulseMax - pulseMin);
    }

    void reattach(uint8_t port, int pulseMin, int pulseMax) {
        this->port = port;
        this->pulseMin = pulseMin;
        this->pulseMax = pulseMax;
        if (this->attached())
            this->attach(port, pulseMin, pulseMax);
    }
};

using State = XServo;
using Type = XServo*;

union NodeErrors {
    struct {
        bool output_DEV : 1;
    };

    ErrorFlags flags;
};

struct Node {
    NodeErrors errors;
    xod_dev__servo__servo_device::Type output_DEV;
    State state;
};

struct input_PORT { };
struct input_Pmin { };
struct input_Pmax { };
struct output_DEV { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_PORT> { using T = uint8_t; };
template<> struct ValueType<input_Pmin> { using T = Number; };
template<> struct ValueType<input_Pmax> { using T = Number; };
template<> struct ValueType<output_DEV> { using T = xod_dev__servo__servo_device::Type; };

struct ContextObject {
    Node* _node;

    uint8_t _input_PORT;
    Number _input_Pmin;
    Number _input_Pmax;

    bool _isOutputDirty_DEV : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_PORT input_Pmin input_Pmax" \
            " output_DEV");
}

template<> uint8_t getValue<input_PORT>(Context ctx) {
    return ctx->_input_PORT;
}
template<> Number getValue<input_Pmin>(Context ctx) {
    return ctx->_input_Pmin;
}
template<> Number getValue<input_Pmax>(Context ctx) {
    return ctx->_input_Pmax;
}
template<> xod_dev__servo__servo_device::Type getValue<output_DEV>(Context ctx) {
    return ctx->_node->output_DEV;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_DEV");
}

template<> void emitValue<output_DEV>(Context ctx, xod_dev__servo__servo_device::Type val) {
    ctx->_node->output_DEV = val;
    ctx->_isOutputDirty_DEV = true;
    ctx->_node->errors.output_DEV = false;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

template<typename OutputT> void raiseError(Context ctx) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_DEV");
}

template<> void raiseError<output_DEV>(Context ctx) {
    ctx->_node->errors.output_DEV = true;
    ctx->_isOutputDirty_DEV = true;
}

void raiseError(Context ctx) {
    ctx->_node->errors.output_DEV = true;
    ctx->_isOutputDirty_DEV = true;
}

void evaluate(Context ctx) {
    State* servo = getState(ctx);

    auto port = getValue<input_PORT>(ctx);
    if (!isValidDigitalPort(port)) {
        raiseError(ctx);
        return;
    }

    servo->reattach(
        port,
        getValue<input_Pmin>(ctx),
        getValue<input_Pmax>(ctx)
    );

    emitValue<output_DEV>(ctx, servo);
}

} // namespace xod_dev__servo__servo_device

//-----------------------------------------------------------------------------
// xod/core/continuously implementation
//-----------------------------------------------------------------------------
namespace xod__core__continuously {

struct State {
};

struct Node {
    TimeMs timeoutAt;
    State state;
};

struct output_TICK { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<output_TICK> { using T = Pulse; };

struct ContextObject {
    Node* _node;

    bool _isOutputDirty_TICK : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            "" \
            " output_TICK");
}

template<> Pulse getValue<output_TICK>(Context ctx) {
    return Pulse();
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_TICK");
}

template<> void emitValue<output_TICK>(Context ctx, Pulse val) {
    ctx->_isOutputDirty_TICK = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    emitValue<output_TICK>(ctx, 1);
    setTimeout(ctx, 0);
}

} // namespace xod__core__continuously

//-----------------------------------------------------------------------------
// xod/core/boot implementation
//-----------------------------------------------------------------------------
namespace xod__core__boot {

struct State {
};

struct Node {
    State state;
};

struct output_BOOT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<output_BOOT> { using T = Pulse; };

struct ContextObject {
    Node* _node;

    bool _isOutputDirty_BOOT : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            "" \
            " output_BOOT");
}

template<> Pulse getValue<output_BOOT>(Context ctx) {
    return Pulse();
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_BOOT");
}

template<> void emitValue<output_BOOT>(Context ctx, Pulse val) {
    ctx->_isOutputDirty_BOOT = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    emitValue<output_BOOT>(ctx, 1);
}

} // namespace xod__core__boot

//-----------------------------------------------------------------------------
// xod/core/multiply implementation
//-----------------------------------------------------------------------------
namespace xod__core__multiply {

//#pragma XOD dirtieness disable

struct State {
};

struct Node {
    Number output_OUT;
    State state;
};

struct input_IN1 { };
struct input_IN2 { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN1> { using T = Number; };
template<> struct ValueType<input_IN2> { using T = Number; };
template<> struct ValueType<output_OUT> { using T = Number; };

struct ContextObject {
    Node* _node;

    Number _input_IN1;
    Number _input_IN2;

};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN1 input_IN2" \
            " output_OUT");
}

template<> Number getValue<input_IN1>(Context ctx) {
    return ctx->_input_IN1;
}
template<> Number getValue<input_IN2>(Context ctx) {
    return ctx->_input_IN2;
}
template<> Number getValue<output_OUT>(Context ctx) {
    return ctx->_node->output_OUT;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Number val) {
    ctx->_node->output_OUT = val;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    auto x = getValue<input_IN1>(ctx);
    auto y = getValue<input_IN2>(ctx);
    emitValue<output_OUT>(ctx, x * y);
}

} // namespace xod__core__multiply

//-----------------------------------------------------------------------------
// xod/core/pulse-on-change(boolean) implementation
//-----------------------------------------------------------------------------
namespace xod__core__pulse_on_change__boolean {

struct State {
    bool sample = false;
};

struct Node {
    State state;
};

struct input_IN { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN> { using T = Logic; };
template<> struct ValueType<output_OUT> { using T = Pulse; };

struct ContextObject {
    Node* _node;

    Logic _input_IN;

    bool _isOutputDirty_OUT : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN" \
            " output_OUT");
}

template<> Logic getValue<input_IN>(Context ctx) {
    return ctx->_input_IN;
}
template<> Pulse getValue<output_OUT>(Context ctx) {
    return Pulse();
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Pulse val) {
    ctx->_isOutputDirty_OUT = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    State* state = getState(ctx);
    int8_t newValue = (int8_t) getValue<input_IN>(ctx);

    if (!isSettingUp() && newValue != state->sample)
        emitValue<output_OUT>(ctx, 1);

    state->sample = newValue;
}

} // namespace xod__core__pulse_on_change__boolean

//-----------------------------------------------------------------------------
// xod/core/divide implementation
//-----------------------------------------------------------------------------
namespace xod__core__divide {

//#pragma XOD dirtieness disable

struct State {
};

struct Node {
    Number output_OUT;
    State state;
};

struct input_IN1 { };
struct input_IN2 { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN1> { using T = Number; };
template<> struct ValueType<input_IN2> { using T = Number; };
template<> struct ValueType<output_OUT> { using T = Number; };

struct ContextObject {
    Node* _node;

    Number _input_IN1;
    Number _input_IN2;

};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN1 input_IN2" \
            " output_OUT");
}

template<> Number getValue<input_IN1>(Context ctx) {
    return ctx->_input_IN1;
}
template<> Number getValue<input_IN2>(Context ctx) {
    return ctx->_input_IN2;
}
template<> Number getValue<output_OUT>(Context ctx) {
    return ctx->_node->output_OUT;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Number val) {
    ctx->_node->output_OUT = val;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    auto x = getValue<input_IN1>(ctx);
    auto y = getValue<input_IN2>(ctx);
    emitValue<output_OUT>(ctx, x / y);
}

} // namespace xod__core__divide

//-----------------------------------------------------------------------------
// xod/core/cast-to-pulse(boolean) implementation
//-----------------------------------------------------------------------------
namespace xod__core__cast_to_pulse__boolean {

struct State {
  bool state = false;
};

struct Node {
    State state;
};

struct input_IN { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN> { using T = Logic; };
template<> struct ValueType<output_OUT> { using T = Pulse; };

struct ContextObject {
    Node* _node;

    Logic _input_IN;

    bool _isOutputDirty_OUT : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN" \
            " output_OUT");
}

template<> Logic getValue<input_IN>(Context ctx) {
    return ctx->_input_IN;
}
template<> Pulse getValue<output_OUT>(Context ctx) {
    return Pulse();
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Pulse val) {
    ctx->_isOutputDirty_OUT = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    State* state = getState(ctx);
    auto newValue = getValue<input_IN>(ctx);

    if (newValue == true && state->state == false)
        emitValue<output_OUT>(ctx, 1);

    state->state = newValue;
}

} // namespace xod__core__cast_to_pulse__boolean

//-----------------------------------------------------------------------------
// xod/gpio/analog-read implementation
//-----------------------------------------------------------------------------
namespace xod__gpio__analog_read {

//#pragma XOD evaluate_on_pin disable
//#pragma XOD evaluate_on_pin enable input_UPD
//#pragma XOD error_raise enable

struct State {
};

union NodeErrors {
    struct {
        bool output_VAL : 1;
        bool output_DONE : 1;
    };

    ErrorFlags flags;
};

struct Node {
    NodeErrors errors;
    Number output_VAL;
    State state;
};

struct input_PORT { };
struct input_UPD { };
struct output_VAL { };
struct output_DONE { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_PORT> { using T = uint8_t; };
template<> struct ValueType<input_UPD> { using T = Pulse; };
template<> struct ValueType<output_VAL> { using T = Number; };
template<> struct ValueType<output_DONE> { using T = Pulse; };

struct ContextObject {
    Node* _node;

    uint8_t _input_PORT;

    bool _isInputDirty_UPD;

    bool _isOutputDirty_VAL : 1;
    bool _isOutputDirty_DONE : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_PORT input_UPD" \
            " output_VAL output_DONE");
}

template<> uint8_t getValue<input_PORT>(Context ctx) {
    return ctx->_input_PORT;
}
template<> Pulse getValue<input_UPD>(Context ctx) {
    return Pulse();
}
template<> Number getValue<output_VAL>(Context ctx) {
    return ctx->_node->output_VAL;
}
template<> Pulse getValue<output_DONE>(Context ctx) {
    return Pulse();
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_UPD");
    return false;
}

template<> bool isInputDirty<input_UPD>(Context ctx) {
    return ctx->_isInputDirty_UPD;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_VAL output_DONE");
}

template<> void emitValue<output_VAL>(Context ctx, Number val) {
    ctx->_node->output_VAL = val;
    ctx->_isOutputDirty_VAL = true;
    ctx->_node->errors.output_VAL = false;
}
template<> void emitValue<output_DONE>(Context ctx, Pulse val) {
    ctx->_isOutputDirty_DONE = true;
    ctx->_node->errors.output_DONE = false;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

template<typename OutputT> void raiseError(Context ctx) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_VAL output_DONE");
}

template<> void raiseError<output_VAL>(Context ctx) {
    ctx->_node->errors.output_VAL = true;
    ctx->_isOutputDirty_VAL = true;
}
template<> void raiseError<output_DONE>(Context ctx) {
    ctx->_node->errors.output_DONE = true;
    ctx->_isOutputDirty_DONE = true;
}

void raiseError(Context ctx) {
    ctx->_node->errors.output_VAL = true;
    ctx->_isOutputDirty_VAL = true;
    ctx->_node->errors.output_DONE = true;
    ctx->_isOutputDirty_DONE = true;
}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    const uint8_t port = getValue<input_PORT>(ctx);

    if (!isValidAnalogPort(port)) {
        raiseError(ctx);
        return;
    }

    ::pinMode(port, INPUT);
    emitValue<output_VAL>(ctx, ::analogRead(port) / 1023.);
    emitValue<output_DONE>(ctx, 1);
}

} // namespace xod__gpio__analog_read

//-----------------------------------------------------------------------------
// xod/gpio/digital-read-pullup implementation
//-----------------------------------------------------------------------------
namespace xod__gpio__digital_read_pullup {

//#pragma XOD evaluate_on_pin disable
//#pragma XOD evaluate_on_pin enable input_UPD
//#pragma XOD error_raise enable

struct State {
};

union NodeErrors {
    struct {
        bool output_SIG : 1;
        bool output_DONE : 1;
    };

    ErrorFlags flags;
};

struct Node {
    NodeErrors errors;
    Logic output_SIG;
    State state;
};

struct input_PORT { };
struct input_UPD { };
struct output_SIG { };
struct output_DONE { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_PORT> { using T = uint8_t; };
template<> struct ValueType<input_UPD> { using T = Pulse; };
template<> struct ValueType<output_SIG> { using T = Logic; };
template<> struct ValueType<output_DONE> { using T = Pulse; };

struct ContextObject {
    Node* _node;

    uint8_t _input_PORT;

    bool _isInputDirty_UPD;

    bool _isOutputDirty_SIG : 1;
    bool _isOutputDirty_DONE : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_PORT input_UPD" \
            " output_SIG output_DONE");
}

template<> uint8_t getValue<input_PORT>(Context ctx) {
    return ctx->_input_PORT;
}
template<> Pulse getValue<input_UPD>(Context ctx) {
    return Pulse();
}
template<> Logic getValue<output_SIG>(Context ctx) {
    return ctx->_node->output_SIG;
}
template<> Pulse getValue<output_DONE>(Context ctx) {
    return Pulse();
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_UPD");
    return false;
}

template<> bool isInputDirty<input_UPD>(Context ctx) {
    return ctx->_isInputDirty_UPD;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_SIG output_DONE");
}

template<> void emitValue<output_SIG>(Context ctx, Logic val) {
    ctx->_node->output_SIG = val;
    ctx->_isOutputDirty_SIG = true;
    ctx->_node->errors.output_SIG = false;
}
template<> void emitValue<output_DONE>(Context ctx, Pulse val) {
    ctx->_isOutputDirty_DONE = true;
    ctx->_node->errors.output_DONE = false;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

template<typename OutputT> void raiseError(Context ctx) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_SIG output_DONE");
}

template<> void raiseError<output_SIG>(Context ctx) {
    ctx->_node->errors.output_SIG = true;
    ctx->_isOutputDirty_SIG = true;
}
template<> void raiseError<output_DONE>(Context ctx) {
    ctx->_node->errors.output_DONE = true;
    ctx->_isOutputDirty_DONE = true;
}

void raiseError(Context ctx) {
    ctx->_node->errors.output_SIG = true;
    ctx->_isOutputDirty_SIG = true;
    ctx->_node->errors.output_DONE = true;
    ctx->_isOutputDirty_DONE = true;
}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    const uint8_t port = getValue<input_PORT>(ctx);
    if (!isValidDigitalPort(port)) {
        raiseError(ctx);
        return;
    }

    ::pinMode(port, INPUT_PULLUP);
    emitValue<output_SIG>(ctx, ::digitalRead(port));
    emitValue<output_DONE>(ctx, 1);
}

} // namespace xod__gpio__digital_read_pullup

//-----------------------------------------------------------------------------
// xod/core/subtract implementation
//-----------------------------------------------------------------------------
namespace xod__core__subtract {

//#pragma XOD dirtieness disable

struct State {
};

struct Node {
    Number output_OUT;
    State state;
};

struct input_IN1 { };
struct input_IN2 { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN1> { using T = Number; };
template<> struct ValueType<input_IN2> { using T = Number; };
template<> struct ValueType<output_OUT> { using T = Number; };

struct ContextObject {
    Node* _node;

    Number _input_IN1;
    Number _input_IN2;

};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN1 input_IN2" \
            " output_OUT");
}

template<> Number getValue<input_IN1>(Context ctx) {
    return ctx->_input_IN1;
}
template<> Number getValue<input_IN2>(Context ctx) {
    return ctx->_input_IN2;
}
template<> Number getValue<output_OUT>(Context ctx) {
    return ctx->_node->output_OUT;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Number val) {
    ctx->_node->output_OUT = val;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    auto x = getValue<input_IN1>(ctx);
    auto y = getValue<input_IN2>(ctx);
    emitValue<output_OUT>(ctx, x - y);
}

} // namespace xod__core__subtract

//-----------------------------------------------------------------------------
// xod/core/any implementation
//-----------------------------------------------------------------------------
namespace xod__core__any {

struct State {
};

struct Node {
    State state;
};

struct input_IN1 { };
struct input_IN2 { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN1> { using T = Pulse; };
template<> struct ValueType<input_IN2> { using T = Pulse; };
template<> struct ValueType<output_OUT> { using T = Pulse; };

struct ContextObject {
    Node* _node;

    bool _isInputDirty_IN1;
    bool _isInputDirty_IN2;

    bool _isOutputDirty_OUT : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN1 input_IN2" \
            " output_OUT");
}

template<> Pulse getValue<input_IN1>(Context ctx) {
    return Pulse();
}
template<> Pulse getValue<input_IN2>(Context ctx) {
    return Pulse();
}
template<> Pulse getValue<output_OUT>(Context ctx) {
    return Pulse();
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_IN1 input_IN2");
    return false;
}

template<> bool isInputDirty<input_IN1>(Context ctx) {
    return ctx->_isInputDirty_IN1;
}
template<> bool isInputDirty<input_IN2>(Context ctx) {
    return ctx->_isInputDirty_IN2;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Pulse val) {
    ctx->_isOutputDirty_OUT = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    bool p1 = isInputDirty<input_IN1>(ctx);
    bool p2 = isInputDirty<input_IN2>(ctx);
    if (p1 || p2)
        emitValue<output_OUT>(ctx, true);
}

} // namespace xod__core__any

//-----------------------------------------------------------------------------
// xod/math/map implementation
//-----------------------------------------------------------------------------
namespace xod__math__map {

//#pragma XOD dirtieness disable

struct State {
};

struct Node {
    Number output_OUT;
    State state;
};

struct input_X { };
struct input_Smin { };
struct input_Smax { };
struct input_Tmin { };
struct input_Tmax { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_X> { using T = Number; };
template<> struct ValueType<input_Smin> { using T = Number; };
template<> struct ValueType<input_Smax> { using T = Number; };
template<> struct ValueType<input_Tmin> { using T = Number; };
template<> struct ValueType<input_Tmax> { using T = Number; };
template<> struct ValueType<output_OUT> { using T = Number; };

struct ContextObject {
    Node* _node;

    Number _input_X;
    Number _input_Smin;
    Number _input_Smax;
    Number _input_Tmin;
    Number _input_Tmax;

};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_X input_Smin input_Smax input_Tmin input_Tmax" \
            " output_OUT");
}

template<> Number getValue<input_X>(Context ctx) {
    return ctx->_input_X;
}
template<> Number getValue<input_Smin>(Context ctx) {
    return ctx->_input_Smin;
}
template<> Number getValue<input_Smax>(Context ctx) {
    return ctx->_input_Smax;
}
template<> Number getValue<input_Tmin>(Context ctx) {
    return ctx->_input_Tmin;
}
template<> Number getValue<input_Tmax>(Context ctx) {
    return ctx->_input_Tmax;
}
template<> Number getValue<output_OUT>(Context ctx) {
    return ctx->_node->output_OUT;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Number val) {
    ctx->_node->output_OUT = val;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    auto x = getValue<input_X>(ctx);
    auto sMin = getValue<input_Smin>(ctx);
    auto sMax = getValue<input_Smax>(ctx);
    auto tMin = getValue<input_Tmin>(ctx);
    auto tMax = getValue<input_Tmax>(ctx);
    auto k = (x - sMin) / (sMax - sMin);
    auto xm = isnan(x) ? x : tMin + k * (tMax - tMin);
    emitValue<output_OUT>(ctx, xm);
}

} // namespace xod__math__map

//-----------------------------------------------------------------------------
// xod/core/not implementation
//-----------------------------------------------------------------------------
namespace xod__core__not {

//#pragma XOD dirtieness disable

struct State {
};

struct Node {
    Logic output_OUT;
    State state;
};

struct input_IN { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN> { using T = Logic; };
template<> struct ValueType<output_OUT> { using T = Logic; };

struct ContextObject {
    Node* _node;

    Logic _input_IN;

};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN" \
            " output_OUT");
}

template<> Logic getValue<input_IN>(Context ctx) {
    return ctx->_input_IN;
}
template<> Logic getValue<output_OUT>(Context ctx) {
    return ctx->_node->output_OUT;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Logic val) {
    ctx->_node->output_OUT = val;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    auto x = getValue<input_IN>(ctx);
    emitValue<output_OUT>(ctx, !x);
}

} // namespace xod__core__not

//-----------------------------------------------------------------------------
// xod/core/less implementation
//-----------------------------------------------------------------------------
namespace xod__core__less {

//#pragma XOD dirtieness disable

struct State {};

struct Node {
    Logic output_OUT;
    State state;
};

struct input_IN1 { };
struct input_IN2 { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN1> { using T = Number; };
template<> struct ValueType<input_IN2> { using T = Number; };
template<> struct ValueType<output_OUT> { using T = Logic; };

struct ContextObject {
    Node* _node;

    Number _input_IN1;
    Number _input_IN2;

};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN1 input_IN2" \
            " output_OUT");
}

template<> Number getValue<input_IN1>(Context ctx) {
    return ctx->_input_IN1;
}
template<> Number getValue<input_IN2>(Context ctx) {
    return ctx->_input_IN2;
}
template<> Logic getValue<output_OUT>(Context ctx) {
    return ctx->_node->output_OUT;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Logic val) {
    ctx->_node->output_OUT = val;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    auto lhs = getValue<input_IN1>(ctx);
    auto rhs = getValue<input_IN2>(ctx);
    emitValue<output_OUT>(ctx, lhs < rhs);
}

} // namespace xod__core__less

//-----------------------------------------------------------------------------
// xod/core/cast-to-string(number) implementation
//-----------------------------------------------------------------------------
namespace xod__core__cast_to_string__number {

//#pragma XOD dirtieness disable

struct State {
    char str[16];
    CStringView view;
    State() : view(str) { }
};

struct Node {
    XString output_OUT;
    State state;
};

struct input_IN { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN> { using T = Number; };
template<> struct ValueType<output_OUT> { using T = XString; };

struct ContextObject {
    Node* _node;

    Number _input_IN;

};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN" \
            " output_OUT");
}

template<> Number getValue<input_IN>(Context ctx) {
    return ctx->_input_IN;
}
template<> XString getValue<output_OUT>(Context ctx) {
    return ctx->_node->output_OUT;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, XString val) {
    ctx->_node->output_OUT = val;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    auto num = getValue<input_IN>(ctx);
    formatNumber(num, 2, state->str);
    emitValue<output_OUT>(ctx, XString(&state->view));
}

} // namespace xod__core__cast_to_string__number

//-----------------------------------------------------------------------------
// xod/core/debounce(boolean) implementation
//-----------------------------------------------------------------------------
namespace xod__core__debounce__boolean {

struct State {
    bool state = false;
};

struct Node {
    TimeMs timeoutAt;
    Logic output_OUT;
    State state;
};

struct input_ST { };
struct input_Ts { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_ST> { using T = Logic; };
template<> struct ValueType<input_Ts> { using T = Number; };
template<> struct ValueType<output_OUT> { using T = Logic; };

struct ContextObject {
    Node* _node;

    Logic _input_ST;
    Number _input_Ts;

    bool _isOutputDirty_OUT : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_ST input_Ts" \
            " output_OUT");
}

template<> Logic getValue<input_ST>(Context ctx) {
    return ctx->_input_ST;
}
template<> Number getValue<input_Ts>(Context ctx) {
    return ctx->_input_Ts;
}
template<> Logic getValue<output_OUT>(Context ctx) {
    return ctx->_node->output_OUT;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Logic val) {
    ctx->_node->output_OUT = val;
    ctx->_isOutputDirty_OUT = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    State* state = getState(ctx);
    bool x = getValue<input_ST>(ctx);

    if (x != state->state) {
        state->state = x;
        TimeMs dt = getValue<input_Ts>(ctx) * 1000;
        setTimeout(ctx, dt);
    }

    if (isTimedOut(ctx)) {
        emitValue<output_OUT>(ctx, x);
    }
}

} // namespace xod__core__debounce__boolean

//-----------------------------------------------------------------------------
// xod/core/greater implementation
//-----------------------------------------------------------------------------
namespace xod__core__greater {

//#pragma XOD dirtieness disable

struct State {
};

struct Node {
    Logic output_OUT;
    State state;
};

struct input_IN1 { };
struct input_IN2 { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN1> { using T = Number; };
template<> struct ValueType<input_IN2> { using T = Number; };
template<> struct ValueType<output_OUT> { using T = Logic; };

struct ContextObject {
    Node* _node;

    Number _input_IN1;
    Number _input_IN2;

};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN1 input_IN2" \
            " output_OUT");
}

template<> Number getValue<input_IN1>(Context ctx) {
    return ctx->_input_IN1;
}
template<> Number getValue<input_IN2>(Context ctx) {
    return ctx->_input_IN2;
}
template<> Logic getValue<output_OUT>(Context ctx) {
    return ctx->_node->output_OUT;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Logic val) {
    ctx->_node->output_OUT = val;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    auto lhs = getValue<input_IN1>(ctx);
    auto rhs = getValue<input_IN2>(ctx);
    emitValue<output_OUT>(ctx, lhs > rhs);
}

} // namespace xod__core__greater

//-----------------------------------------------------------------------------
// xod/core/gate(pulse) implementation
//-----------------------------------------------------------------------------
namespace xod__core__gate__pulse {

struct State {
};

struct Node {
    State state;
};

struct input_IN { };
struct input_EN { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN> { using T = Pulse; };
template<> struct ValueType<input_EN> { using T = Logic; };
template<> struct ValueType<output_OUT> { using T = Pulse; };

struct ContextObject {
    Node* _node;

    Logic _input_EN;

    bool _isInputDirty_IN;

    bool _isOutputDirty_OUT : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN input_EN" \
            " output_OUT");
}

template<> Pulse getValue<input_IN>(Context ctx) {
    return Pulse();
}
template<> Logic getValue<input_EN>(Context ctx) {
    return ctx->_input_EN;
}
template<> Pulse getValue<output_OUT>(Context ctx) {
    return Pulse();
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_IN");
    return false;
}

template<> bool isInputDirty<input_IN>(Context ctx) {
    return ctx->_isInputDirty_IN;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Pulse val) {
    ctx->_isOutputDirty_OUT = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    if (getValue<input_EN>(ctx) && isInputDirty<input_IN>(ctx))
        emitValue<output_OUT>(ctx, true);
}

} // namespace xod__core__gate__pulse

//-----------------------------------------------------------------------------
// xod/core/if-else(number) implementation
//-----------------------------------------------------------------------------
namespace xod__core__if_else__number {

//#pragma XOD dirtieness disable

struct State {
};

struct Node {
    Number output_R;
    State state;
};

struct input_COND { };
struct input_T { };
struct input_F { };
struct output_R { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_COND> { using T = Logic; };
template<> struct ValueType<input_T> { using T = Number; };
template<> struct ValueType<input_F> { using T = Number; };
template<> struct ValueType<output_R> { using T = Number; };

struct ContextObject {
    Node* _node;

    Logic _input_COND;
    Number _input_T;
    Number _input_F;

};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_COND input_T input_F" \
            " output_R");
}

template<> Logic getValue<input_COND>(Context ctx) {
    return ctx->_input_COND;
}
template<> Number getValue<input_T>(Context ctx) {
    return ctx->_input_T;
}
template<> Number getValue<input_F>(Context ctx) {
    return ctx->_input_F;
}
template<> Number getValue<output_R>(Context ctx) {
    return ctx->_node->output_R;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_R");
}

template<> void emitValue<output_R>(Context ctx, Number val) {
    ctx->_node->output_R = val;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    auto cond = getValue<input_COND>(ctx);
    auto trueVal = getValue<input_T>(ctx);
    auto falseVal = getValue<input_F>(ctx);
    emitValue<output_R>(ctx, cond ? trueVal : falseVal);
}

} // namespace xod__core__if_else__number

//-----------------------------------------------------------------------------
// xod/core/concat implementation
//-----------------------------------------------------------------------------
namespace xod__core__concat {

//#pragma XOD dirtieness disable

struct State {
    ConcatListView<char> view;
};

struct Node {
    XString output_OUT;
    State state;
};

struct input_IN1 { };
struct input_IN2 { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN1> { using T = XString; };
template<> struct ValueType<input_IN2> { using T = XString; };
template<> struct ValueType<output_OUT> { using T = XString; };

struct ContextObject {
    Node* _node;

    XString _input_IN1;
    XString _input_IN2;

};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN1 input_IN2" \
            " output_OUT");
}

template<> XString getValue<input_IN1>(Context ctx) {
    return ctx->_input_IN1;
}
template<> XString getValue<input_IN2>(Context ctx) {
    return ctx->_input_IN2;
}
template<> XString getValue<output_OUT>(Context ctx) {
    return ctx->_node->output_OUT;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, XString val) {
    ctx->_node->output_OUT = val;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    auto head = getValue<input_IN1>(ctx);
    auto tail = getValue<input_IN2>(ctx);
    state->view = ConcatListView<char>(head, tail);
    emitValue<output_OUT>(ctx, XString(&state->view));
}

} // namespace xod__core__concat

//-----------------------------------------------------------------------------
// xod/core/pulse-on-true implementation
//-----------------------------------------------------------------------------
namespace xod__core__pulse_on_true {

struct State {
  bool state = false;
};

struct Node {
    State state;
};

struct input_IN { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN> { using T = Logic; };
template<> struct ValueType<output_OUT> { using T = Pulse; };

struct ContextObject {
    Node* _node;

    Logic _input_IN;

    bool _isOutputDirty_OUT : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN" \
            " output_OUT");
}

template<> Logic getValue<input_IN>(Context ctx) {
    return ctx->_input_IN;
}
template<> Pulse getValue<output_OUT>(Context ctx) {
    return Pulse();
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Pulse val) {
    ctx->_isOutputDirty_OUT = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    State* state = getState(ctx);
    auto newValue = getValue<input_IN>(ctx);

    if (!isSettingUp() && newValue == true && state->state == false)
        emitValue<output_OUT>(ctx, 1);

    state->state = newValue;
}

} // namespace xod__core__pulse_on_true

//-----------------------------------------------------------------------------
// xod/core/and implementation
//-----------------------------------------------------------------------------
namespace xod__core__and {

//#pragma XOD dirtieness disable

struct State {
};

struct Node {
    Logic output_OUT;
    State state;
};

struct input_IN1 { };
struct input_IN2 { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN1> { using T = Logic; };
template<> struct ValueType<input_IN2> { using T = Logic; };
template<> struct ValueType<output_OUT> { using T = Logic; };

struct ContextObject {
    Node* _node;

    Logic _input_IN1;
    Logic _input_IN2;

};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN1 input_IN2" \
            " output_OUT");
}

template<> Logic getValue<input_IN1>(Context ctx) {
    return ctx->_input_IN1;
}
template<> Logic getValue<input_IN2>(Context ctx) {
    return ctx->_input_IN2;
}
template<> Logic getValue<output_OUT>(Context ctx) {
    return ctx->_node->output_OUT;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Logic val) {
    ctx->_node->output_OUT = val;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    auto a = getValue<input_IN1>(ctx);
    auto b = getValue<input_IN2>(ctx);
    emitValue<output_OUT>(ctx, a && b);
}

} // namespace xod__core__and

//-----------------------------------------------------------------------------
// xod/core/if-else(string) implementation
//-----------------------------------------------------------------------------
namespace xod__core__if_else__string {

//#pragma XOD dirtieness disable

struct State {
};

struct Node {
    XString output_R;
    State state;
};

struct input_COND { };
struct input_T { };
struct input_F { };
struct output_R { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_COND> { using T = Logic; };
template<> struct ValueType<input_T> { using T = XString; };
template<> struct ValueType<input_F> { using T = XString; };
template<> struct ValueType<output_R> { using T = XString; };

struct ContextObject {
    Node* _node;

    Logic _input_COND;
    XString _input_T;
    XString _input_F;

};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_COND input_T input_F" \
            " output_R");
}

template<> Logic getValue<input_COND>(Context ctx) {
    return ctx->_input_COND;
}
template<> XString getValue<input_T>(Context ctx) {
    return ctx->_input_T;
}
template<> XString getValue<input_F>(Context ctx) {
    return ctx->_input_F;
}
template<> XString getValue<output_R>(Context ctx) {
    return ctx->_node->output_R;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_R");
}

template<> void emitValue<output_R>(Context ctx, XString val) {
    ctx->_node->output_R = val;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    auto cond = getValue<input_COND>(ctx);
    auto trueVal = getValue<input_T>(ctx);
    auto falseVal = getValue<input_F>(ctx);
    emitValue<output_R>(ctx, cond ? trueVal : falseVal);
}

} // namespace xod__core__if_else__string

//-----------------------------------------------------------------------------
// xod-dev/text-lcd/set-backlight implementation
//-----------------------------------------------------------------------------
namespace xod_dev__text_lcd__set_backlight {

struct State {
};

struct Node {
    xod_dev__text_lcd__text_lcd_i2c_device::Type output_DEVU0027;
    State state;
};

struct input_DEV { };
struct input_BL { };
struct input_DO { };
struct output_DEVU0027 { };
struct output_DONE { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_DEV> { using T = xod_dev__text_lcd__text_lcd_i2c_device::Type; };
template<> struct ValueType<input_BL> { using T = Logic; };
template<> struct ValueType<input_DO> { using T = Pulse; };
template<> struct ValueType<output_DEVU0027> { using T = xod_dev__text_lcd__text_lcd_i2c_device::Type; };
template<> struct ValueType<output_DONE> { using T = Pulse; };

struct ContextObject {
    Node* _node;

    xod_dev__text_lcd__text_lcd_i2c_device::Type _input_DEV;
    Logic _input_BL;

    bool _isInputDirty_DO;

    bool _isOutputDirty_DEVU0027 : 1;
    bool _isOutputDirty_DONE : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_DEV input_BL input_DO" \
            " output_DEVU0027 output_DONE");
}

template<> xod_dev__text_lcd__text_lcd_i2c_device::Type getValue<input_DEV>(Context ctx) {
    return ctx->_input_DEV;
}
template<> Logic getValue<input_BL>(Context ctx) {
    return ctx->_input_BL;
}
template<> Pulse getValue<input_DO>(Context ctx) {
    return Pulse();
}
template<> xod_dev__text_lcd__text_lcd_i2c_device::Type getValue<output_DEVU0027>(Context ctx) {
    return ctx->_node->output_DEVU0027;
}
template<> Pulse getValue<output_DONE>(Context ctx) {
    return Pulse();
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_DO");
    return false;
}

template<> bool isInputDirty<input_DO>(Context ctx) {
    return ctx->_isInputDirty_DO;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_DEVU0027 output_DONE");
}

template<> void emitValue<output_DEVU0027>(Context ctx, xod_dev__text_lcd__text_lcd_i2c_device::Type val) {
    ctx->_node->output_DEVU0027 = val;
    ctx->_isOutputDirty_DEVU0027 = true;
}
template<> void emitValue<output_DONE>(Context ctx, Pulse val) {
    ctx->_isOutputDirty_DONE = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    auto t = getValue<input_DEV>(ctx);
    if (isInputDirty<input_DO>(ctx)) {
        t.lcd->setBacklight(getValue<input_BL>(ctx));
        emitValue<output_DONE>(ctx, 1);
    }

    emitValue<output_DEVU0027>(ctx, t);
}

} // namespace xod_dev__text_lcd__set_backlight

//-----------------------------------------------------------------------------
// xod/math/cube implementation
//-----------------------------------------------------------------------------
namespace xod__math__cube {

//#pragma XOD dirtieness disable

struct State {
};

struct Node {
    Number output_OUT;
    State state;
};

struct input_IN { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN> { using T = Number; };
template<> struct ValueType<output_OUT> { using T = Number; };

struct ContextObject {
    Node* _node;

    Number _input_IN;

};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN" \
            " output_OUT");
}

template<> Number getValue<input_IN>(Context ctx) {
    return ctx->_input_IN;
}
template<> Number getValue<output_OUT>(Context ctx) {
    return ctx->_node->output_OUT;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Number val) {
    ctx->_node->output_OUT = val;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    Number x = getValue<input_IN>(ctx);
    emitValue<output_OUT>(ctx, x * x * x);
}

} // namespace xod__math__cube

//-----------------------------------------------------------------------------
// xod/core/pulse-on-change(number) implementation
//-----------------------------------------------------------------------------
namespace xod__core__pulse_on_change__number {

struct State {
    Number sample = NAN;
};

struct Node {
    State state;
};

struct input_IN { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN> { using T = Number; };
template<> struct ValueType<output_OUT> { using T = Pulse; };

struct ContextObject {
    Node* _node;

    Number _input_IN;

    bool _isOutputDirty_OUT : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN" \
            " output_OUT");
}

template<> Number getValue<input_IN>(Context ctx) {
    return ctx->_input_IN;
}
template<> Pulse getValue<output_OUT>(Context ctx) {
    return Pulse();
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Pulse val) {
    ctx->_isOutputDirty_OUT = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    State* state = getState(ctx);
    auto newValue = getValue<input_IN>(ctx);

    if (!isSettingUp() && newValue != state->sample)
        emitValue<output_OUT>(ctx, 1);

    state->sample = newValue;
}

} // namespace xod__core__pulse_on_change__number

//-----------------------------------------------------------------------------
// xod/core/flip-flop implementation
//-----------------------------------------------------------------------------
namespace xod__core__flip_flop {

struct State {
};

struct Node {
    Logic output_MEM;
    State state;
};

struct input_SET { };
struct input_TGL { };
struct input_RST { };
struct output_MEM { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_SET> { using T = Pulse; };
template<> struct ValueType<input_TGL> { using T = Pulse; };
template<> struct ValueType<input_RST> { using T = Pulse; };
template<> struct ValueType<output_MEM> { using T = Logic; };

struct ContextObject {
    Node* _node;

    bool _isInputDirty_SET;
    bool _isInputDirty_TGL;
    bool _isInputDirty_RST;

    bool _isOutputDirty_MEM : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_SET input_TGL input_RST" \
            " output_MEM");
}

template<> Pulse getValue<input_SET>(Context ctx) {
    return Pulse();
}
template<> Pulse getValue<input_TGL>(Context ctx) {
    return Pulse();
}
template<> Pulse getValue<input_RST>(Context ctx) {
    return Pulse();
}
template<> Logic getValue<output_MEM>(Context ctx) {
    return ctx->_node->output_MEM;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_SET input_TGL input_RST");
    return false;
}

template<> bool isInputDirty<input_SET>(Context ctx) {
    return ctx->_isInputDirty_SET;
}
template<> bool isInputDirty<input_TGL>(Context ctx) {
    return ctx->_isInputDirty_TGL;
}
template<> bool isInputDirty<input_RST>(Context ctx) {
    return ctx->_isInputDirty_RST;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_MEM");
}

template<> void emitValue<output_MEM>(Context ctx, Logic val) {
    ctx->_node->output_MEM = val;
    ctx->_isOutputDirty_MEM = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    bool oldState = getValue<output_MEM>(ctx);
    bool newState = oldState;

    if (isInputDirty<input_RST>(ctx)) {
        newState = false;
    } else if (isInputDirty<input_SET>(ctx)) {
        newState = true;
    } else if (isInputDirty<input_TGL>(ctx)) {
        newState = !oldState;
    }

    if (newState == oldState)
        return;

    emitValue<output_MEM>(ctx, newState);
}

} // namespace xod__core__flip_flop

//-----------------------------------------------------------------------------
// xod/core/or implementation
//-----------------------------------------------------------------------------
namespace xod__core__or {

//#pragma XOD dirtieness disable

struct State {
};

struct Node {
    Logic output_OUT;
    State state;
};

struct input_IN1 { };
struct input_IN2 { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN1> { using T = Logic; };
template<> struct ValueType<input_IN2> { using T = Logic; };
template<> struct ValueType<output_OUT> { using T = Logic; };

struct ContextObject {
    Node* _node;

    Logic _input_IN1;
    Logic _input_IN2;

};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN1 input_IN2" \
            " output_OUT");
}

template<> Logic getValue<input_IN1>(Context ctx) {
    return ctx->_input_IN1;
}
template<> Logic getValue<input_IN2>(Context ctx) {
    return ctx->_input_IN2;
}
template<> Logic getValue<output_OUT>(Context ctx) {
    return ctx->_node->output_OUT;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Logic val) {
    ctx->_node->output_OUT = val;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    auto a = getValue<input_IN1>(ctx);
    auto b = getValue<input_IN2>(ctx);
    emitValue<output_OUT>(ctx, a || b);
}

} // namespace xod__core__or

//-----------------------------------------------------------------------------
// xod/core/clock implementation
//-----------------------------------------------------------------------------
namespace xod__core__clock {

struct State {
  TimeMs nextTrig;
};

struct Node {
    TimeMs timeoutAt;
    State state;
};

struct input_EN { };
struct input_IVAL { };
struct input_RST { };
struct output_TICK { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_EN> { using T = Logic; };
template<> struct ValueType<input_IVAL> { using T = Number; };
template<> struct ValueType<input_RST> { using T = Pulse; };
template<> struct ValueType<output_TICK> { using T = Pulse; };

struct ContextObject {
    Node* _node;

    Logic _input_EN;
    Number _input_IVAL;

    bool _isInputDirty_EN;
    bool _isInputDirty_RST;

    bool _isOutputDirty_TICK : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_EN input_IVAL input_RST" \
            " output_TICK");
}

template<> Logic getValue<input_EN>(Context ctx) {
    return ctx->_input_EN;
}
template<> Number getValue<input_IVAL>(Context ctx) {
    return ctx->_input_IVAL;
}
template<> Pulse getValue<input_RST>(Context ctx) {
    return Pulse();
}
template<> Pulse getValue<output_TICK>(Context ctx) {
    return Pulse();
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_EN input_RST");
    return false;
}

template<> bool isInputDirty<input_EN>(Context ctx) {
    return ctx->_isInputDirty_EN;
}
template<> bool isInputDirty<input_RST>(Context ctx) {
    return ctx->_isInputDirty_RST;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_TICK");
}

template<> void emitValue<output_TICK>(Context ctx, Pulse val) {
    ctx->_isOutputDirty_TICK = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    State* state = getState(ctx);
    TimeMs tNow = transactionTime();
    auto ival = getValue<input_IVAL>(ctx);
    if (ival < 0) ival = 0;
    TimeMs dt = ival * 1000;
    TimeMs tNext = tNow + dt;

    auto isEnabled = getValue<input_EN>(ctx);
    auto isRstDirty = isInputDirty<input_RST>(ctx);

    if (isTimedOut(ctx) && isEnabled && !isRstDirty) {
        emitValue<output_TICK>(ctx, 1);
        state->nextTrig = tNext;
        setTimeout(ctx, dt);
    }

    if (isRstDirty || isInputDirty<input_EN>(ctx)) {
        // Handle enable/disable/reset
        if (!isEnabled) {
            // Disable timeout loop on explicit false on EN
            state->nextTrig = 0;
            clearTimeout(ctx);
        } else if (state->nextTrig < tNow || state->nextTrig > tNext) {
            // Start timeout from scratch
            state->nextTrig = tNext;
            setTimeout(ctx, dt);
        }
    }
}

} // namespace xod__core__clock

//-----------------------------------------------------------------------------
// xod/core/if-error(string) implementation
//-----------------------------------------------------------------------------
namespace xod__core__if_error__string {

//#pragma XOD error_raise enable
//#pragma XOD error_catch enable

struct State {
};

union NodeErrors {
    struct {
        bool output_OUT : 1;
    };

    ErrorFlags flags;
};

struct Node {
    NodeErrors errors;
    XString output_OUT;
    State state;
};

struct input_IN { };
struct input_DEF { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN> { using T = XString; };
template<> struct ValueType<input_DEF> { using T = XString; };
template<> struct ValueType<output_OUT> { using T = XString; };

struct ContextObject {
    Node* _node;
    uint8_t _error_input_IN;
    uint8_t _error_input_DEF;

    XString _input_IN;
    XString _input_DEF;

    bool _isOutputDirty_OUT : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN input_DEF" \
            " output_OUT");
}

template<> XString getValue<input_IN>(Context ctx) {
    return ctx->_input_IN;
}
template<> XString getValue<input_DEF>(Context ctx) {
    return ctx->_input_DEF;
}
template<> XString getValue<output_OUT>(Context ctx) {
    return ctx->_node->output_OUT;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, XString val) {
    ctx->_node->output_OUT = val;
    ctx->_isOutputDirty_OUT = true;
    ctx->_node->errors.output_OUT = false;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

template<typename OutputT> void raiseError(Context ctx) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void raiseError<output_OUT>(Context ctx) {
    ctx->_node->errors.output_OUT = true;
    ctx->_isOutputDirty_OUT = true;
}

void raiseError(Context ctx) {
    ctx->_node->errors.output_OUT = true;
    ctx->_isOutputDirty_OUT = true;
}

template<typename InputT> uint8_t getError(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_IN input_DEF");
    return 0;
}

template<> uint8_t getError<input_IN>(Context ctx) {
    return ctx->_error_input_IN;
}
template<> uint8_t getError<input_DEF>(Context ctx) {
    return ctx->_error_input_DEF;
}

void evaluate(Context ctx) {
    auto defError = getError<input_DEF>(ctx);

    if (defError) {
        // "DEF" input should not contain an error — reraise it
        raiseError<output_OUT>(ctx);
    } else {
        emitValue<output_OUT>(ctx, getError<input_IN>(ctx) ? getValue<input_DEF>(ctx) : getValue<input_IN>(ctx));
    }
}

} // namespace xod__core__if_error__string

//-----------------------------------------------------------------------------
// xod/gpio/pwm-write implementation
//-----------------------------------------------------------------------------
namespace xod__gpio__pwm_write {

//#pragma XOD evaluate_on_pin disable
//#pragma XOD evaluate_on_pin enable input_UPD
//#pragma XOD error_raise enable

struct State {
};

union NodeErrors {
    struct {
        bool output_DONE : 1;
    };

    ErrorFlags flags;
};

struct Node {
    NodeErrors errors;
    State state;
};

struct input_PORT { };
struct input_DUTY { };
struct input_UPD { };
struct output_DONE { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_PORT> { using T = uint8_t; };
template<> struct ValueType<input_DUTY> { using T = Number; };
template<> struct ValueType<input_UPD> { using T = Pulse; };
template<> struct ValueType<output_DONE> { using T = Pulse; };

struct ContextObject {
    Node* _node;

    uint8_t _input_PORT;
    Number _input_DUTY;

    bool _isInputDirty_UPD;

    bool _isOutputDirty_DONE : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_PORT input_DUTY input_UPD" \
            " output_DONE");
}

template<> uint8_t getValue<input_PORT>(Context ctx) {
    return ctx->_input_PORT;
}
template<> Number getValue<input_DUTY>(Context ctx) {
    return ctx->_input_DUTY;
}
template<> Pulse getValue<input_UPD>(Context ctx) {
    return Pulse();
}
template<> Pulse getValue<output_DONE>(Context ctx) {
    return Pulse();
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_UPD");
    return false;
}

template<> bool isInputDirty<input_UPD>(Context ctx) {
    return ctx->_isInputDirty_UPD;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_DONE");
}

template<> void emitValue<output_DONE>(Context ctx, Pulse val) {
    ctx->_isOutputDirty_DONE = true;
    ctx->_node->errors.output_DONE = false;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

template<typename OutputT> void raiseError(Context ctx) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_DONE");
}

template<> void raiseError<output_DONE>(Context ctx) {
    ctx->_node->errors.output_DONE = true;
    ctx->_isOutputDirty_DONE = true;
}

void raiseError(Context ctx) {
    ctx->_node->errors.output_DONE = true;
    ctx->_isOutputDirty_DONE = true;
}

#ifdef PWMRANGE
constexpr Number pwmRange = PWMRANGE;
#else
constexpr Number pwmRange = 255.0;
#endif

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    const uint8_t port = getValue<input_PORT>(ctx);

    if (!isValidDigitalPort(port)) {
        raiseError(ctx);
        return;
    }

    auto duty = getValue<input_DUTY>(ctx);
    duty = duty > 1 ? 1 : (duty < 0 ? 0 : duty);
    int val = (int)(duty * pwmRange);

    ::pinMode(port, OUTPUT);
    ::analogWrite(port, val);
    emitValue<output_DONE>(ctx, 1);
}

} // namespace xod__gpio__pwm_write

//-----------------------------------------------------------------------------
// xod/core/count implementation
//-----------------------------------------------------------------------------
namespace xod__core__count {

struct State {
};

struct Node {
    Number output_OUT;
    State state;
};

struct input_STEP { };
struct input_INC { };
struct input_RST { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_STEP> { using T = Number; };
template<> struct ValueType<input_INC> { using T = Pulse; };
template<> struct ValueType<input_RST> { using T = Pulse; };
template<> struct ValueType<output_OUT> { using T = Number; };

struct ContextObject {
    Node* _node;

    Number _input_STEP;

    bool _isInputDirty_INC;
    bool _isInputDirty_RST;

    bool _isOutputDirty_OUT : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_STEP input_INC input_RST" \
            " output_OUT");
}

template<> Number getValue<input_STEP>(Context ctx) {
    return ctx->_input_STEP;
}
template<> Pulse getValue<input_INC>(Context ctx) {
    return Pulse();
}
template<> Pulse getValue<input_RST>(Context ctx) {
    return Pulse();
}
template<> Number getValue<output_OUT>(Context ctx) {
    return ctx->_node->output_OUT;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_INC input_RST");
    return false;
}

template<> bool isInputDirty<input_INC>(Context ctx) {
    return ctx->_isInputDirty_INC;
}
template<> bool isInputDirty<input_RST>(Context ctx) {
    return ctx->_isInputDirty_RST;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Number val) {
    ctx->_node->output_OUT = val;
    ctx->_isOutputDirty_OUT = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    Number count = getValue<output_OUT>(ctx);

    if (isInputDirty<input_RST>(ctx))
        count = 0;
    else if (isInputDirty<input_INC>(ctx))
        count += getValue<input_STEP>(ctx);

    emitValue<output_OUT>(ctx, count);
}

} // namespace xod__core__count

//-----------------------------------------------------------------------------
// xod/core/square-wave implementation
//-----------------------------------------------------------------------------
namespace xod__core__square_wave {

struct State {
    bool wasEnabled;
    TimeMs timeToSwitch;
    TimeMs nextSwitchTime;
};

struct Node {
    TimeMs timeoutAt;
    Logic output_OUT;
    Number output_N;
    State state;
};

struct input_T { };
struct input_DUTY { };
struct input_EN { };
struct input_RST { };
struct output_OUT { };
struct output_N { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_T> { using T = Number; };
template<> struct ValueType<input_DUTY> { using T = Number; };
template<> struct ValueType<input_EN> { using T = Logic; };
template<> struct ValueType<input_RST> { using T = Pulse; };
template<> struct ValueType<output_OUT> { using T = Logic; };
template<> struct ValueType<output_N> { using T = Number; };

struct ContextObject {
    Node* _node;

    Number _input_T;
    Number _input_DUTY;
    Logic _input_EN;

    bool _isInputDirty_RST;

    bool _isOutputDirty_OUT : 1;
    bool _isOutputDirty_N : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_T input_DUTY input_EN input_RST" \
            " output_OUT output_N");
}

template<> Number getValue<input_T>(Context ctx) {
    return ctx->_input_T;
}
template<> Number getValue<input_DUTY>(Context ctx) {
    return ctx->_input_DUTY;
}
template<> Logic getValue<input_EN>(Context ctx) {
    return ctx->_input_EN;
}
template<> Pulse getValue<input_RST>(Context ctx) {
    return Pulse();
}
template<> Logic getValue<output_OUT>(Context ctx) {
    return ctx->_node->output_OUT;
}
template<> Number getValue<output_N>(Context ctx) {
    return ctx->_node->output_N;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_RST");
    return false;
}

template<> bool isInputDirty<input_RST>(Context ctx) {
    return ctx->_isInputDirty_RST;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT output_N");
}

template<> void emitValue<output_OUT>(Context ctx, Logic val) {
    ctx->_node->output_OUT = val;
    ctx->_isOutputDirty_OUT = true;
}
template<> void emitValue<output_N>(Context ctx, Number val) {
    ctx->_node->output_N = val;
    ctx->_isOutputDirty_N = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    State* state = getState(ctx);
    TimeMs t = transactionTime();

    bool enabled = getValue<input_EN>(ctx);
    bool reset = isInputDirty<input_RST>(ctx);
    Number period = getValue<input_T>(ctx);
    Number duty = getValue<input_DUTY>(ctx);

    if (reset) {
        emitValue<output_OUT>(ctx, enabled);
        emitValue<output_N>(ctx, 0);
        clearTimeout(ctx);
        // enforce rescheduling at the next stage if enabled
        state->wasEnabled = false;
    }

    if (enabled && !state->wasEnabled) {
        // just enabled/resumed
        state->timeToSwitch = (period * duty) * 1000.0;
        setTimeout(ctx, state->timeToSwitch);
        state->nextSwitchTime = t + state->timeToSwitch;
        emitValue<output_OUT>(ctx, true);
    } else if (!enabled && state->wasEnabled) {
        // just paused
        // TODO: we can get rid of storing nextSwitchTime if API would
        // have a function to fetch current scheduled time for a ctx
        state->timeToSwitch = state->nextSwitchTime - t;
        clearTimeout(ctx);
    } else if (isTimedOut(ctx)) {
        // switch time
        auto newValue = !getValue<output_OUT>(ctx);
        auto k = newValue ? duty : (1.0 - duty);
        state->timeToSwitch = period * k * 1000.0;

        setTimeout(ctx, state->timeToSwitch);
        state->nextSwitchTime = t + state->timeToSwitch;

        emitValue<output_OUT>(ctx, newValue);
        if (newValue)
            emitValue<output_N>(ctx, getValue<output_N>(ctx) + 1);
    }

    state->wasEnabled = enabled;
}

} // namespace xod__core__square_wave

//-----------------------------------------------------------------------------
// xod/core/pulse-on-change(string) implementation
//-----------------------------------------------------------------------------
namespace xod__core__pulse_on_change__string {

struct State {
    uint8_t prev = 0;
};

struct Node {
    State state;
};

struct input_IN { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN> { using T = XString; };
template<> struct ValueType<output_OUT> { using T = Pulse; };

struct ContextObject {
    Node* _node;

    XString _input_IN;

    bool _isOutputDirty_OUT : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN" \
            " output_OUT");
}

template<> XString getValue<input_IN>(Context ctx) {
    return ctx->_input_IN;
}
template<> Pulse getValue<output_OUT>(Context ctx) {
    return Pulse();
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Pulse val) {
    ctx->_isOutputDirty_OUT = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

uint8_t crc8(XString str) {
    uint8_t result = 0;
    auto it = str.iterate();

    for (; it; ++it) {
        result ^= *it;

        for (size_t i = 0; i < 8; i++) {
            if (result & 0x80) {
                result <<= 1;
                result ^= 0x85; // x8 + x7 + x2 + x0
            } else {
                result <<= 1;
            }
        }
    }

    return result;
}

void evaluate(Context ctx) {
    auto state = getState(ctx);
    auto str = getValue<input_IN>(ctx);

    uint8_t current = crc8(str);

    if (!isSettingUp() && current != state->prev)
        emitValue<output_OUT>(ctx, 1);

    state->prev = current;
}

} // namespace xod__core__pulse_on_change__string

//-----------------------------------------------------------------------------
// xod/core/buffer(number) implementation
//-----------------------------------------------------------------------------
namespace xod__core__buffer__number {

//#pragma XOD evaluate_on_pin disable
//#pragma XOD evaluate_on_pin enable input_UPD

struct State {
};

struct Node {
    Number output_MEM;
    State state;
};

struct input_NEW { };
struct input_UPD { };
struct output_MEM { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_NEW> { using T = Number; };
template<> struct ValueType<input_UPD> { using T = Pulse; };
template<> struct ValueType<output_MEM> { using T = Number; };

struct ContextObject {
    Node* _node;

    Number _input_NEW;

    bool _isInputDirty_UPD;

    bool _isOutputDirty_MEM : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_NEW input_UPD" \
            " output_MEM");
}

template<> Number getValue<input_NEW>(Context ctx) {
    return ctx->_input_NEW;
}
template<> Pulse getValue<input_UPD>(Context ctx) {
    return Pulse();
}
template<> Number getValue<output_MEM>(Context ctx) {
    return ctx->_node->output_MEM;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_UPD");
    return false;
}

template<> bool isInputDirty<input_UPD>(Context ctx) {
    return ctx->_isInputDirty_UPD;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_MEM");
}

template<> void emitValue<output_MEM>(Context ctx, Number val) {
    ctx->_node->output_MEM = val;
    ctx->_isOutputDirty_MEM = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    emitValue<output_MEM>(ctx, getValue<input_NEW>(ctx));
}

} // namespace xod__core__buffer__number

//-----------------------------------------------------------------------------
// xod/core/cast-to-number(boolean) implementation
//-----------------------------------------------------------------------------
namespace xod__core__cast_to_number__boolean {

//#pragma XOD dirtieness disable

struct State {
};

struct Node {
    Number output_OUT;
    State state;
};

struct input_IN { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN> { using T = Logic; };
template<> struct ValueType<output_OUT> { using T = Number; };

struct ContextObject {
    Node* _node;

    Logic _input_IN;

};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN" \
            " output_OUT");
}

template<> Logic getValue<input_IN>(Context ctx) {
    return ctx->_input_IN;
}
template<> Number getValue<output_OUT>(Context ctx) {
    return ctx->_node->output_OUT;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Number val) {
    ctx->_node->output_OUT = val;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    emitValue<output_OUT>(ctx, getValue<input_IN>(ctx) ? 1.0 : 0.0);
}

} // namespace xod__core__cast_to_number__boolean

//-----------------------------------------------------------------------------
// xod/core/branch implementation
//-----------------------------------------------------------------------------
namespace xod__core__branch {

//#pragma XOD evaluate_on_pin disable
//#pragma XOD evaluate_on_pin enable input_TRIG

struct State {
};

struct Node {
    State state;
};

struct input_GATE { };
struct input_TRIG { };
struct output_T { };
struct output_F { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_GATE> { using T = Logic; };
template<> struct ValueType<input_TRIG> { using T = Pulse; };
template<> struct ValueType<output_T> { using T = Pulse; };
template<> struct ValueType<output_F> { using T = Pulse; };

struct ContextObject {
    Node* _node;

    Logic _input_GATE;

    bool _isInputDirty_TRIG;

    bool _isOutputDirty_T : 1;
    bool _isOutputDirty_F : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_GATE input_TRIG" \
            " output_T output_F");
}

template<> Logic getValue<input_GATE>(Context ctx) {
    return ctx->_input_GATE;
}
template<> Pulse getValue<input_TRIG>(Context ctx) {
    return Pulse();
}
template<> Pulse getValue<output_T>(Context ctx) {
    return Pulse();
}
template<> Pulse getValue<output_F>(Context ctx) {
    return Pulse();
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_TRIG");
    return false;
}

template<> bool isInputDirty<input_TRIG>(Context ctx) {
    return ctx->_isInputDirty_TRIG;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_T output_F");
}

template<> void emitValue<output_T>(Context ctx, Pulse val) {
    ctx->_isOutputDirty_T = true;
}
template<> void emitValue<output_F>(Context ctx, Pulse val) {
    ctx->_isOutputDirty_F = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    if (!isInputDirty<input_TRIG>(ctx))
        return;

    if (getValue<input_GATE>(ctx)) {
        emitValue<output_T>(ctx, 1);
    } else {
        emitValue<output_F>(ctx, 1);
    }
}

} // namespace xod__core__branch

//-----------------------------------------------------------------------------
// @/play-note implementation
//-----------------------------------------------------------------------------
namespace ____play_note {

struct State {
};

struct Node {
    State state;
};

struct input_PIN { };
struct input_FREQ { };
struct input_DUR { };
struct input_UPD { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_PIN> { using T = uint8_t; };
template<> struct ValueType<input_FREQ> { using T = Number; };
template<> struct ValueType<input_DUR> { using T = Number; };
template<> struct ValueType<input_UPD> { using T = Pulse; };

struct ContextObject {
    Node* _node;

    uint8_t _input_PIN;
    Number _input_FREQ;
    Number _input_DUR;

    bool _isInputDirty_UPD;

};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_PIN input_FREQ input_DUR input_UPD" \
            "");
}

template<> uint8_t getValue<input_PIN>(Context ctx) {
    return ctx->_input_PIN;
}
template<> Number getValue<input_FREQ>(Context ctx) {
    return ctx->_input_FREQ;
}
template<> Number getValue<input_DUR>(Context ctx) {
    return ctx->_input_DUR;
}
template<> Pulse getValue<input_UPD>(Context ctx) {
    return Pulse();
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_UPD");
    return false;
}

template<> bool isInputDirty<input_UPD>(Context ctx) {
    return ctx->_isInputDirty_UPD;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            "");
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx)) return;

    auto pin = getValue<input_PIN>(ctx);
    auto frequency = getValue<input_FREQ>(ctx);
    auto duration = getValue<input_DUR>(ctx);

    tone(pin, frequency);
    delay(duration*1000);
    noTone(pin);
}

} // namespace ____play_note

//-----------------------------------------------------------------------------
// xod-dev/text-lcd/print-at(text-lcd-i2c-device) implementation
//-----------------------------------------------------------------------------
namespace xod_dev__text_lcd__print_at__text_lcd_i2c_device {

struct State {
};

union NodeErrors {
    struct {
        bool output_DEVU0027 : 1;
        bool output_DONE : 1;
    };

    ErrorFlags flags;
};

struct Node {
    NodeErrors errors;
    xod_dev__text_lcd__text_lcd_i2c_device::Type output_DEVU0027;
    State state;
};

struct input_DEV { };
struct input_ROW { };
struct input_POS { };
struct input_LEN { };
struct input_VAL { };
struct input_DO { };
struct output_DEVU0027 { };
struct output_DONE { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_DEV> { using T = xod_dev__text_lcd__text_lcd_i2c_device::Type; };
template<> struct ValueType<input_ROW> { using T = Number; };
template<> struct ValueType<input_POS> { using T = Number; };
template<> struct ValueType<input_LEN> { using T = Number; };
template<> struct ValueType<input_VAL> { using T = XString; };
template<> struct ValueType<input_DO> { using T = Pulse; };
template<> struct ValueType<output_DEVU0027> { using T = xod_dev__text_lcd__text_lcd_i2c_device::Type; };
template<> struct ValueType<output_DONE> { using T = Pulse; };

struct ContextObject {
    Node* _node;

    xod_dev__text_lcd__text_lcd_i2c_device::Type _input_DEV;
    Number _input_ROW;
    Number _input_POS;
    Number _input_LEN;
    XString _input_VAL;

    bool _isInputDirty_DO;

    bool _isOutputDirty_DEVU0027 : 1;
    bool _isOutputDirty_DONE : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_DEV input_ROW input_POS input_LEN input_VAL input_DO" \
            " output_DEVU0027 output_DONE");
}

template<> xod_dev__text_lcd__text_lcd_i2c_device::Type getValue<input_DEV>(Context ctx) {
    return ctx->_input_DEV;
}
template<> Number getValue<input_ROW>(Context ctx) {
    return ctx->_input_ROW;
}
template<> Number getValue<input_POS>(Context ctx) {
    return ctx->_input_POS;
}
template<> Number getValue<input_LEN>(Context ctx) {
    return ctx->_input_LEN;
}
template<> XString getValue<input_VAL>(Context ctx) {
    return ctx->_input_VAL;
}
template<> Pulse getValue<input_DO>(Context ctx) {
    return Pulse();
}
template<> xod_dev__text_lcd__text_lcd_i2c_device::Type getValue<output_DEVU0027>(Context ctx) {
    return ctx->_node->output_DEVU0027;
}
template<> Pulse getValue<output_DONE>(Context ctx) {
    return Pulse();
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_DO");
    return false;
}

template<> bool isInputDirty<input_DO>(Context ctx) {
    return ctx->_isInputDirty_DO;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_DEVU0027 output_DONE");
}

template<> void emitValue<output_DEVU0027>(Context ctx, xod_dev__text_lcd__text_lcd_i2c_device::Type val) {
    ctx->_node->output_DEVU0027 = val;
    ctx->_isOutputDirty_DEVU0027 = true;
    ctx->_node->errors.output_DEVU0027 = false;
}
template<> void emitValue<output_DONE>(Context ctx, Pulse val) {
    ctx->_isOutputDirty_DONE = true;
    ctx->_node->errors.output_DONE = false;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

template<typename OutputT> void raiseError(Context ctx) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_DEVU0027 output_DONE");
}

template<> void raiseError<output_DEVU0027>(Context ctx) {
    ctx->_node->errors.output_DEVU0027 = true;
    ctx->_isOutputDirty_DEVU0027 = true;
}
template<> void raiseError<output_DONE>(Context ctx) {
    ctx->_node->errors.output_DONE = true;
    ctx->_isOutputDirty_DONE = true;
}

void raiseError(Context ctx) {
    ctx->_node->errors.output_DEVU0027 = true;
    ctx->_isOutputDirty_DEVU0027 = true;
    ctx->_node->errors.output_DONE = true;
    ctx->_isOutputDirty_DONE = true;
}

void printAt(LiquidCrystal_I2C* lcd, uint8_t rowIndex, uint8_t posIndex, uint8_t len, XString str) {
    lcd->setCursor(posIndex, rowIndex);
    uint8_t whitespace = len;
    for (auto it = str.iterate(); it && whitespace > 0; ++it, --whitespace)
        lcd->write(*it);

    // Clear the rest of the area
    while (whitespace--)
        lcd->write(' ');
}

void evaluate(Context ctx) {
    auto t = getValue<input_DEV>(ctx);

    if (isInputDirty<input_DO>(ctx)) {
        XString str = getValue<input_VAL>(ctx);
        uint8_t row = (uint8_t) getValue<input_ROW>(ctx);
        uint8_t pos = (uint8_t) getValue<input_POS>(ctx);

        Number _len = getValue<input_LEN>(ctx);
        uint8_t restLen = t.cols - pos;
        uint8_t len = (_len > restLen) ? restLen : (uint8_t) _len;

        if (row < 0 || row >= t.rows || pos < 0 || pos >= t.cols) {
            raiseError<output_DONE>(ctx);
            return;
        }

        printAt(t.lcd, row, pos, len, str);
        emitValue<output_DONE>(ctx, 1);
    }

    emitValue<output_DEVU0027>(ctx, t);
}

} // namespace xod_dev__text_lcd__print_at__text_lcd_i2c_device

//-----------------------------------------------------------------------------
// xod-dev/servo/rotate implementation
//-----------------------------------------------------------------------------
namespace xod_dev__servo__rotate {

//#pragma XOD evaluate_on_pin disable
//#pragma XOD evaluate_on_pin enable input_DO

struct State { };

struct Node {
    xod_dev__servo__servo_device::Type output_DEVU0027;
    State state;
};

struct input_DEV { };
struct input_VAL { };
struct input_DO { };
struct output_DEVU0027 { };
struct output_ACK { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_DEV> { using T = xod_dev__servo__servo_device::Type; };
template<> struct ValueType<input_VAL> { using T = Number; };
template<> struct ValueType<input_DO> { using T = Pulse; };
template<> struct ValueType<output_DEVU0027> { using T = xod_dev__servo__servo_device::Type; };
template<> struct ValueType<output_ACK> { using T = Pulse; };

struct ContextObject {
    Node* _node;

    xod_dev__servo__servo_device::Type _input_DEV;
    Number _input_VAL;

    bool _isInputDirty_DO;

    bool _isOutputDirty_DEVU0027 : 1;
    bool _isOutputDirty_ACK : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_DEV input_VAL input_DO" \
            " output_DEVU0027 output_ACK");
}

template<> xod_dev__servo__servo_device::Type getValue<input_DEV>(Context ctx) {
    return ctx->_input_DEV;
}
template<> Number getValue<input_VAL>(Context ctx) {
    return ctx->_input_VAL;
}
template<> Pulse getValue<input_DO>(Context ctx) {
    return Pulse();
}
template<> xod_dev__servo__servo_device::Type getValue<output_DEVU0027>(Context ctx) {
    return ctx->_node->output_DEVU0027;
}
template<> Pulse getValue<output_ACK>(Context ctx) {
    return Pulse();
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_DO");
    return false;
}

template<> bool isInputDirty<input_DO>(Context ctx) {
    return ctx->_isInputDirty_DO;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_DEVU0027 output_ACK");
}

template<> void emitValue<output_DEVU0027>(Context ctx, xod_dev__servo__servo_device::Type val) {
    ctx->_node->output_DEVU0027 = val;
    ctx->_isOutputDirty_DEVU0027 = true;
}
template<> void emitValue<output_ACK>(Context ctx, Pulse val) {
    ctx->_isOutputDirty_ACK = true;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

void evaluate(Context ctx) {
    auto xservo = getValue<input_DEV>(ctx);

    if (isSettingUp()) {
        // Short-circuit DEV and DEV'
        emitValue<output_DEVU0027>(ctx, xservo);
    }

    if (!isInputDirty<input_DO>(ctx))
        return;

    auto angle = getValue<input_VAL>(ctx);
    xservo->write01(angle);
    emitValue<output_ACK>(ctx, 1);
}

} // namespace xod_dev__servo__rotate

//-----------------------------------------------------------------------------
// xod/core/defer(number) implementation
//-----------------------------------------------------------------------------
namespace xod__core__defer__number {

//#pragma XOD error_catch enable
//#pragma XOD error_raise enable

struct State {
    bool shouldRaiseAtTheNextDeferOnlyRun = false;
};

union NodeErrors {
    struct {
        bool output_OUT : 1;
    };

    ErrorFlags flags;
};

struct Node {
    NodeErrors errors;
    TimeMs timeoutAt;
    Number output_OUT;
    State state;
};

struct input_IN { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN> { using T = Number; };
template<> struct ValueType<output_OUT> { using T = Number; };

struct ContextObject {
    Node* _node;
    uint8_t _error_input_IN;

    Number _input_IN;

    bool _isOutputDirty_OUT : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN" \
            " output_OUT");
}

template<> Number getValue<input_IN>(Context ctx) {
    return ctx->_input_IN;
}
template<> Number getValue<output_OUT>(Context ctx) {
    return ctx->_node->output_OUT;
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            "");
    return false;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Number val) {
    ctx->_node->output_OUT = val;
    ctx->_isOutputDirty_OUT = true;
    if (isEarlyDeferPass()) ctx->_node->errors.output_OUT = false;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

template<typename OutputT> void raiseError(Context ctx) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void raiseError<output_OUT>(Context ctx) {
    ctx->_node->errors.output_OUT = true;
    ctx->_isOutputDirty_OUT = true;
}

void raiseError(Context ctx) {
    ctx->_node->errors.output_OUT = true;
    ctx->_isOutputDirty_OUT = true;
}

template<typename InputT> uint8_t getError(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_IN");
    return 0;
}

template<> uint8_t getError<input_IN>(Context ctx) {
    return ctx->_error_input_IN;
}

void evaluate(Context ctx) {
    auto state = getState(ctx);

    if (isEarlyDeferPass()) {
        if (state->shouldRaiseAtTheNextDeferOnlyRun) {
            raiseError<output_OUT>(ctx);
            state->shouldRaiseAtTheNextDeferOnlyRun = false;
        } else {
            emitValue<output_OUT>(ctx, getValue<output_OUT>(ctx));
        }
    } else {
        if (getError<input_IN>(ctx)) {
            state->shouldRaiseAtTheNextDeferOnlyRun = true;
        } else {
            // save the value for reemission on deferred-only evaluation pass
            emitValue<output_OUT>(ctx, getValue<input_IN>(ctx));
        }

        setTimeout(ctx, 0);
    }
}

} // namespace xod__core__defer__number

//-----------------------------------------------------------------------------
// xod/core/defer(pulse) implementation
//-----------------------------------------------------------------------------
namespace xod__core__defer__pulse {

//#pragma XOD error_catch enable
//#pragma XOD error_raise enable

struct State {
    bool shouldRaiseAtTheNextDeferOnlyRun = false;
    bool shouldPulseAtTheNextDeferOnlyRun = false;
};

union NodeErrors {
    struct {
        bool output_OUT : 1;
    };

    ErrorFlags flags;
};

struct Node {
    NodeErrors errors;
    TimeMs timeoutAt;
    State state;
};

struct input_IN { };
struct output_OUT { };

template<typename PinT> struct ValueType { using T = void; };
template<> struct ValueType<input_IN> { using T = Pulse; };
template<> struct ValueType<output_OUT> { using T = Pulse; };

struct ContextObject {
    Node* _node;
    uint8_t _error_input_IN;

    bool _isInputDirty_IN;

    bool _isOutputDirty_OUT : 1;
};

using Context = ContextObject*;

template<typename PinT> typename ValueType<PinT>::T getValue(Context ctx) {
    static_assert(always_false<PinT>::value,
            "Invalid pin descriptor. Expected one of:" \
            " input_IN" \
            " output_OUT");
}

template<> Pulse getValue<input_IN>(Context ctx) {
    return Pulse();
}
template<> Pulse getValue<output_OUT>(Context ctx) {
    return Pulse();
}

template<typename InputT> bool isInputDirty(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_IN");
    return false;
}

template<> bool isInputDirty<input_IN>(Context ctx) {
    return ctx->_isInputDirty_IN;
}

template<typename OutputT> void emitValue(Context ctx, typename ValueType<OutputT>::T val) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void emitValue<output_OUT>(Context ctx, Pulse val) {
    ctx->_isOutputDirty_OUT = true;
    if (isEarlyDeferPass()) ctx->_node->errors.output_OUT = false;
}

State* getState(Context ctx) {
    return &ctx->_node->state;
}

template<typename OutputT> void raiseError(Context ctx) {
    static_assert(always_false<OutputT>::value,
            "Invalid output descriptor. Expected one of:" \
            " output_OUT");
}

template<> void raiseError<output_OUT>(Context ctx) {
    ctx->_node->errors.output_OUT = true;
    ctx->_isOutputDirty_OUT = true;
}

void raiseError(Context ctx) {
    ctx->_node->errors.output_OUT = true;
    ctx->_isOutputDirty_OUT = true;
}

template<typename InputT> uint8_t getError(Context ctx) {
    static_assert(always_false<InputT>::value,
            "Invalid input descriptor. Expected one of:" \
            " input_IN");
    return 0;
}

template<> uint8_t getError<input_IN>(Context ctx) {
    return ctx->_error_input_IN;
}

void evaluate(Context ctx) {
    auto state = getState(ctx);

    if (isEarlyDeferPass()) {
        if (state->shouldRaiseAtTheNextDeferOnlyRun) {
            raiseError<output_OUT>(ctx);
            state->shouldRaiseAtTheNextDeferOnlyRun = false;
        }

        if (state->shouldPulseAtTheNextDeferOnlyRun) {
            emitValue<output_OUT>(ctx, true);
            state->shouldPulseAtTheNextDeferOnlyRun = false;
        }
    } else {
        if (getError<input_IN>(ctx)) {
            state->shouldRaiseAtTheNextDeferOnlyRun = true;
        } else if (isInputDirty<input_IN>(ctx)) {
            state->shouldPulseAtTheNextDeferOnlyRun = true;
        }

        setTimeout(ctx, 0);
    }
}

} // namespace xod__core__defer__pulse

} // namespace xod


/*=============================================================================
 *
 *
 * Main loop components
 *
 *
 =============================================================================*/

namespace xod {

// Define/allocate persistent storages (state, timeout, output data) for all nodes
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wmissing-field-initializers"

constexpr Number node_0_output_VAL = 0;

constexpr Number node_1_output_VAL = 0;

constexpr Number node_2_output_VAL = 1;

constexpr Number node_3_output_VAL = 1;

constexpr Number node_4_output_VAL = 0;

constexpr uint8_t node_5_output_VAL = A3;

constexpr Number node_6_output_VAL = 0.02;

constexpr uint8_t node_7_output_VAL = 12;

constexpr Number node_8_output_VAL = 0.3;

constexpr Number node_9_output_VAL = 0.15;

constexpr Number node_10_output_VAL = 0.35;

constexpr Number node_11_output_VAL = 25;

constexpr Number node_12_output_VAL = 125;

constexpr uint8_t node_13_output_VAL = A1;

constexpr Number node_14_output_VAL = 15;

constexpr Number node_15_output_VAL = 0.5;

constexpr Number node_16_output_VAL = 0.5;

constexpr Number node_17_output_VAL = 0.5;

constexpr Number node_18_output_VAL = 0.5;

constexpr uint8_t node_19_output_VAL = 9;

constexpr Number node_20_output_VAL = 660;

constexpr Number node_21_output_VAL = 0.5;

constexpr uint8_t node_22_output_VAL = 9;

constexpr Number node_23_output_VAL = 440;

constexpr uint8_t node_24_output_VAL = 8;

constexpr Logic node_25_output_VAL = true;

constexpr uint8_t node_26_output_VAL = 10;

constexpr Logic node_27_output_VAL = true;

constexpr Number node_28_output_VAL = 0.3;

constexpr Number node_29_output_VAL = 0.02;

constexpr uint8_t node_30_output_VAL = 13;

constexpr uint8_t node_31_output_VAL = A0;

constexpr Number node_32_output_VAL = 0.5;

static XStringCString node_33_output_VAL = XStringCString("Storm upon us");

constexpr Logic node_34_output_VAL = true;

constexpr Logic node_35_output_VAL = true;

constexpr Logic node_36_output_VAL = true;

static XStringCString node_37_output_VAL = XStringCString("ERR");

constexpr Number node_38_output_VAL = 0;

constexpr Number node_39_output_VAL = 0;

constexpr Number node_40_output_VAL = INFINITY;

constexpr uint8_t node_41_output_VAL = 0x38;

constexpr Number node_42_output_VAL = 16;

constexpr Number node_43_output_VAL = 2;

constexpr Logic node_44_output_VAL = true;

constexpr Number node_45_output_VAL = 1;

constexpr Number node_46_output_VAL = 0;

constexpr Number node_47_output_VAL = INFINITY;

constexpr Logic node_48_output_VAL = true;

static XStringCString node_49_output_VAL = XStringCString("ERR");

constexpr Number node_50_output_VAL = 30;

static XStringCString node_51_output_VAL = XStringCString("Overheating");

static XStringCString node_52_output_VAL = XStringCString("Oh, hi Mars");

static XStringCString node_53_output_VAL = XStringCString("С=");

static XStringCString node_54_output_VAL = XStringCString(" T=");

static XStringCString node_55_output_VAL = XStringCString("Code red! Panic!");

constexpr Number node_56_output_VAL = 1.5;

constexpr Number node_57_output_VAL = 0;

constexpr Number node_58_output_VAL = 0.2;

constexpr Number node_59_output_VAL = 180;

constexpr Number node_60_output_VAL = 180;

constexpr Number node_61_output_VAL = 18;

constexpr Number node_62_output_VAL = 0;

constexpr Number node_63_output_VAL = 180;

constexpr Number node_64_output_VAL = 0;

constexpr Number node_65_output_VAL = 1;

constexpr uint8_t node_66_output_VAL = 11;

constexpr Logic node_67_output_VAL = true;

constexpr uint8_t node_68_output_VAL = 6;

constexpr Number node_69_output_VAL = 544;

constexpr Number node_70_output_VAL = 2400;

constexpr Logic node_71_output_VAL = true;

constexpr Logic node_72_output_VAL = true;

constexpr Logic node_73_output_VAL = true;

constexpr Logic node_74_output_VAL = true;

constexpr Logic node_75_output_VAL = true;

constexpr Logic node_76_output_VAL = true;

constexpr Logic node_77_output_VAL = true;

constexpr Logic node_78_output_VAL = true;

constexpr Number node_81_output_OUT = 0;

constexpr xod_dev__text_lcd__text_lcd_i2c_device::Type node_83_output_DEV = { /* xod-dev/text-lcd/text-lcd-i2c-device */ };

constexpr Number node_84_output_OUT = 0;

constexpr xod_dev__servo__servo_device::Type node_85_output_DEV = { /* xod-dev/servo/servo-device */ };

constexpr Number node_93_output_VAL = 0;

constexpr Logic node_94_output_SIG = false;

constexpr Number node_95_output_VAL = 0;

constexpr Logic node_96_output_SIG = false;

constexpr Number node_97_output_VAL = 0;

constexpr Number node_98_output_OUT = 0;

constexpr Number node_100_output_OUT = 0;

constexpr Logic node_101_output_OUT = false;

constexpr Number node_102_output_OUT = 0;

constexpr Logic node_103_output_OUT = false;

constexpr Logic node_105_output_OUT = false;

constexpr Logic node_106_output_OUT = false;

constexpr Logic node_107_output_OUT = false;

constexpr XString node_108_output_OUT = XString();

constexpr Logic node_109_output_OUT = false;

constexpr Logic node_110_output_OUT = false;

constexpr Logic node_111_output_OUT = false;

constexpr XString node_112_output_OUT = XString();

constexpr Logic node_113_output_OUT = false;

constexpr Number node_115_output_R = 0;

constexpr Number node_116_output_R = 0;

constexpr XString node_117_output_OUT = XString();

constexpr Logic node_119_output_OUT = false;

constexpr Logic node_120_output_OUT = false;

constexpr XString node_121_output_R = XString();

constexpr xod_dev__text_lcd__text_lcd_i2c_device::Type node_123_output_DEVU0027 = { /* xod-dev/text-lcd/text-lcd-i2c-device */ };

constexpr Number node_124_output_OUT = 0;

constexpr XString node_126_output_OUT = XString();

constexpr Logic node_129_output_MEM = false;

constexpr XString node_131_output_OUT = XString();

constexpr Logic node_133_output_OUT = false;

constexpr Logic node_135_output_MEM = false;

constexpr Logic node_136_output_OUT = false;

constexpr XString node_138_output_R = XString();

constexpr Number node_141_output_R = 0;

constexpr Logic node_144_output_MEM = false;

constexpr XString node_145_output_OUT = XString();

constexpr Logic node_146_output_MEM = false;

constexpr Number node_148_output_OUT = 0;

constexpr Logic node_150_output_OUT = false;
constexpr Number node_150_output_N = 0;

constexpr Logic node_151_output_OUT = false;

constexpr Logic node_152_output_OUT = false;

constexpr XString node_154_output_R = XString();

constexpr Number node_155_output_R = 0;

constexpr Logic node_156_output_OUT = false;

constexpr Number node_157_output_MEM = 0;

constexpr Logic node_158_output_OUT = false;

constexpr Number node_160_output_OUT = 0;

constexpr Logic node_161_output_OUT = false;

constexpr XString node_163_output_R = XString();

constexpr Number node_167_output_OUT = 0;

constexpr Number node_169_output_OUT = 0;

constexpr XString node_171_output_OUT = XString();

constexpr Logic node_173_output_MEM = false;

constexpr Number node_176_output_OUT = 0;

constexpr Number node_180_output_MEM = 0;

constexpr xod_dev__text_lcd__text_lcd_i2c_device::Type node_183_output_DEVU0027 = { /* xod-dev/text-lcd/text-lcd-i2c-device */ };

constexpr Number node_185_output_R = 0;

constexpr Number node_190_output_OUT = 0;

constexpr xod_dev__text_lcd__text_lcd_i2c_device::Type node_196_output_DEVU0027 = { /* xod-dev/text-lcd/text-lcd-i2c-device */ };

constexpr xod_dev__servo__servo_device::Type node_201_output_DEVU0027 = { /* xod-dev/servo/servo-device */ };

constexpr Number node_202_output_OUT = 0;

constexpr Number node_204_output_OUT = 0;

#pragma GCC diagnostic pop

struct TransactionState {
    bool node_79_isNodeDirty : 1;
    bool node_79_isOutputDirty_TICK : 1;
    bool node_80_isNodeDirty : 1;
    bool node_80_isOutputDirty_BOOT : 1;
    bool node_81_isNodeDirty : 1;
    bool node_81_isOutputDirty_OUT : 1;
    bool node_82_isNodeDirty : 1;
    bool node_82_isOutputDirty_OUT : 1;
    bool node_83_isNodeDirty : 1;
    bool node_83_isOutputDirty_DEV : 1;
    bool node_84_isNodeDirty : 1;
    bool node_84_isOutputDirty_OUT : 1;
    bool node_85_isNodeDirty : 1;
    bool node_86_isNodeDirty : 1;
    bool node_86_isOutputDirty_OUT : 1;
    bool node_87_isNodeDirty : 1;
    bool node_87_isOutputDirty_OUT : 1;
    bool node_88_isNodeDirty : 1;
    bool node_88_isOutputDirty_OUT : 1;
    bool node_89_isNodeDirty : 1;
    bool node_89_isOutputDirty_OUT : 1;
    bool node_90_isNodeDirty : 1;
    bool node_90_isOutputDirty_OUT : 1;
    bool node_91_isNodeDirty : 1;
    bool node_91_isOutputDirty_OUT : 1;
    bool node_92_isNodeDirty : 1;
    bool node_92_isOutputDirty_OUT : 1;
    bool node_93_isNodeDirty : 1;
    bool node_93_isOutputDirty_VAL : 1;
    bool node_94_isNodeDirty : 1;
    bool node_94_isOutputDirty_SIG : 1;
    bool node_95_isNodeDirty : 1;
    bool node_95_isOutputDirty_VAL : 1;
    bool node_96_isNodeDirty : 1;
    bool node_96_isOutputDirty_SIG : 1;
    bool node_97_isNodeDirty : 1;
    bool node_97_isOutputDirty_VAL : 1;
    bool node_98_isNodeDirty : 1;
    bool node_98_isOutputDirty_OUT : 1;
    bool node_99_isNodeDirty : 1;
    bool node_99_isOutputDirty_OUT : 1;
    bool node_100_isNodeDirty : 1;
    bool node_100_isOutputDirty_OUT : 1;
    bool node_100_hasUpstreamError : 1;
    bool node_101_isNodeDirty : 1;
    bool node_101_isOutputDirty_OUT : 1;
    bool node_101_hasUpstreamError : 1;
    bool node_102_isNodeDirty : 1;
    bool node_102_isOutputDirty_OUT : 1;
    bool node_102_hasUpstreamError : 1;
    bool node_103_isNodeDirty : 1;
    bool node_103_isOutputDirty_OUT : 1;
    bool node_103_hasUpstreamError : 1;
    bool node_104_isNodeDirty : 1;
    bool node_104_isOutputDirty_OUT : 1;
    bool node_105_isNodeDirty : 1;
    bool node_105_isOutputDirty_OUT : 1;
    bool node_105_hasUpstreamError : 1;
    bool node_106_isNodeDirty : 1;
    bool node_106_isOutputDirty_OUT : 1;
    bool node_106_hasUpstreamError : 1;
    bool node_107_isNodeDirty : 1;
    bool node_107_isOutputDirty_OUT : 1;
    bool node_107_hasUpstreamError : 1;
    bool node_108_isNodeDirty : 1;
    bool node_108_isOutputDirty_OUT : 1;
    bool node_108_hasUpstreamError : 1;
    bool node_109_isNodeDirty : 1;
    bool node_109_isOutputDirty_OUT : 1;
    bool node_109_hasUpstreamError : 1;
    bool node_110_isNodeDirty : 1;
    bool node_110_isOutputDirty_OUT : 1;
    bool node_110_hasUpstreamError : 1;
    bool node_111_isNodeDirty : 1;
    bool node_111_isOutputDirty_OUT : 1;
    bool node_111_hasUpstreamError : 1;
    bool node_112_isNodeDirty : 1;
    bool node_112_isOutputDirty_OUT : 1;
    bool node_112_hasUpstreamError : 1;
    bool node_113_isNodeDirty : 1;
    bool node_113_isOutputDirty_OUT : 1;
    bool node_113_hasUpstreamError : 1;
    bool node_114_isNodeDirty : 1;
    bool node_114_isOutputDirty_OUT : 1;
    bool node_115_isNodeDirty : 1;
    bool node_115_isOutputDirty_R : 1;
    bool node_115_hasUpstreamError : 1;
    bool node_116_isNodeDirty : 1;
    bool node_116_isOutputDirty_R : 1;
    bool node_116_hasUpstreamError : 1;
    bool node_117_isNodeDirty : 1;
    bool node_117_isOutputDirty_OUT : 1;
    bool node_117_hasUpstreamError : 1;
    bool node_118_isNodeDirty : 1;
    bool node_118_isOutputDirty_OUT : 1;
    bool node_118_hasUpstreamError : 1;
    bool node_119_isNodeDirty : 1;
    bool node_119_isOutputDirty_OUT : 1;
    bool node_119_hasUpstreamError : 1;
    bool node_120_isNodeDirty : 1;
    bool node_120_isOutputDirty_OUT : 1;
    bool node_120_hasUpstreamError : 1;
    bool node_121_isNodeDirty : 1;
    bool node_121_isOutputDirty_R : 1;
    bool node_121_hasUpstreamError : 1;
    bool node_122_isNodeDirty : 1;
    bool node_122_isOutputDirty_OUT : 1;
    bool node_122_hasUpstreamError : 1;
    bool node_123_isNodeDirty : 1;
    bool node_123_isOutputDirty_DEVU0027 : 1;
    bool node_123_isOutputDirty_DONE : 1;
    bool node_123_hasUpstreamError : 1;
    bool node_124_isNodeDirty : 1;
    bool node_124_hasUpstreamError : 1;
    bool node_125_isNodeDirty : 1;
    bool node_125_isOutputDirty_OUT : 1;
    bool node_125_hasUpstreamError : 1;
    bool node_126_isNodeDirty : 1;
    bool node_126_isOutputDirty_OUT : 1;
    bool node_126_hasUpstreamError : 1;
    bool node_127_isNodeDirty : 1;
    bool node_127_isOutputDirty_OUT : 1;
    bool node_127_hasUpstreamError : 1;
    bool node_128_isNodeDirty : 1;
    bool node_128_isOutputDirty_OUT : 1;
    bool node_128_hasUpstreamError : 1;
    bool node_129_isNodeDirty : 1;
    bool node_129_isOutputDirty_MEM : 1;
    bool node_129_hasUpstreamError : 1;
    bool node_130_isNodeDirty : 1;
    bool node_130_isOutputDirty_OUT : 1;
    bool node_130_hasUpstreamError : 1;
    bool node_131_isNodeDirty : 1;
    bool node_131_isOutputDirty_OUT : 1;
    bool node_131_hasUpstreamError : 1;
    bool node_132_isNodeDirty : 1;
    bool node_132_isOutputDirty_OUT : 1;
    bool node_132_hasUpstreamError : 1;
    bool node_133_isNodeDirty : 1;
    bool node_133_isOutputDirty_OUT : 1;
    bool node_133_hasUpstreamError : 1;
    bool node_134_isNodeDirty : 1;
    bool node_134_isOutputDirty_OUT : 1;
    bool node_134_hasUpstreamError : 1;
    bool node_135_isNodeDirty : 1;
    bool node_135_isOutputDirty_MEM : 1;
    bool node_135_hasUpstreamError : 1;
    bool node_136_isNodeDirty : 1;
    bool node_136_isOutputDirty_OUT : 1;
    bool node_136_hasUpstreamError : 1;
    bool node_137_isNodeDirty : 1;
    bool node_137_isOutputDirty_TICK : 1;
    bool node_137_hasUpstreamError : 1;
    bool node_138_isNodeDirty : 1;
    bool node_138_isOutputDirty_R : 1;
    bool node_138_hasUpstreamError : 1;
    bool node_139_isNodeDirty : 1;
    bool node_139_isOutputDirty_TICK : 1;
    bool node_139_hasUpstreamError : 1;
    bool node_140_isNodeDirty : 1;
    bool node_140_isOutputDirty_OUT : 1;
    bool node_140_hasUpstreamError : 1;
    bool node_141_isNodeDirty : 1;
    bool node_141_hasUpstreamError : 1;
    bool node_142_isNodeDirty : 1;
    bool node_142_isOutputDirty_TICK : 1;
    bool node_142_hasUpstreamError : 1;
    bool node_143_isNodeDirty : 1;
    bool node_143_isOutputDirty_OUT : 1;
    bool node_143_hasUpstreamError : 1;
    bool node_144_isNodeDirty : 1;
    bool node_144_isOutputDirty_MEM : 1;
    bool node_144_hasUpstreamError : 1;
    bool node_145_isNodeDirty : 1;
    bool node_145_isOutputDirty_OUT : 1;
    bool node_145_hasUpstreamError : 1;
    bool node_146_isNodeDirty : 1;
    bool node_146_isOutputDirty_MEM : 1;
    bool node_146_hasUpstreamError : 1;
    bool node_147_isNodeDirty : 1;
    bool node_147_hasUpstreamError : 1;
    bool node_148_isNodeDirty : 1;
    bool node_148_isOutputDirty_OUT : 1;
    bool node_148_hasUpstreamError : 1;
    bool node_149_isNodeDirty : 1;
    bool node_149_isOutputDirty_OUT : 1;
    bool node_149_hasUpstreamError : 1;
    bool node_150_isNodeDirty : 1;
    bool node_150_isOutputDirty_OUT : 1;
    bool node_150_hasUpstreamError : 1;
    bool node_151_isNodeDirty : 1;
    bool node_151_isOutputDirty_OUT : 1;
    bool node_151_hasUpstreamError : 1;
    bool node_152_isNodeDirty : 1;
    bool node_152_isOutputDirty_OUT : 1;
    bool node_152_hasUpstreamError : 1;
    bool node_153_isNodeDirty : 1;
    bool node_153_isOutputDirty_OUT : 1;
    bool node_153_hasUpstreamError : 1;
    bool node_154_isNodeDirty : 1;
    bool node_154_isOutputDirty_R : 1;
    bool node_154_hasUpstreamError : 1;
    bool node_155_isNodeDirty : 1;
    bool node_155_hasUpstreamError : 1;
    bool node_156_isNodeDirty : 1;
    bool node_156_hasUpstreamError : 1;
    bool node_157_isNodeDirty : 1;
    bool node_157_isOutputDirty_MEM : 1;
    bool node_157_hasUpstreamError : 1;
    bool node_158_isNodeDirty : 1;
    bool node_158_isOutputDirty_OUT : 1;
    bool node_158_hasUpstreamError : 1;
    bool node_159_isNodeDirty : 1;
    bool node_159_isOutputDirty_OUT : 1;
    bool node_159_hasUpstreamError : 1;
    bool node_160_isNodeDirty : 1;
    bool node_160_isOutputDirty_OUT : 1;
    bool node_160_hasUpstreamError : 1;
    bool node_161_isNodeDirty : 1;
    bool node_161_isOutputDirty_OUT : 1;
    bool node_161_hasUpstreamError : 1;
    bool node_162_isNodeDirty : 1;
    bool node_162_isOutputDirty_OUT : 1;
    bool node_162_hasUpstreamError : 1;
    bool node_163_isNodeDirty : 1;
    bool node_163_isOutputDirty_R : 1;
    bool node_163_hasUpstreamError : 1;
    bool node_164_isNodeDirty : 1;
    bool node_164_isOutputDirty_T : 1;
    bool node_164_isOutputDirty_F : 1;
    bool node_164_hasUpstreamError : 1;
    bool node_165_isNodeDirty : 1;
    bool node_165_isOutputDirty_OUT : 1;
    bool node_165_hasUpstreamError : 1;
    bool node_166_isNodeDirty : 1;
    bool node_166_hasUpstreamError : 1;
    bool node_167_isNodeDirty : 1;
    bool node_167_hasUpstreamError : 1;
    bool node_168_isNodeDirty : 1;
    bool node_168_isOutputDirty_OUT : 1;
    bool node_168_hasUpstreamError : 1;
    bool node_169_isNodeDirty : 1;
    bool node_169_isOutputDirty_OUT : 1;
    bool node_169_hasUpstreamError : 1;
    bool node_170_isNodeDirty : 1;
    bool node_170_isOutputDirty_OUT : 1;
    bool node_170_hasUpstreamError : 1;
    bool node_171_isNodeDirty : 1;
    bool node_171_isOutputDirty_OUT : 1;
    bool node_171_hasUpstreamError : 1;
    bool node_172_isNodeDirty : 1;
    bool node_172_isOutputDirty_OUT : 1;
    bool node_172_hasUpstreamError : 1;
    bool node_173_isNodeDirty : 1;
    bool node_173_isOutputDirty_MEM : 1;
    bool node_173_hasUpstreamError : 1;
    bool node_174_isNodeDirty : 1;
    bool node_174_hasUpstreamError : 1;
    bool node_175_isNodeDirty : 1;
    bool node_175_isOutputDirty_OUT : 1;
    bool node_175_hasUpstreamError : 1;
    bool node_176_isNodeDirty : 1;
    bool node_176_hasUpstreamError : 1;
    bool node_177_isNodeDirty : 1;
    bool node_177_isOutputDirty_OUT : 1;
    bool node_177_hasUpstreamError : 1;
    bool node_178_isNodeDirty : 1;
    bool node_178_isOutputDirty_OUT : 1;
    bool node_178_hasUpstreamError : 1;
    bool node_179_isNodeDirty : 1;
    bool node_179_isOutputDirty_OUT : 1;
    bool node_179_hasUpstreamError : 1;
    bool node_180_isNodeDirty : 1;
    bool node_180_isOutputDirty_MEM : 1;
    bool node_180_hasUpstreamError : 1;
    bool node_181_isNodeDirty : 1;
    bool node_181_isOutputDirty_OUT : 1;
    bool node_181_hasUpstreamError : 1;
    bool node_182_isNodeDirty : 1;
    bool node_182_isOutputDirty_OUT : 1;
    bool node_182_hasUpstreamError : 1;
    bool node_183_isNodeDirty : 1;
    bool node_183_isOutputDirty_DEVU0027 : 1;
    bool node_183_isOutputDirty_DONE : 1;
    bool node_183_hasUpstreamError : 1;
    bool node_184_isNodeDirty : 1;
    bool node_184_isOutputDirty_OUT : 1;
    bool node_184_hasUpstreamError : 1;
    bool node_185_isNodeDirty : 1;
    bool node_185_isOutputDirty_R : 1;
    bool node_185_hasUpstreamError : 1;
    bool node_186_isNodeDirty : 1;
    bool node_186_isOutputDirty_OUT : 1;
    bool node_186_hasUpstreamError : 1;
    bool node_187_isNodeDirty : 1;
    bool node_187_isOutputDirty_OUT : 1;
    bool node_187_hasUpstreamError : 1;
    bool node_188_isNodeDirty : 1;
    bool node_188_isOutputDirty_OUT : 1;
    bool node_188_hasUpstreamError : 1;
    bool node_189_isNodeDirty : 1;
    bool node_189_isOutputDirty_OUT : 1;
    bool node_189_hasUpstreamError : 1;
    bool node_190_isNodeDirty : 1;
    bool node_190_isOutputDirty_OUT : 1;
    bool node_190_hasUpstreamError : 1;
    bool node_191_isNodeDirty : 1;
    bool node_191_hasUpstreamError : 1;
    bool node_192_isNodeDirty : 1;
    bool node_192_isOutputDirty_OUT : 1;
    bool node_192_hasUpstreamError : 1;
    bool node_193_isNodeDirty : 1;
    bool node_193_isOutputDirty_OUT : 1;
    bool node_193_hasUpstreamError : 1;
    bool node_194_isNodeDirty : 1;
    bool node_194_isOutputDirty_OUT : 1;
    bool node_194_hasUpstreamError : 1;
    bool node_195_isNodeDirty : 1;
    bool node_195_hasUpstreamError : 1;
    bool node_196_isNodeDirty : 1;
    bool node_196_isOutputDirty_DONE : 1;
    bool node_196_hasUpstreamError : 1;
    bool node_197_isNodeDirty : 1;
    bool node_197_isOutputDirty_OUT : 1;
    bool node_197_hasUpstreamError : 1;
    bool node_198_isNodeDirty : 1;
    bool node_198_hasUpstreamError : 1;
    bool node_199_isNodeDirty : 1;
    bool node_199_isOutputDirty_OUT : 1;
    bool node_199_hasUpstreamError : 1;
    bool node_200_isNodeDirty : 1;
    bool node_200_isOutputDirty_OUT : 1;
    bool node_200_hasUpstreamError : 1;
    bool node_201_isNodeDirty : 1;
    bool node_201_hasUpstreamError : 1;
    bool node_202_isNodeDirty : 1;
    bool node_202_isOutputDirty_OUT : 1;
    bool node_202_hasUpstreamError : 1;
    bool node_203_isNodeDirty : 1;
    bool node_203_isOutputDirty_OUT : 1;
    bool node_203_hasUpstreamError : 1;
    bool node_204_isNodeDirty : 1;
    bool node_204_isOutputDirty_OUT : 1;
    bool node_204_hasUpstreamError : 1;
    TransactionState() {
        node_79_isNodeDirty = true;
        node_79_isOutputDirty_TICK = false;
        node_80_isNodeDirty = true;
        node_80_isOutputDirty_BOOT = false;
        node_81_isNodeDirty = true;
        node_82_isNodeDirty = true;
        node_82_isOutputDirty_OUT = false;
        node_83_isNodeDirty = true;
        node_83_isOutputDirty_DEV = true;
        node_84_isNodeDirty = true;
        node_85_isNodeDirty = true;
        node_86_isNodeDirty = true;
        node_86_isOutputDirty_OUT = false;
        node_87_isNodeDirty = true;
        node_87_isOutputDirty_OUT = false;
        node_88_isNodeDirty = true;
        node_88_isOutputDirty_OUT = false;
        node_89_isNodeDirty = true;
        node_89_isOutputDirty_OUT = false;
        node_90_isNodeDirty = true;
        node_90_isOutputDirty_OUT = false;
        node_91_isNodeDirty = true;
        node_91_isOutputDirty_OUT = false;
        node_92_isNodeDirty = true;
        node_92_isOutputDirty_OUT = false;
        node_93_isNodeDirty = true;
        node_93_isOutputDirty_VAL = true;
        node_94_isNodeDirty = true;
        node_94_isOutputDirty_SIG = true;
        node_95_isNodeDirty = true;
        node_95_isOutputDirty_VAL = true;
        node_96_isNodeDirty = true;
        node_96_isOutputDirty_SIG = true;
        node_97_isNodeDirty = true;
        node_97_isOutputDirty_VAL = true;
        node_98_isNodeDirty = true;
        node_99_isNodeDirty = true;
        node_99_isOutputDirty_OUT = false;
        node_100_isNodeDirty = true;
        node_101_isNodeDirty = true;
        node_102_isNodeDirty = true;
        node_103_isNodeDirty = true;
        node_104_isNodeDirty = true;
        node_104_isOutputDirty_OUT = false;
        node_105_isNodeDirty = true;
        node_106_isNodeDirty = true;
        node_107_isNodeDirty = true;
        node_108_isNodeDirty = true;
        node_109_isNodeDirty = true;
        node_109_isOutputDirty_OUT = true;
        node_110_isNodeDirty = true;
        node_111_isNodeDirty = true;
        node_112_isNodeDirty = true;
        node_113_isNodeDirty = true;
        node_113_isOutputDirty_OUT = true;
        node_114_isNodeDirty = true;
        node_114_isOutputDirty_OUT = false;
        node_115_isNodeDirty = true;
        node_116_isNodeDirty = true;
        node_117_isNodeDirty = true;
        node_118_isNodeDirty = true;
        node_118_isOutputDirty_OUT = false;
        node_119_isNodeDirty = true;
        node_120_isNodeDirty = true;
        node_121_isNodeDirty = true;
        node_122_isNodeDirty = true;
        node_122_isOutputDirty_OUT = false;
        node_123_isNodeDirty = true;
        node_123_isOutputDirty_DEVU0027 = true;
        node_123_isOutputDirty_DONE = false;
        node_124_isNodeDirty = true;
        node_125_isNodeDirty = true;
        node_125_isOutputDirty_OUT = false;
        node_126_isNodeDirty = true;
        node_127_isNodeDirty = true;
        node_127_isOutputDirty_OUT = false;
        node_128_isNodeDirty = true;
        node_128_isOutputDirty_OUT = false;
        node_129_isNodeDirty = true;
        node_129_isOutputDirty_MEM = true;
        node_130_isNodeDirty = true;
        node_130_isOutputDirty_OUT = false;
        node_131_isNodeDirty = true;
        node_132_isNodeDirty = true;
        node_132_isOutputDirty_OUT = false;
        node_133_isNodeDirty = true;
        node_134_isNodeDirty = true;
        node_134_isOutputDirty_OUT = false;
        node_135_isNodeDirty = true;
        node_135_isOutputDirty_MEM = true;
        node_136_isNodeDirty = true;
        node_137_isNodeDirty = true;
        node_137_isOutputDirty_TICK = false;
        node_138_isNodeDirty = true;
        node_139_isNodeDirty = true;
        node_139_isOutputDirty_TICK = false;
        node_140_isNodeDirty = true;
        node_140_isOutputDirty_OUT = false;
        node_141_isNodeDirty = true;
        node_142_isNodeDirty = true;
        node_142_isOutputDirty_TICK = false;
        node_143_isNodeDirty = true;
        node_143_isOutputDirty_OUT = false;
        node_144_isNodeDirty = true;
        node_144_isOutputDirty_MEM = true;
        node_145_isNodeDirty = true;
        node_145_isOutputDirty_OUT = true;
        node_146_isNodeDirty = true;
        node_146_isOutputDirty_MEM = true;
        node_147_isNodeDirty = true;
        node_148_isNodeDirty = true;
        node_148_isOutputDirty_OUT = true;
        node_149_isNodeDirty = true;
        node_149_isOutputDirty_OUT = false;
        node_150_isNodeDirty = true;
        node_150_isOutputDirty_OUT = true;
        node_151_isNodeDirty = true;
        node_152_isNodeDirty = true;
        node_153_isNodeDirty = true;
        node_153_isOutputDirty_OUT = false;
        node_154_isNodeDirty = true;
        node_155_isNodeDirty = true;
        node_156_isNodeDirty = true;
        node_157_isNodeDirty = true;
        node_157_isOutputDirty_MEM = true;
        node_158_isNodeDirty = true;
        node_159_isNodeDirty = true;
        node_159_isOutputDirty_OUT = false;
        node_160_isNodeDirty = true;
        node_161_isNodeDirty = true;
        node_162_isNodeDirty = true;
        node_162_isOutputDirty_OUT = false;
        node_163_isNodeDirty = true;
        node_164_isNodeDirty = true;
        node_164_isOutputDirty_T = false;
        node_164_isOutputDirty_F = false;
        node_165_isNodeDirty = true;
        node_165_isOutputDirty_OUT = false;
        node_166_isNodeDirty = true;
        node_167_isNodeDirty = true;
        node_168_isNodeDirty = true;
        node_168_isOutputDirty_OUT = false;
        node_169_isNodeDirty = true;
        node_170_isNodeDirty = true;
        node_170_isOutputDirty_OUT = false;
        node_171_isNodeDirty = true;
        node_171_isOutputDirty_OUT = true;
        node_172_isNodeDirty = true;
        node_172_isOutputDirty_OUT = false;
        node_173_isNodeDirty = true;
        node_173_isOutputDirty_MEM = true;
        node_174_isNodeDirty = true;
        node_175_isNodeDirty = true;
        node_175_isOutputDirty_OUT = false;
        node_176_isNodeDirty = true;
        node_177_isNodeDirty = true;
        node_177_isOutputDirty_OUT = false;
        node_178_isNodeDirty = true;
        node_178_isOutputDirty_OUT = false;
        node_179_isNodeDirty = true;
        node_179_isOutputDirty_OUT = false;
        node_180_isNodeDirty = true;
        node_180_isOutputDirty_MEM = true;
        node_181_isNodeDirty = true;
        node_181_isOutputDirty_OUT = false;
        node_182_isNodeDirty = true;
        node_182_isOutputDirty_OUT = false;
        node_183_isNodeDirty = true;
        node_183_isOutputDirty_DEVU0027 = true;
        node_183_isOutputDirty_DONE = false;
        node_184_isNodeDirty = true;
        node_184_isOutputDirty_OUT = false;
        node_185_isNodeDirty = true;
        node_186_isNodeDirty = true;
        node_186_isOutputDirty_OUT = false;
        node_187_isNodeDirty = true;
        node_187_isOutputDirty_OUT = false;
        node_188_isNodeDirty = true;
        node_188_isOutputDirty_OUT = false;
        node_189_isNodeDirty = true;
        node_189_isOutputDirty_OUT = false;
        node_190_isNodeDirty = true;
        node_191_isNodeDirty = true;
        node_192_isNodeDirty = true;
        node_192_isOutputDirty_OUT = false;
        node_193_isNodeDirty = true;
        node_193_isOutputDirty_OUT = false;
        node_194_isNodeDirty = true;
        node_194_isOutputDirty_OUT = false;
        node_195_isNodeDirty = true;
        node_196_isNodeDirty = true;
        node_196_isOutputDirty_DONE = false;
        node_197_isNodeDirty = true;
        node_197_isOutputDirty_OUT = false;
        node_198_isNodeDirty = true;
        node_199_isNodeDirty = true;
        node_199_isOutputDirty_OUT = false;
        node_200_isNodeDirty = true;
        node_200_isOutputDirty_OUT = false;
        node_201_isNodeDirty = true;
        node_202_isNodeDirty = true;
        node_202_isOutputDirty_OUT = true;
        node_203_isNodeDirty = true;
        node_203_isOutputDirty_OUT = false;
        node_204_isNodeDirty = true;
        node_204_isOutputDirty_OUT = true;
    }
};

TransactionState g_transaction;

xod__core__continuously::Node node_79 = {
    0, // timeoutAt
    xod__core__continuously::State() // state default
};
xod__core__boot::Node node_80 = {
    xod__core__boot::State() // state default
};
xod__core__multiply::Node node_81 = {
    node_81_output_OUT, // output OUT default
    xod__core__multiply::State() // state default
};
xod__core__pulse_on_change__boolean::Node node_82 = {
    xod__core__pulse_on_change__boolean::State() // state default
};
xod_dev__text_lcd__text_lcd_i2c_device::Node node_83 = {
    false, // DEV has no errors on start
    node_83_output_DEV, // output DEV default
    xod_dev__text_lcd__text_lcd_i2c_device::State() // state default
};
xod__core__divide::Node node_84 = {
    node_84_output_OUT, // output OUT default
    xod__core__divide::State() // state default
};
xod_dev__servo__servo_device::Node node_85 = {
    false, // DEV has no errors on start
    node_85_output_DEV, // output DEV default
    xod_dev__servo__servo_device::State() // state default
};
xod__core__cast_to_pulse__boolean::Node node_86 = {
    xod__core__cast_to_pulse__boolean::State() // state default
};
xod__core__cast_to_pulse__boolean::Node node_87 = {
    xod__core__cast_to_pulse__boolean::State() // state default
};
xod__core__cast_to_pulse__boolean::Node node_88 = {
    xod__core__cast_to_pulse__boolean::State() // state default
};
xod__core__cast_to_pulse__boolean::Node node_89 = {
    xod__core__cast_to_pulse__boolean::State() // state default
};
xod__core__cast_to_pulse__boolean::Node node_90 = {
    xod__core__cast_to_pulse__boolean::State() // state default
};
xod__core__cast_to_pulse__boolean::Node node_91 = {
    xod__core__cast_to_pulse__boolean::State() // state default
};
xod__core__cast_to_pulse__boolean::Node node_92 = {
    xod__core__cast_to_pulse__boolean::State() // state default
};
xod__gpio__analog_read::Node node_93 = {
    false, // VAL has no errors on start
    false, // DONE has no errors on start
    node_93_output_VAL, // output VAL default
    xod__gpio__analog_read::State() // state default
};
xod__gpio__digital_read_pullup::Node node_94 = {
    false, // SIG has no errors on start
    false, // DONE has no errors on start
    node_94_output_SIG, // output SIG default
    xod__gpio__digital_read_pullup::State() // state default
};
xod__gpio__analog_read::Node node_95 = {
    false, // VAL has no errors on start
    false, // DONE has no errors on start
    node_95_output_VAL, // output VAL default
    xod__gpio__analog_read::State() // state default
};
xod__gpio__digital_read_pullup::Node node_96 = {
    false, // SIG has no errors on start
    false, // DONE has no errors on start
    node_96_output_SIG, // output SIG default
    xod__gpio__digital_read_pullup::State() // state default
};
xod__gpio__analog_read::Node node_97 = {
    false, // VAL has no errors on start
    false, // DONE has no errors on start
    node_97_output_VAL, // output VAL default
    xod__gpio__analog_read::State() // state default
};
xod__core__subtract::Node node_98 = {
    node_98_output_OUT, // output OUT default
    xod__core__subtract::State() // state default
};
xod__core__any::Node node_99 = {
    xod__core__any::State() // state default
};
xod__math__map::Node node_100 = {
    node_100_output_OUT, // output OUT default
    xod__math__map::State() // state default
};
xod__core__not::Node node_101 = {
    node_101_output_OUT, // output OUT default
    xod__core__not::State() // state default
};
xod__math__map::Node node_102 = {
    node_102_output_OUT, // output OUT default
    xod__math__map::State() // state default
};
xod__core__not::Node node_103 = {
    node_103_output_OUT, // output OUT default
    xod__core__not::State() // state default
};
xod__core__any::Node node_104 = {
    xod__core__any::State() // state default
};
xod__core__less::Node node_105 = {
    node_105_output_OUT, // output OUT default
    xod__core__less::State() // state default
};
xod__core__less::Node node_106 = {
    node_106_output_OUT, // output OUT default
    xod__core__less::State() // state default
};
xod__core__less::Node node_107 = {
    node_107_output_OUT, // output OUT default
    xod__core__less::State() // state default
};
xod__core__cast_to_string__number::Node node_108 = {
    node_108_output_OUT, // output OUT default
    xod__core__cast_to_string__number::State() // state default
};
xod__core__debounce__boolean::Node node_109 = {
    0, // timeoutAt
    node_109_output_OUT, // output OUT default
    xod__core__debounce__boolean::State() // state default
};
xod__core__less::Node node_110 = {
    node_110_output_OUT, // output OUT default
    xod__core__less::State() // state default
};
xod__core__greater::Node node_111 = {
    node_111_output_OUT, // output OUT default
    xod__core__greater::State() // state default
};
xod__core__cast_to_string__number::Node node_112 = {
    node_112_output_OUT, // output OUT default
    xod__core__cast_to_string__number::State() // state default
};
xod__core__debounce__boolean::Node node_113 = {
    0, // timeoutAt
    node_113_output_OUT, // output OUT default
    xod__core__debounce__boolean::State() // state default
};
xod__core__gate__pulse::Node node_114 = {
    xod__core__gate__pulse::State() // state default
};
xod__core__if_else__number::Node node_115 = {
    node_115_output_R, // output R default
    xod__core__if_else__number::State() // state default
};
xod__core__if_else__number::Node node_116 = {
    node_116_output_R, // output R default
    xod__core__if_else__number::State() // state default
};
xod__core__concat::Node node_117 = {
    node_117_output_OUT, // output OUT default
    xod__core__concat::State() // state default
};
xod__core__pulse_on_true::Node node_118 = {
    xod__core__pulse_on_true::State() // state default
};
xod__core__not::Node node_119 = {
    node_119_output_OUT, // output OUT default
    xod__core__not::State() // state default
};
xod__core__and::Node node_120 = {
    node_120_output_OUT, // output OUT default
    xod__core__and::State() // state default
};
xod__core__if_else__string::Node node_121 = {
    node_121_output_R, // output R default
    xod__core__if_else__string::State() // state default
};
xod__core__cast_to_pulse__boolean::Node node_122 = {
    xod__core__cast_to_pulse__boolean::State() // state default
};
xod_dev__text_lcd__set_backlight::Node node_123 = {
    node_123_output_DEVU0027, // output DEVU0027 default
    xod_dev__text_lcd__set_backlight::State() // state default
};
xod__math__cube::Node node_124 = {
    node_124_output_OUT, // output OUT default
    xod__math__cube::State() // state default
};
xod__core__pulse_on_change__number::Node node_125 = {
    xod__core__pulse_on_change__number::State() // state default
};
xod__core__concat::Node node_126 = {
    node_126_output_OUT, // output OUT default
    xod__core__concat::State() // state default
};
xod__core__any::Node node_127 = {
    xod__core__any::State() // state default
};
xod__core__pulse_on_true::Node node_128 = {
    xod__core__pulse_on_true::State() // state default
};
xod__core__flip_flop::Node node_129 = {
    node_129_output_MEM, // output MEM default
    xod__core__flip_flop::State() // state default
};
xod__core__any::Node node_130 = {
    xod__core__any::State() // state default
};
xod__core__concat::Node node_131 = {
    node_131_output_OUT, // output OUT default
    xod__core__concat::State() // state default
};
xod__core__any::Node node_132 = {
    xod__core__any::State() // state default
};
xod__core__or::Node node_133 = {
    node_133_output_OUT, // output OUT default
    xod__core__or::State() // state default
};
xod__core__any::Node node_134 = {
    xod__core__any::State() // state default
};
xod__core__flip_flop::Node node_135 = {
    node_135_output_MEM, // output MEM default
    xod__core__flip_flop::State() // state default
};
xod__core__not::Node node_136 = {
    node_136_output_OUT, // output OUT default
    xod__core__not::State() // state default
};
xod__core__clock::Node node_137 = {
    0, // timeoutAt
    xod__core__clock::State() // state default
};
xod__core__if_else__string::Node node_138 = {
    node_138_output_R, // output R default
    xod__core__if_else__string::State() // state default
};
xod__core__clock::Node node_139 = {
    0, // timeoutAt
    xod__core__clock::State() // state default
};
xod__core__gate__pulse::Node node_140 = {
    xod__core__gate__pulse::State() // state default
};
xod__core__if_else__number::Node node_141 = {
    node_141_output_R, // output R default
    xod__core__if_else__number::State() // state default
};
xod__core__clock::Node node_142 = {
    0, // timeoutAt
    xod__core__clock::State() // state default
};
xod__core__pulse_on_true::Node node_143 = {
    xod__core__pulse_on_true::State() // state default
};
xod__core__flip_flop::Node node_144 = {
    node_144_output_MEM, // output MEM default
    xod__core__flip_flop::State() // state default
};
xod__core__if_error__string::Node node_145 = {
    false, // OUT has no errors on start
    node_145_output_OUT, // output OUT default
    xod__core__if_error__string::State() // state default
};
xod__core__flip_flop::Node node_146 = {
    node_146_output_MEM, // output MEM default
    xod__core__flip_flop::State() // state default
};
xod__gpio__pwm_write::Node node_147 = {
    false, // DONE has no errors on start
    xod__gpio__pwm_write::State() // state default
};
xod__core__count::Node node_148 = {
    node_148_output_OUT, // output OUT default
    xod__core__count::State() // state default
};
xod__core__any::Node node_149 = {
    xod__core__any::State() // state default
};
xod__core__square_wave::Node node_150 = {
    0, // timeoutAt
    node_150_output_OUT, // output OUT default
    node_150_output_N, // output N default
    xod__core__square_wave::State() // state default
};
xod__core__and::Node node_151 = {
    node_151_output_OUT, // output OUT default
    xod__core__and::State() // state default
};
xod__core__not::Node node_152 = {
    node_152_output_OUT, // output OUT default
    xod__core__not::State() // state default
};
xod__core__pulse_on_change__string::Node node_153 = {
    xod__core__pulse_on_change__string::State() // state default
};
xod__core__if_else__string::Node node_154 = {
    node_154_output_R, // output R default
    xod__core__if_else__string::State() // state default
};
xod__core__if_else__number::Node node_155 = {
    node_155_output_R, // output R default
    xod__core__if_else__number::State() // state default
};
xod__core__less::Node node_156 = {
    node_156_output_OUT, // output OUT default
    xod__core__less::State() // state default
};
xod__core__buffer__number::Node node_157 = {
    node_157_output_MEM, // output MEM default
    xod__core__buffer__number::State() // state default
};
xod__core__not::Node node_158 = {
    node_158_output_OUT, // output OUT default
    xod__core__not::State() // state default
};
xod__core__cast_to_pulse__boolean::Node node_159 = {
    xod__core__cast_to_pulse__boolean::State() // state default
};
xod__core__cast_to_number__boolean::Node node_160 = {
    node_160_output_OUT, // output OUT default
    xod__core__cast_to_number__boolean::State() // state default
};
xod__core__and::Node node_161 = {
    node_161_output_OUT, // output OUT default
    xod__core__and::State() // state default
};
xod__core__any::Node node_162 = {
    xod__core__any::State() // state default
};
xod__core__if_else__string::Node node_163 = {
    node_163_output_R, // output R default
    xod__core__if_else__string::State() // state default
};
xod__core__branch::Node node_164 = {
    xod__core__branch::State() // state default
};
xod__core__cast_to_pulse__boolean::Node node_165 = {
    xod__core__cast_to_pulse__boolean::State() // state default
};
____play_note::Node node_166 = {
    ____play_note::State() // state default
};
xod__math__cube::Node node_167 = {
    node_167_output_OUT, // output OUT default
    xod__math__cube::State() // state default
};
xod__core__pulse_on_change__number::Node node_168 = {
    xod__core__pulse_on_change__number::State() // state default
};
xod__core__cast_to_number__boolean::Node node_169 = {
    node_169_output_OUT, // output OUT default
    xod__core__cast_to_number__boolean::State() // state default
};
xod__core__any::Node node_170 = {
    xod__core__any::State() // state default
};
xod__core__if_error__string::Node node_171 = {
    false, // OUT has no errors on start
    node_171_output_OUT, // output OUT default
    xod__core__if_error__string::State() // state default
};
xod__core__any::Node node_172 = {
    xod__core__any::State() // state default
};
xod__core__flip_flop::Node node_173 = {
    node_173_output_MEM, // output MEM default
    xod__core__flip_flop::State() // state default
};
____play_note::Node node_174 = {
    ____play_note::State() // state default
};
xod__core__any::Node node_175 = {
    xod__core__any::State() // state default
};
xod__math__cube::Node node_176 = {
    node_176_output_OUT, // output OUT default
    xod__math__cube::State() // state default
};
xod__core__pulse_on_change__number::Node node_177 = {
    xod__core__pulse_on_change__number::State() // state default
};
xod__core__gate__pulse::Node node_178 = {
    xod__core__gate__pulse::State() // state default
};
xod__core__pulse_on_change__string::Node node_179 = {
    xod__core__pulse_on_change__string::State() // state default
};
xod__core__buffer__number::Node node_180 = {
    node_180_output_MEM, // output MEM default
    xod__core__buffer__number::State() // state default
};
xod__core__any::Node node_181 = {
    xod__core__any::State() // state default
};
xod__core__any::Node node_182 = {
    xod__core__any::State() // state default
};
xod_dev__text_lcd__print_at__text_lcd_i2c_device::Node node_183 = {
    false, // DEVU0027 has no errors on start
    false, // DONE has no errors on start
    node_183_output_DEVU0027, // output DEVU0027 default
    xod_dev__text_lcd__print_at__text_lcd_i2c_device::State() // state default
};
xod__core__any::Node node_184 = {
    xod__core__any::State() // state default
};
xod__core__if_else__number::Node node_185 = {
    node_185_output_R, // output R default
    xod__core__if_else__number::State() // state default
};
xod__core__gate__pulse::Node node_186 = {
    xod__core__gate__pulse::State() // state default
};
xod__core__any::Node node_187 = {
    xod__core__any::State() // state default
};
xod__core__any::Node node_188 = {
    xod__core__any::State() // state default
};
xod__core__any::Node node_189 = {
    xod__core__any::State() // state default
};
xod__math__map::Node node_190 = {
    node_190_output_OUT, // output OUT default
    xod__math__map::State() // state default
};
xod__gpio__pwm_write::Node node_191 = {
    false, // DONE has no errors on start
    xod__gpio__pwm_write::State() // state default
};
xod__core__gate__pulse::Node node_192 = {
    xod__core__gate__pulse::State() // state default
};
xod__core__gate__pulse::Node node_193 = {
    xod__core__gate__pulse::State() // state default
};
xod__core__pulse_on_change__number::Node node_194 = {
    xod__core__pulse_on_change__number::State() // state default
};
xod__gpio__pwm_write::Node node_195 = {
    false, // DONE has no errors on start
    xod__gpio__pwm_write::State() // state default
};
xod_dev__text_lcd__print_at__text_lcd_i2c_device::Node node_196 = {
    false, // DEVU0027 has no errors on start
    false, // DONE has no errors on start
    node_196_output_DEVU0027, // output DEVU0027 default
    xod_dev__text_lcd__print_at__text_lcd_i2c_device::State() // state default
};
xod__core__any::Node node_197 = {
    xod__core__any::State() // state default
};
xod__core__any::Node node_198 = {
    xod__core__any::State() // state default
};
xod__core__any::Node node_199 = {
    xod__core__any::State() // state default
};
xod__core__gate__pulse::Node node_200 = {
    xod__core__gate__pulse::State() // state default
};
xod_dev__servo__rotate::Node node_201 = {
    node_201_output_DEVU0027, // output DEVU0027 default
    xod_dev__servo__rotate::State() // state default
};
xod__core__defer__number::Node node_202 = {
    false, // OUT has no errors on start
    0, // timeoutAt
    node_202_output_OUT, // output OUT default
    xod__core__defer__number::State() // state default
};
xod__core__defer__pulse::Node node_203 = {
    false, // OUT has no errors on start
    0, // timeoutAt
    xod__core__defer__pulse::State() // state default
};
xod__core__defer__number::Node node_204 = {
    false, // OUT has no errors on start
    0, // timeoutAt
    node_204_output_OUT, // output OUT default
    xod__core__defer__number::State() // state default
};

#if defined(XOD_DEBUG) || defined(XOD_SIMULATION)
namespace detail {
void handleDebugProtocolMessages() {
    bool rewindToEol = true;

    if (
      XOD_DEBUG_SERIAL.available() > 0 &&
      XOD_DEBUG_SERIAL.find("+XOD:", 5)
    ) {
        int tweakedNodeId = XOD_DEBUG_SERIAL.parseInt();

        switch (tweakedNodeId) {
        }

        if (rewindToEol)
            XOD_DEBUG_SERIAL.find('\n');
    }
}
} // namespace detail
#endif

void handleDefers() {
    {
        if (g_transaction.node_202_isNodeDirty) {
            bool error_input_IN = false;
            error_input_IN |= node_94.errors.output_SIG;
            error_input_IN |= node_203.errors.output_OUT;
            error_input_IN |= node_93.errors.output_VAL;

            XOD_TRACE_F("Trigger defer node #");
            XOD_TRACE_LN(202);

            xod__core__defer__number::ContextObject ctxObj;
            ctxObj._node = &node_202;

            ctxObj._input_IN = node_157.output_MEM;

            ctxObj._error_input_IN = error_input_IN;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__defer__number::NodeErrors previousErrors = node_202.errors;

            xod__core__defer__number::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_202_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            if (previousErrors.flags != node_202.errors.flags) {
                detail::printErrorToDebugSerial(202, node_202.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_202.errors.output_OUT != previousErrors.output_OUT) {
                    g_transaction.node_202_isNodeDirty = true;
                    g_transaction.node_204_isNodeDirty = true;
                }

            }

            // mark downstream nodes dirty
            g_transaction.node_107_isNodeDirty |= g_transaction.node_202_isOutputDirty_OUT;
            g_transaction.node_116_isNodeDirty |= g_transaction.node_202_isOutputDirty_OUT;

            g_transaction.node_202_isNodeDirty = false;
            detail::clearTimeout(&node_202);
        }

        // propagate the error hold by the defer node
        if (node_202.errors.flags) {
            if (node_202.errors.output_OUT) {
                g_transaction.node_107_hasUpstreamError = true;
                g_transaction.node_116_hasUpstreamError = true;
            }
        }
    }
    {
        if (g_transaction.node_203_isNodeDirty) {
            bool error_input_IN = false;
            error_input_IN |= node_94.errors.output_SIG;

            XOD_TRACE_F("Trigger defer node #");
            XOD_TRACE_LN(203);

            xod__core__defer__pulse::ContextObject ctxObj;
            ctxObj._node = &node_203;
            ctxObj._isInputDirty_IN = false;

            ctxObj._error_input_IN = error_input_IN;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__defer__pulse::NodeErrors previousErrors = node_203.errors;

            node_203.errors.output_OUT = false;

            xod__core__defer__pulse::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_203_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            if (previousErrors.flags != node_203.errors.flags) {
                detail::printErrorToDebugSerial(203, node_203.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_203.errors.output_OUT != previousErrors.output_OUT) {
                    g_transaction.node_202_isNodeDirty = true;
                    g_transaction.node_204_isNodeDirty = true;
                    g_transaction.node_203_isNodeDirty = true;
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
                if (previousErrors.output_OUT && !node_203.errors.output_OUT) {
                    g_transaction.node_132_isNodeDirty = true;
                }
            }

            // mark downstream nodes dirty
            g_transaction.node_132_isNodeDirty |= g_transaction.node_203_isOutputDirty_OUT;

            g_transaction.node_203_isNodeDirty = false;
            detail::clearTimeout(&node_203);
        }

        // propagate the error hold by the defer node
        if (node_203.errors.flags) {
            if (node_203.errors.output_OUT) {
                g_transaction.node_132_hasUpstreamError = true;
            }
        }
    }
    {
        if (g_transaction.node_204_isNodeDirty) {
            bool error_input_IN = false;
            error_input_IN |= node_94.errors.output_SIG;
            error_input_IN |= node_203.errors.output_OUT;
            error_input_IN |= node_93.errors.output_VAL;
            error_input_IN |= node_202.errors.output_OUT;

            XOD_TRACE_F("Trigger defer node #");
            XOD_TRACE_LN(204);

            xod__core__defer__number::ContextObject ctxObj;
            ctxObj._node = &node_204;

            ctxObj._input_IN = node_180.output_MEM;

            ctxObj._error_input_IN = error_input_IN;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__defer__number::NodeErrors previousErrors = node_204.errors;

            xod__core__defer__number::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_204_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            if (previousErrors.flags != node_204.errors.flags) {
                detail::printErrorToDebugSerial(204, node_204.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_204.errors.output_OUT != previousErrors.output_OUT) {
                    g_transaction.node_204_isNodeDirty = true;
                }

            }

            // mark downstream nodes dirty
            g_transaction.node_155_isNodeDirty |= g_transaction.node_204_isOutputDirty_OUT;

            g_transaction.node_204_isNodeDirty = false;
            detail::clearTimeout(&node_204);
        }

        // propagate the error hold by the defer node
        if (node_204.errors.flags) {
            if (node_204.errors.output_OUT) {
                g_transaction.node_155_hasUpstreamError = true;
            }
        }
    }
}

void runTransaction() {
    g_transactionTime = millis();

    XOD_TRACE_F("Transaction started, t=");
    XOD_TRACE_LN(g_transactionTime);

#if defined(XOD_DEBUG) || defined(XOD_SIMULATION)
    detail::handleDebugProtocolMessages();
#endif

    // Check for timeouts
    g_transaction.node_79_isNodeDirty |= detail::isTimedOut(&node_79);
    g_transaction.node_109_isNodeDirty |= detail::isTimedOut(&node_109);
    g_transaction.node_113_isNodeDirty |= detail::isTimedOut(&node_113);
    g_transaction.node_137_isNodeDirty |= detail::isTimedOut(&node_137);
    g_transaction.node_139_isNodeDirty |= detail::isTimedOut(&node_139);
    g_transaction.node_142_isNodeDirty |= detail::isTimedOut(&node_142);
    g_transaction.node_150_isNodeDirty |= detail::isTimedOut(&node_150);
    g_transaction.node_202_isNodeDirty |= detail::isTimedOut(&node_202);
    g_transaction.node_203_isNodeDirty |= detail::isTimedOut(&node_203);
    g_transaction.node_204_isNodeDirty |= detail::isTimedOut(&node_204);

    // defer-* nodes are always at the very bottom of the graph, so no one will
    // recieve values emitted by them. We must evaluate them before everybody
    // else to give them a chance to emit values.
    //
    // If trigerred, keep only output dirty, not the node itself, so it will
    // evaluate on the regular pass only if it receives a new value again.
    if (!isSettingUp()) {
        g_isEarlyDeferPass = true;
        handleDefers();
        g_isEarlyDeferPass = false;
    }

    // Evaluate all dirty nodes
    { // xod__core__continuously #79
        if (g_transaction.node_79_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(79);

            xod__core__continuously::ContextObject ctxObj;
            ctxObj._node = &node_79;

            // copy data from upstream nodes into context

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_TICK = false;

            xod__core__continuously::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_79_isOutputDirty_TICK = ctxObj._isOutputDirty_TICK;

            // mark downstream nodes dirty
            g_transaction.node_93_isNodeDirty |= g_transaction.node_79_isOutputDirty_TICK;
            g_transaction.node_94_isNodeDirty |= g_transaction.node_79_isOutputDirty_TICK;
            g_transaction.node_95_isNodeDirty |= g_transaction.node_79_isOutputDirty_TICK;
            g_transaction.node_96_isNodeDirty |= g_transaction.node_79_isOutputDirty_TICK;
            g_transaction.node_97_isNodeDirty |= g_transaction.node_79_isOutputDirty_TICK;
        }

    }
    { // xod__core__boot #80
        if (g_transaction.node_80_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(80);

            xod__core__boot::ContextObject ctxObj;
            ctxObj._node = &node_80;

            // copy data from upstream nodes into context

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_BOOT = false;

            xod__core__boot::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_80_isOutputDirty_BOOT = ctxObj._isOutputDirty_BOOT;

            // mark downstream nodes dirty
            g_transaction.node_99_isNodeDirty |= g_transaction.node_80_isOutputDirty_BOOT;
            g_transaction.node_127_isNodeDirty |= g_transaction.node_80_isOutputDirty_BOOT;
            g_transaction.node_130_isNodeDirty |= g_transaction.node_80_isOutputDirty_BOOT;
            g_transaction.node_162_isNodeDirty |= g_transaction.node_80_isOutputDirty_BOOT;
            g_transaction.node_175_isNodeDirty |= g_transaction.node_80_isOutputDirty_BOOT;
            g_transaction.node_182_isNodeDirty |= g_transaction.node_80_isOutputDirty_BOOT;
            g_transaction.node_184_isNodeDirty |= g_transaction.node_80_isOutputDirty_BOOT;
            g_transaction.node_197_isNodeDirty |= g_transaction.node_80_isOutputDirty_BOOT;
        }

    }
    { // xod__core__multiply #81
        if (g_transaction.node_81_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(81);

            xod__core__multiply::ContextObject ctxObj;
            ctxObj._node = &node_81;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_17_output_VAL;
            ctxObj._input_IN2 = node_18_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__multiply::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_98_isNodeDirty = true;
            g_transaction.node_166_isNodeDirty = true;
        }

    }
    { // xod__core__pulse_on_change__boolean #82
        if (g_transaction.node_82_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(82);

            xod__core__pulse_on_change__boolean::ContextObject ctxObj;
            ctxObj._node = &node_82;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_35_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__pulse_on_change__boolean::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_82_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_99_isNodeDirty |= g_transaction.node_82_isOutputDirty_OUT;
        }

    }
    { // xod_dev__text_lcd__text_lcd_i2c_device #83
        if (g_transaction.node_83_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(83);

            xod_dev__text_lcd__text_lcd_i2c_device::ContextObject ctxObj;
            ctxObj._node = &node_83;

            // copy data from upstream nodes into context
            ctxObj._input_ADDR = node_41_output_VAL;
            ctxObj._input_COLS = node_42_output_VAL;
            ctxObj._input_ROWS = node_43_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DEV = false;

            xod_dev__text_lcd__text_lcd_i2c_device::NodeErrors previousErrors = node_83.errors;

            xod_dev__text_lcd__text_lcd_i2c_device::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_83_isOutputDirty_DEV = ctxObj._isOutputDirty_DEV;

            if (previousErrors.flags != node_83.errors.flags) {
                detail::printErrorToDebugSerial(83, node_83.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_83.errors.output_DEV != previousErrors.output_DEV) {
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
            }

            // mark downstream nodes dirty
            g_transaction.node_123_isNodeDirty |= g_transaction.node_83_isOutputDirty_DEV;
        }

        // propagate errors hold by the node outputs
        if (node_83.errors.flags) {
            if (node_83.errors.output_DEV) {
                g_transaction.node_123_hasUpstreamError = true;
            }
        }
    }
    { // xod__core__divide #84
        if (g_transaction.node_84_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(84);

            xod__core__divide::ContextObject ctxObj;
            ctxObj._node = &node_84;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_60_output_VAL;
            ctxObj._input_IN2 = node_61_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__divide::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_148_isNodeDirty = true;
        }

    }
    { // xod_dev__servo__servo_device #85
        if (g_transaction.node_85_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(85);

            xod_dev__servo__servo_device::ContextObject ctxObj;
            ctxObj._node = &node_85;

            // copy data from upstream nodes into context
            ctxObj._input_PORT = node_68_output_VAL;
            ctxObj._input_Pmin = node_69_output_VAL;
            ctxObj._input_Pmax = node_70_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DEV = false;

            xod_dev__servo__servo_device::NodeErrors previousErrors = node_85.errors;

            xod_dev__servo__servo_device::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            if (previousErrors.flags != node_85.errors.flags) {
                detail::printErrorToDebugSerial(85, node_85.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_85.errors.output_DEV != previousErrors.output_DEV) {
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
            }

            // mark downstream nodes dirty
        }

        // propagate errors hold by the node outputs
        if (node_85.errors.flags) {
            if (node_85.errors.output_DEV) {
                g_transaction.node_201_hasUpstreamError = true;
            }
        }
    }
    { // xod__core__cast_to_pulse__boolean #86
        if (g_transaction.node_86_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(86);

            xod__core__cast_to_pulse__boolean::ContextObject ctxObj;
            ctxObj._node = &node_86;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_72_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__cast_to_pulse__boolean::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_86_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_187_isNodeDirty |= g_transaction.node_86_isOutputDirty_OUT;
        }

    }
    { // xod__core__cast_to_pulse__boolean #87
        if (g_transaction.node_87_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(87);

            xod__core__cast_to_pulse__boolean::ContextObject ctxObj;
            ctxObj._node = &node_87;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_73_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__cast_to_pulse__boolean::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_87_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_181_isNodeDirty |= g_transaction.node_87_isOutputDirty_OUT;
        }

    }
    { // xod__core__cast_to_pulse__boolean #88
        if (g_transaction.node_88_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(88);

            xod__core__cast_to_pulse__boolean::ContextObject ctxObj;
            ctxObj._node = &node_88;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_74_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__cast_to_pulse__boolean::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_88_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_104_isNodeDirty |= g_transaction.node_88_isOutputDirty_OUT;
        }

    }
    { // xod__core__cast_to_pulse__boolean #89
        if (g_transaction.node_89_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(89);

            xod__core__cast_to_pulse__boolean::ContextObject ctxObj;
            ctxObj._node = &node_89;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_75_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__cast_to_pulse__boolean::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_89_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_170_isNodeDirty |= g_transaction.node_89_isOutputDirty_OUT;
        }

    }
    { // xod__core__cast_to_pulse__boolean #90
        if (g_transaction.node_90_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(90);

            xod__core__cast_to_pulse__boolean::ContextObject ctxObj;
            ctxObj._node = &node_90;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_76_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__cast_to_pulse__boolean::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_90_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_189_isNodeDirty |= g_transaction.node_90_isOutputDirty_OUT;
        }

    }
    { // xod__core__cast_to_pulse__boolean #91
        if (g_transaction.node_91_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(91);

            xod__core__cast_to_pulse__boolean::ContextObject ctxObj;
            ctxObj._node = &node_91;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_77_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__cast_to_pulse__boolean::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_91_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_134_isNodeDirty |= g_transaction.node_91_isOutputDirty_OUT;
        }

    }
    { // xod__core__cast_to_pulse__boolean #92
        if (g_transaction.node_92_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(92);

            xod__core__cast_to_pulse__boolean::ContextObject ctxObj;
            ctxObj._node = &node_92;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_78_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__cast_to_pulse__boolean::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_92_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_199_isNodeDirty |= g_transaction.node_92_isOutputDirty_OUT;
        }

    }
    { // xod__gpio__analog_read #93
        if (g_transaction.node_93_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(93);

            xod__gpio__analog_read::ContextObject ctxObj;
            ctxObj._node = &node_93;

            // copy data from upstream nodes into context
            ctxObj._input_PORT = node_5_output_VAL;

            ctxObj._isInputDirty_UPD = g_transaction.node_79_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_VAL = false;
            ctxObj._isOutputDirty_DONE = false;

            xod__gpio__analog_read::NodeErrors previousErrors = node_93.errors;

            node_93.errors.output_DONE = false;

            xod__gpio__analog_read::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_93_isOutputDirty_VAL = ctxObj._isOutputDirty_VAL;

            if (previousErrors.flags != node_93.errors.flags) {
                detail::printErrorToDebugSerial(93, node_93.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_93.errors.output_VAL != previousErrors.output_VAL) {
                    g_transaction.node_145_isNodeDirty = true;
                    g_transaction.node_171_isNodeDirty = true;
                    g_transaction.node_202_isNodeDirty = true;
                    g_transaction.node_204_isNodeDirty = true;
                }
                if (node_93.errors.output_DONE != previousErrors.output_DONE) {
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
                if (previousErrors.output_DONE && !node_93.errors.output_DONE) {
                }
            }

            // mark downstream nodes dirty
            g_transaction.node_100_isNodeDirty |= g_transaction.node_93_isOutputDirty_VAL;
        }

        // propagate errors hold by the node outputs
        if (node_93.errors.flags) {
            if (node_93.errors.output_VAL) {
                g_transaction.node_100_hasUpstreamError = true;
            }
            if (node_93.errors.output_DONE) {
            }
        }
    }
    { // xod__gpio__digital_read_pullup #94
        if (g_transaction.node_94_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(94);

            xod__gpio__digital_read_pullup::ContextObject ctxObj;
            ctxObj._node = &node_94;

            // copy data from upstream nodes into context
            ctxObj._input_PORT = node_7_output_VAL;

            ctxObj._isInputDirty_UPD = g_transaction.node_79_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_SIG = false;
            ctxObj._isOutputDirty_DONE = false;

            xod__gpio__digital_read_pullup::NodeErrors previousErrors = node_94.errors;

            node_94.errors.output_DONE = false;

            xod__gpio__digital_read_pullup::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_94_isOutputDirty_SIG = ctxObj._isOutputDirty_SIG;

            if (previousErrors.flags != node_94.errors.flags) {
                detail::printErrorToDebugSerial(94, node_94.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_94.errors.output_SIG != previousErrors.output_SIG) {
                    g_transaction.node_202_isNodeDirty = true;
                    g_transaction.node_204_isNodeDirty = true;
                    g_transaction.node_203_isNodeDirty = true;
                }
                if (node_94.errors.output_DONE != previousErrors.output_DONE) {
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
                if (previousErrors.output_DONE && !node_94.errors.output_DONE) {
                }
            }

            // mark downstream nodes dirty
            g_transaction.node_101_isNodeDirty |= g_transaction.node_94_isOutputDirty_SIG;
        }

        // propagate errors hold by the node outputs
        if (node_94.errors.flags) {
            if (node_94.errors.output_SIG) {
                g_transaction.node_101_hasUpstreamError = true;
            }
            if (node_94.errors.output_DONE) {
            }
        }
    }
    { // xod__gpio__analog_read #95
        if (g_transaction.node_95_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(95);

            xod__gpio__analog_read::ContextObject ctxObj;
            ctxObj._node = &node_95;

            // copy data from upstream nodes into context
            ctxObj._input_PORT = node_13_output_VAL;

            ctxObj._isInputDirty_UPD = g_transaction.node_79_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_VAL = false;
            ctxObj._isOutputDirty_DONE = false;

            xod__gpio__analog_read::NodeErrors previousErrors = node_95.errors;

            node_95.errors.output_DONE = false;

            xod__gpio__analog_read::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_95_isOutputDirty_VAL = ctxObj._isOutputDirty_VAL;

            if (previousErrors.flags != node_95.errors.flags) {
                detail::printErrorToDebugSerial(95, node_95.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_95.errors.output_VAL != previousErrors.output_VAL) {
                    g_transaction.node_145_isNodeDirty = true;
                    g_transaction.node_171_isNodeDirty = true;
                }
                if (node_95.errors.output_DONE != previousErrors.output_DONE) {
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
                if (previousErrors.output_DONE && !node_95.errors.output_DONE) {
                }
            }

            // mark downstream nodes dirty
            g_transaction.node_102_isNodeDirty |= g_transaction.node_95_isOutputDirty_VAL;
        }

        // propagate errors hold by the node outputs
        if (node_95.errors.flags) {
            if (node_95.errors.output_VAL) {
                g_transaction.node_102_hasUpstreamError = true;
            }
            if (node_95.errors.output_DONE) {
            }
        }
    }
    { // xod__gpio__digital_read_pullup #96
        if (g_transaction.node_96_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(96);

            xod__gpio__digital_read_pullup::ContextObject ctxObj;
            ctxObj._node = &node_96;

            // copy data from upstream nodes into context
            ctxObj._input_PORT = node_30_output_VAL;

            ctxObj._isInputDirty_UPD = g_transaction.node_79_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_SIG = false;
            ctxObj._isOutputDirty_DONE = false;

            xod__gpio__digital_read_pullup::NodeErrors previousErrors = node_96.errors;

            node_96.errors.output_DONE = false;

            xod__gpio__digital_read_pullup::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_96_isOutputDirty_SIG = ctxObj._isOutputDirty_SIG;

            if (previousErrors.flags != node_96.errors.flags) {
                detail::printErrorToDebugSerial(96, node_96.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_96.errors.output_SIG != previousErrors.output_SIG) {
                    g_transaction.node_145_isNodeDirty = true;
                    g_transaction.node_171_isNodeDirty = true;
                }
                if (node_96.errors.output_DONE != previousErrors.output_DONE) {
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
                if (previousErrors.output_DONE && !node_96.errors.output_DONE) {
                }
            }

            // mark downstream nodes dirty
            g_transaction.node_103_isNodeDirty |= g_transaction.node_96_isOutputDirty_SIG;
        }

        // propagate errors hold by the node outputs
        if (node_96.errors.flags) {
            if (node_96.errors.output_SIG) {
                g_transaction.node_103_hasUpstreamError = true;
            }
            if (node_96.errors.output_DONE) {
            }
        }
    }
    { // xod__gpio__analog_read #97
        if (g_transaction.node_97_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(97);

            xod__gpio__analog_read::ContextObject ctxObj;
            ctxObj._node = &node_97;

            // copy data from upstream nodes into context
            ctxObj._input_PORT = node_31_output_VAL;

            ctxObj._isInputDirty_UPD = g_transaction.node_79_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_VAL = false;
            ctxObj._isOutputDirty_DONE = false;

            xod__gpio__analog_read::NodeErrors previousErrors = node_97.errors;

            node_97.errors.output_DONE = false;

            xod__gpio__analog_read::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_97_isOutputDirty_VAL = ctxObj._isOutputDirty_VAL;

            if (previousErrors.flags != node_97.errors.flags) {
                detail::printErrorToDebugSerial(97, node_97.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_97.errors.output_VAL != previousErrors.output_VAL) {
                }
                if (node_97.errors.output_DONE != previousErrors.output_DONE) {
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
                if (previousErrors.output_DONE && !node_97.errors.output_DONE) {
                }
            }

            // mark downstream nodes dirty
            g_transaction.node_115_isNodeDirty |= g_transaction.node_97_isOutputDirty_VAL;
        }

        // propagate errors hold by the node outputs
        if (node_97.errors.flags) {
            if (node_97.errors.output_VAL) {
                g_transaction.node_115_hasUpstreamError = true;
            }
            if (node_97.errors.output_DONE) {
            }
        }
    }
    { // xod__core__subtract #98
        if (g_transaction.node_98_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(98);

            xod__core__subtract::ContextObject ctxObj;
            ctxObj._node = &node_98;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_21_output_VAL;
            ctxObj._input_IN2 = node_81.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__subtract::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_174_isNodeDirty = true;
        }

    }
    { // xod__core__any #99
        if (g_transaction.node_99_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(99);

            xod__core__any::ContextObject ctxObj;
            ctxObj._node = &node_99;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_82_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_80_isOutputDirty_BOOT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__any::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_99_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_104_isNodeDirty |= g_transaction.node_99_isOutputDirty_OUT;
        }

    }
    { // xod__math__map #100

        if (g_transaction.node_100_hasUpstreamError) {
            g_transaction.node_105_hasUpstreamError = true;
            g_transaction.node_106_hasUpstreamError = true;
            g_transaction.node_107_hasUpstreamError = true;
            g_transaction.node_108_hasUpstreamError = true;
            g_transaction.node_116_hasUpstreamError = true;
        } else if (g_transaction.node_100_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(100);

            xod__math__map::ContextObject ctxObj;
            ctxObj._node = &node_100;

            // copy data from upstream nodes into context
            ctxObj._input_X = node_93.output_VAL;
            ctxObj._input_Smin = node_1_output_VAL;
            ctxObj._input_Smax = node_2_output_VAL;
            ctxObj._input_Tmin = node_3_output_VAL;
            ctxObj._input_Tmax = node_4_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__math__map::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_105_isNodeDirty = true;
            g_transaction.node_106_isNodeDirty = true;
            g_transaction.node_107_isNodeDirty = true;
            g_transaction.node_108_isNodeDirty = true;
            g_transaction.node_116_isNodeDirty = true;
        }

    }
    { // xod__core__not #101

        if (g_transaction.node_101_hasUpstreamError) {
            g_transaction.node_109_hasUpstreamError = true;
        } else if (g_transaction.node_101_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(101);

            xod__core__not::ContextObject ctxObj;
            ctxObj._node = &node_101;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_94.output_SIG;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__not::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_109_isNodeDirty = true;
        }

    }
    { // xod__math__map #102

        if (g_transaction.node_102_hasUpstreamError) {
            g_transaction.node_110_hasUpstreamError = true;
            g_transaction.node_111_hasUpstreamError = true;
            g_transaction.node_112_hasUpstreamError = true;
        } else if (g_transaction.node_102_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(102);

            xod__math__map::ContextObject ctxObj;
            ctxObj._node = &node_102;

            // copy data from upstream nodes into context
            ctxObj._input_X = node_95.output_VAL;
            ctxObj._input_Smin = node_9_output_VAL;
            ctxObj._input_Smax = node_10_output_VAL;
            ctxObj._input_Tmin = node_11_output_VAL;
            ctxObj._input_Tmax = node_12_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__math__map::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_110_isNodeDirty = true;
            g_transaction.node_111_isNodeDirty = true;
            g_transaction.node_112_isNodeDirty = true;
        }

    }
    { // xod__core__not #103

        if (g_transaction.node_103_hasUpstreamError) {
            g_transaction.node_113_hasUpstreamError = true;
        } else if (g_transaction.node_103_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(103);

            xod__core__not::ContextObject ctxObj;
            ctxObj._node = &node_103;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_96.output_SIG;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__not::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_113_isNodeDirty = true;
        }

    }
    { // xod__core__any #104
        if (g_transaction.node_104_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(104);

            xod__core__any::ContextObject ctxObj;
            ctxObj._node = &node_104;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_99_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_88_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__any::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_104_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_114_isNodeDirty |= g_transaction.node_104_isOutputDirty_OUT;
        }

    }
    { // xod__core__less #105

        if (g_transaction.node_105_hasUpstreamError) {
            g_transaction.node_115_hasUpstreamError = true;
        } else if (g_transaction.node_105_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(105);

            xod__core__less::ContextObject ctxObj;
            ctxObj._node = &node_105;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_100.output_OUT;
            ctxObj._input_IN2 = node_8_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__less::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_115_isNodeDirty = true;
        }

    }
    { // xod__core__less #106

        if (g_transaction.node_106_hasUpstreamError) {
            g_transaction.node_120_hasUpstreamError = true;
        } else if (g_transaction.node_106_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(106);

            xod__core__less::ContextObject ctxObj;
            ctxObj._node = &node_106;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_100.output_OUT;
            ctxObj._input_IN2 = node_32_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__less::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_120_isNodeDirty = true;
        }

    }
    { // xod__core__less #107

        if (g_transaction.node_107_hasUpstreamError) {
            g_transaction.node_116_hasUpstreamError = true;
            g_transaction.node_155_hasUpstreamError = true;
        } else if (g_transaction.node_107_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(107);

            xod__core__less::ContextObject ctxObj;
            ctxObj._node = &node_107;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_202.output_OUT;
            ctxObj._input_IN2 = node_100.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__less::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_116_isNodeDirty = true;
            g_transaction.node_155_isNodeDirty = true;
        }

    }
    { // xod__core__cast_to_string__number #108

        if (g_transaction.node_108_hasUpstreamError) {
            g_transaction.node_117_hasUpstreamError = true;
        } else if (g_transaction.node_108_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(108);

            xod__core__cast_to_string__number::ContextObject ctxObj;
            ctxObj._node = &node_108;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_100.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__cast_to_string__number::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_117_isNodeDirty = true;
        }

    }
    { // xod__core__debounce__boolean #109

        if (g_transaction.node_109_hasUpstreamError) {
            g_transaction.node_118_hasUpstreamError = true;
            g_transaction.node_119_hasUpstreamError = true;
        } else if (g_transaction.node_109_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(109);

            xod__core__debounce__boolean::ContextObject ctxObj;
            ctxObj._node = &node_109;

            // copy data from upstream nodes into context
            ctxObj._input_ST = node_101.output_OUT;
            ctxObj._input_Ts = node_6_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__debounce__boolean::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_109_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_118_isNodeDirty |= g_transaction.node_109_isOutputDirty_OUT;
            g_transaction.node_119_isNodeDirty |= g_transaction.node_109_isOutputDirty_OUT;
        }

    }
    { // xod__core__less #110

        if (g_transaction.node_110_hasUpstreamError) {
            g_transaction.node_120_hasUpstreamError = true;
        } else if (g_transaction.node_110_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(110);

            xod__core__less::ContextObject ctxObj;
            ctxObj._node = &node_110;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_102.output_OUT;
            ctxObj._input_IN2 = node_14_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__less::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_120_isNodeDirty = true;
        }

    }
    { // xod__core__greater #111

        if (g_transaction.node_111_hasUpstreamError) {
            g_transaction.node_121_hasUpstreamError = true;
        } else if (g_transaction.node_111_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(111);

            xod__core__greater::ContextObject ctxObj;
            ctxObj._node = &node_111;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_102.output_OUT;
            ctxObj._input_IN2 = node_50_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__greater::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_121_isNodeDirty = true;
        }

    }
    { // xod__core__cast_to_string__number #112

        if (g_transaction.node_112_hasUpstreamError) {
            g_transaction.node_131_hasUpstreamError = true;
        } else if (g_transaction.node_112_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(112);

            xod__core__cast_to_string__number::ContextObject ctxObj;
            ctxObj._node = &node_112;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_102.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__cast_to_string__number::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_131_isNodeDirty = true;
        }

    }
    { // xod__core__debounce__boolean #113

        if (g_transaction.node_113_hasUpstreamError) {
            g_transaction.node_122_hasUpstreamError = true;
        } else if (g_transaction.node_113_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(113);

            xod__core__debounce__boolean::ContextObject ctxObj;
            ctxObj._node = &node_113;

            // copy data from upstream nodes into context
            ctxObj._input_ST = node_103.output_OUT;
            ctxObj._input_Ts = node_29_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__debounce__boolean::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_113_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_122_isNodeDirty |= g_transaction.node_113_isOutputDirty_OUT;
        }

    }
    { // xod__core__gate__pulse #114
        if (g_transaction.node_114_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(114);

            xod__core__gate__pulse::ContextObject ctxObj;
            ctxObj._node = &node_114;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_34_output_VAL;

            ctxObj._isInputDirty_IN = g_transaction.node_104_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__gate__pulse::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_114_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_123_isNodeDirty |= g_transaction.node_114_isOutputDirty_OUT;
        }

    }
    { // xod__core__if_else__number #115

        if (g_transaction.node_115_hasUpstreamError) {
            g_transaction.node_124_hasUpstreamError = true;
            g_transaction.node_125_hasUpstreamError = true;
        } else if (g_transaction.node_115_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(115);

            xod__core__if_else__number::ContextObject ctxObj;
            ctxObj._node = &node_115;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_105.output_OUT;
            ctxObj._input_T = node_97.output_VAL;
            ctxObj._input_F = node_0_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__if_else__number::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_124_isNodeDirty = true;
            g_transaction.node_125_isNodeDirty = true;
        }

    }
    { // xod__core__if_else__number #116

        if (g_transaction.node_116_hasUpstreamError) {
            g_transaction.node_141_hasUpstreamError = true;
        } else if (g_transaction.node_116_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(116);

            xod__core__if_else__number::ContextObject ctxObj;
            ctxObj._node = &node_116;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_107.output_OUT;
            ctxObj._input_T = node_100.output_OUT;
            ctxObj._input_F = node_202.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__if_else__number::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_141_isNodeDirty = true;
        }

    }
    { // xod__core__concat #117

        if (g_transaction.node_117_hasUpstreamError) {
            g_transaction.node_126_hasUpstreamError = true;
        } else if (g_transaction.node_117_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(117);

            xod__core__concat::ContextObject ctxObj;
            ctxObj._node = &node_117;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_53_output_VAL;
            ctxObj._input_IN2 = node_108.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__concat::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_126_isNodeDirty = true;
        }

    }
    { // xod__core__pulse_on_true #118

        if (g_transaction.node_118_hasUpstreamError) {
            g_transaction.node_127_hasUpstreamError = true;
        } else if (g_transaction.node_118_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(118);

            xod__core__pulse_on_true::ContextObject ctxObj;
            ctxObj._node = &node_118;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_109.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__pulse_on_true::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_118_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_127_isNodeDirty |= g_transaction.node_118_isOutputDirty_OUT;
        }

    }
    { // xod__core__not #119

        if (g_transaction.node_119_hasUpstreamError) {
            g_transaction.node_128_hasUpstreamError = true;
        } else if (g_transaction.node_119_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(119);

            xod__core__not::ContextObject ctxObj;
            ctxObj._node = &node_119;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_109.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__not::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_128_isNodeDirty = true;
        }

    }
    { // xod__core__and #120

        if (g_transaction.node_120_hasUpstreamError) {
            g_transaction.node_133_hasUpstreamError = true;
        } else if (g_transaction.node_120_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(120);

            xod__core__and::ContextObject ctxObj;
            ctxObj._node = &node_120;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_110.output_OUT;
            ctxObj._input_IN2 = node_106.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__and::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_133_isNodeDirty = true;
        }

    }
    { // xod__core__if_else__string #121

        if (g_transaction.node_121_hasUpstreamError) {
            g_transaction.node_138_hasUpstreamError = true;
        } else if (g_transaction.node_121_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(121);

            xod__core__if_else__string::ContextObject ctxObj;
            ctxObj._node = &node_121;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_111.output_OUT;
            ctxObj._input_T = node_51_output_VAL;
            ctxObj._input_F = node_52_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__if_else__string::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_138_isNodeDirty = true;
        }

    }
    { // xod__core__cast_to_pulse__boolean #122

        if (g_transaction.node_122_hasUpstreamError) {
            g_transaction.node_129_hasUpstreamError = true;
        } else if (g_transaction.node_122_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(122);

            xod__core__cast_to_pulse__boolean::ContextObject ctxObj;
            ctxObj._node = &node_122;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_113.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__cast_to_pulse__boolean::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_122_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_129_isNodeDirty |= g_transaction.node_122_isOutputDirty_OUT;
        }

    }
    { // xod_dev__text_lcd__set_backlight #123

        if (g_transaction.node_123_hasUpstreamError) {
            g_transaction.node_183_hasUpstreamError = true;
            g_transaction.node_188_hasUpstreamError = true;
        } else if (g_transaction.node_123_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(123);

            xod_dev__text_lcd__set_backlight::ContextObject ctxObj;
            ctxObj._node = &node_123;

            // copy data from upstream nodes into context
            ctxObj._input_DEV = node_83.output_DEV;
            ctxObj._input_BL = node_48_output_VAL;

            ctxObj._isInputDirty_DO = g_transaction.node_114_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DEVU0027 = false;
            ctxObj._isOutputDirty_DONE = false;

            xod_dev__text_lcd__set_backlight::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_123_isOutputDirty_DEVU0027 = ctxObj._isOutputDirty_DEVU0027;
            g_transaction.node_123_isOutputDirty_DONE = ctxObj._isOutputDirty_DONE;

            // mark downstream nodes dirty
            g_transaction.node_183_isNodeDirty |= g_transaction.node_123_isOutputDirty_DEVU0027;
            g_transaction.node_188_isNodeDirty |= g_transaction.node_123_isOutputDirty_DONE;
        }

    }
    { // xod__math__cube #124

        if (g_transaction.node_124_hasUpstreamError) {
            g_transaction.node_147_hasUpstreamError = true;
        } else if (g_transaction.node_124_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(124);

            xod__math__cube::ContextObject ctxObj;
            ctxObj._node = &node_124;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_115.output_R;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__math__cube::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__pulse_on_change__number #125

        if (g_transaction.node_125_hasUpstreamError) {
            g_transaction.node_130_hasUpstreamError = true;
        } else if (g_transaction.node_125_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(125);

            xod__core__pulse_on_change__number::ContextObject ctxObj;
            ctxObj._node = &node_125;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_115.output_R;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__pulse_on_change__number::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_125_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_130_isNodeDirty |= g_transaction.node_125_isOutputDirty_OUT;
        }

    }
    { // xod__core__concat #126

        if (g_transaction.node_126_hasUpstreamError) {
            g_transaction.node_131_hasUpstreamError = true;
        } else if (g_transaction.node_126_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(126);

            xod__core__concat::ContextObject ctxObj;
            ctxObj._node = &node_126;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_117.output_OUT;
            ctxObj._input_IN2 = node_54_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__concat::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_131_isNodeDirty = true;
        }

    }
    { // xod__core__any #127

        if (g_transaction.node_127_hasUpstreamError) {
            g_transaction.node_132_hasUpstreamError = true;
            g_transaction.node_142_hasUpstreamError = true;
            g_transaction.node_148_hasUpstreamError = true;
            g_transaction.node_149_hasUpstreamError = true;
            g_transaction.node_172_hasUpstreamError = true;
            g_transaction.node_173_hasUpstreamError = true;
        } else if (g_transaction.node_127_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(127);

            xod__core__any::ContextObject ctxObj;
            ctxObj._node = &node_127;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_118_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_80_isOutputDirty_BOOT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__any::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_127_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_132_isNodeDirty |= g_transaction.node_127_isOutputDirty_OUT;
            g_transaction.node_142_isNodeDirty |= g_transaction.node_127_isOutputDirty_OUT;
            g_transaction.node_148_isNodeDirty |= g_transaction.node_127_isOutputDirty_OUT;
            g_transaction.node_149_isNodeDirty |= g_transaction.node_127_isOutputDirty_OUT;
            g_transaction.node_172_isNodeDirty |= g_transaction.node_127_isOutputDirty_OUT;
            g_transaction.node_173_isNodeDirty |= g_transaction.node_127_isOutputDirty_OUT;
        }

    }
    { // xod__core__pulse_on_true #128

        if (g_transaction.node_128_hasUpstreamError) {
            g_transaction.node_135_hasUpstreamError = true;
        } else if (g_transaction.node_128_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(128);

            xod__core__pulse_on_true::ContextObject ctxObj;
            ctxObj._node = &node_128;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_119.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__pulse_on_true::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_128_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_135_isNodeDirty |= g_transaction.node_128_isOutputDirty_OUT;
        }

    }
    { // xod__core__flip_flop #129

        if (g_transaction.node_129_hasUpstreamError) {
            g_transaction.node_133_hasUpstreamError = true;
        } else if (g_transaction.node_129_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(129);

            xod__core__flip_flop::ContextObject ctxObj;
            ctxObj._node = &node_129;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_SET = false;
            ctxObj._isInputDirty_RST = false;
            ctxObj._isInputDirty_TGL = g_transaction.node_122_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_MEM = false;

            xod__core__flip_flop::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_129_isOutputDirty_MEM = ctxObj._isOutputDirty_MEM;

            // mark downstream nodes dirty
            g_transaction.node_133_isNodeDirty |= g_transaction.node_129_isOutputDirty_MEM;
        }

    }
    { // xod__core__any #130

        if (g_transaction.node_130_hasUpstreamError) {
            g_transaction.node_134_hasUpstreamError = true;
        } else if (g_transaction.node_130_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(130);

            xod__core__any::ContextObject ctxObj;
            ctxObj._node = &node_130;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_125_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_80_isOutputDirty_BOOT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__any::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_130_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_134_isNodeDirty |= g_transaction.node_130_isOutputDirty_OUT;
        }

    }
    { // xod__core__concat #131

        if (g_transaction.node_131_hasUpstreamError) {
            g_transaction.node_154_hasUpstreamError = true;
            g_transaction.node_163_hasUpstreamError = true;
        } else if (g_transaction.node_131_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(131);

            xod__core__concat::ContextObject ctxObj;
            ctxObj._node = &node_131;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_126.output_OUT;
            ctxObj._input_IN2 = node_112.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__concat::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_154_isNodeDirty = true;
            g_transaction.node_163_isNodeDirty = true;
        }

    }
    { // xod__core__any #132

        if (g_transaction.node_132_hasUpstreamError) {
            g_transaction.node_135_hasUpstreamError = true;
        } else if (g_transaction.node_132_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(132);

            xod__core__any::ContextObject ctxObj;
            ctxObj._node = &node_132;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_127_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_203_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__any::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_132_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_135_isNodeDirty |= g_transaction.node_132_isOutputDirty_OUT;
        }

    }
    { // xod__core__or #133

        if (g_transaction.node_133_hasUpstreamError) {
            g_transaction.node_136_hasUpstreamError = true;
            g_transaction.node_137_hasUpstreamError = true;
            g_transaction.node_138_hasUpstreamError = true;
            g_transaction.node_139_hasUpstreamError = true;
            g_transaction.node_150_hasUpstreamError = true;
            g_transaction.node_151_hasUpstreamError = true;
            g_transaction.node_161_hasUpstreamError = true;
            g_transaction.node_163_hasUpstreamError = true;
        } else if (g_transaction.node_133_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(133);

            xod__core__or::ContextObject ctxObj;
            ctxObj._node = &node_133;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_129.output_MEM;
            ctxObj._input_IN2 = node_120.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__or::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_136_isNodeDirty = true;
            g_transaction.node_137_isNodeDirty = true;
            g_transaction.node_138_isNodeDirty = true;
            g_transaction.node_139_isNodeDirty = true;
            g_transaction.node_150_isNodeDirty = true;
            g_transaction.node_151_isNodeDirty = true;
            g_transaction.node_161_isNodeDirty = true;
            g_transaction.node_163_isNodeDirty = true;
        }

    }
    { // xod__core__any #134

        if (g_transaction.node_134_hasUpstreamError) {
            g_transaction.node_140_hasUpstreamError = true;
        } else if (g_transaction.node_134_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(134);

            xod__core__any::ContextObject ctxObj;
            ctxObj._node = &node_134;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_130_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_91_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__any::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_134_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_140_isNodeDirty |= g_transaction.node_134_isOutputDirty_OUT;
        }

    }
    { // xod__core__flip_flop #135

        if (g_transaction.node_135_hasUpstreamError) {
            g_transaction.node_141_hasUpstreamError = true;
            g_transaction.node_142_hasUpstreamError = true;
        } else if (g_transaction.node_135_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(135);

            xod__core__flip_flop::ContextObject ctxObj;
            ctxObj._node = &node_135;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_SET = false;
            ctxObj._isInputDirty_TGL = g_transaction.node_128_isOutputDirty_OUT;
            ctxObj._isInputDirty_RST = g_transaction.node_132_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_MEM = false;

            xod__core__flip_flop::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_135_isOutputDirty_MEM = ctxObj._isOutputDirty_MEM;

            // mark downstream nodes dirty
            g_transaction.node_141_isNodeDirty |= g_transaction.node_135_isOutputDirty_MEM;
            g_transaction.node_142_isNodeDirty |= g_transaction.node_135_isOutputDirty_MEM;
        }

    }
    { // xod__core__not #136

        if (g_transaction.node_136_hasUpstreamError) {
            g_transaction.node_143_hasUpstreamError = true;
        } else if (g_transaction.node_136_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(136);

            xod__core__not::ContextObject ctxObj;
            ctxObj._node = &node_136;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_133.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__not::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_143_isNodeDirty = true;
        }

    }
    { // xod__core__clock #137

        if (g_transaction.node_137_hasUpstreamError) {
            g_transaction.node_144_hasUpstreamError = true;
        } else if (g_transaction.node_137_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(137);

            xod__core__clock::ContextObject ctxObj;
            ctxObj._node = &node_137;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_133.output_OUT;
            ctxObj._input_IVAL = node_28_output_VAL;

            ctxObj._isInputDirty_RST = false;
            ctxObj._isInputDirty_EN = true;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_TICK = false;

            xod__core__clock::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_137_isOutputDirty_TICK = ctxObj._isOutputDirty_TICK;

            // mark downstream nodes dirty
            g_transaction.node_144_isNodeDirty |= g_transaction.node_137_isOutputDirty_TICK;
        }

    }
    { // xod__core__if_else__string #138

        if (g_transaction.node_138_hasUpstreamError) {
            g_transaction.node_145_hasUpstreamError = true;
        } else if (g_transaction.node_138_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(138);

            xod__core__if_else__string::ContextObject ctxObj;
            ctxObj._node = &node_138;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_133.output_OUT;
            ctxObj._input_T = node_55_output_VAL;
            ctxObj._input_F = node_121.output_R;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__if_else__string::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_145_isNodeDirty = true;
        }

    }
    { // xod__core__clock #139

        if (g_transaction.node_139_hasUpstreamError) {
            g_transaction.node_146_hasUpstreamError = true;
        } else if (g_transaction.node_139_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(139);

            xod__core__clock::ContextObject ctxObj;
            ctxObj._node = &node_139;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_133.output_OUT;
            ctxObj._input_IVAL = node_56_output_VAL;

            ctxObj._isInputDirty_RST = false;
            ctxObj._isInputDirty_EN = true;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_TICK = false;

            xod__core__clock::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_139_isOutputDirty_TICK = ctxObj._isOutputDirty_TICK;

            // mark downstream nodes dirty
            g_transaction.node_146_isNodeDirty |= g_transaction.node_139_isOutputDirty_TICK;
        }

    }
    { // xod__core__gate__pulse #140

        if (g_transaction.node_140_hasUpstreamError) {
            g_transaction.node_147_hasUpstreamError = true;
        } else if (g_transaction.node_140_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(140);

            xod__core__gate__pulse::ContextObject ctxObj;
            ctxObj._node = &node_140;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_67_output_VAL;

            ctxObj._isInputDirty_IN = g_transaction.node_134_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__gate__pulse::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_140_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_147_isNodeDirty |= g_transaction.node_140_isOutputDirty_OUT;
        }

    }
    { // xod__core__if_else__number #141

        if (g_transaction.node_141_hasUpstreamError) {
            g_transaction.node_157_hasUpstreamError = true;
        } else if (g_transaction.node_141_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(141);

            xod__core__if_else__number::ContextObject ctxObj;
            ctxObj._node = &node_141;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_135.output_MEM;
            ctxObj._input_T = node_116.output_R;
            ctxObj._input_F = node_57_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__if_else__number::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__clock #142

        if (g_transaction.node_142_hasUpstreamError) {
            g_transaction.node_148_hasUpstreamError = true;
            g_transaction.node_149_hasUpstreamError = true;
            g_transaction.node_164_hasUpstreamError = true;
        } else if (g_transaction.node_142_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(142);

            xod__core__clock::ContextObject ctxObj;
            ctxObj._node = &node_142;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_135.output_MEM;
            ctxObj._input_IVAL = node_58_output_VAL;

            ctxObj._isInputDirty_EN = g_transaction.node_135_isOutputDirty_MEM;
            ctxObj._isInputDirty_RST = g_transaction.node_127_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_TICK = false;

            xod__core__clock::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_142_isOutputDirty_TICK = ctxObj._isOutputDirty_TICK;

            // mark downstream nodes dirty
            g_transaction.node_148_isNodeDirty |= g_transaction.node_142_isOutputDirty_TICK;
            g_transaction.node_149_isNodeDirty |= g_transaction.node_142_isOutputDirty_TICK;
            g_transaction.node_164_isNodeDirty |= g_transaction.node_142_isOutputDirty_TICK;
        }

    }
    { // xod__core__pulse_on_true #143

        if (g_transaction.node_143_hasUpstreamError) {
            g_transaction.node_150_hasUpstreamError = true;
        } else if (g_transaction.node_143_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(143);

            xod__core__pulse_on_true::ContextObject ctxObj;
            ctxObj._node = &node_143;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_136.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__pulse_on_true::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_143_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_150_isNodeDirty |= g_transaction.node_143_isOutputDirty_OUT;
        }

    }
    { // xod__core__flip_flop #144

        if (g_transaction.node_144_hasUpstreamError) {
            g_transaction.node_151_hasUpstreamError = true;
            g_transaction.node_152_hasUpstreamError = true;
        } else if (g_transaction.node_144_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(144);

            xod__core__flip_flop::ContextObject ctxObj;
            ctxObj._node = &node_144;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_SET = false;
            ctxObj._isInputDirty_RST = false;
            ctxObj._isInputDirty_TGL = g_transaction.node_137_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_MEM = false;

            xod__core__flip_flop::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_144_isOutputDirty_MEM = ctxObj._isOutputDirty_MEM;

            // mark downstream nodes dirty
            g_transaction.node_151_isNodeDirty |= g_transaction.node_144_isOutputDirty_MEM;
            g_transaction.node_152_isNodeDirty |= g_transaction.node_144_isOutputDirty_MEM;
        }

    }
    { // xod__core__if_error__string #145

        if (g_transaction.node_145_isNodeDirty) {
            bool error_input_IN = false;
            error_input_IN |= node_93.errors.output_VAL;
            error_input_IN |= node_95.errors.output_VAL;
            error_input_IN |= node_96.errors.output_SIG;
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(145);

            xod__core__if_error__string::ContextObject ctxObj;
            ctxObj._node = &node_145;

            ctxObj._error_input_IN = error_input_IN;
            ctxObj._error_input_DEF = 0;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_138.output_R;
            ctxObj._input_DEF = node_37_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__if_error__string::NodeErrors previousErrors = node_145.errors;

            xod__core__if_error__string::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_145_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            if (previousErrors.flags != node_145.errors.flags) {
                detail::printErrorToDebugSerial(145, node_145.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_145.errors.output_OUT != previousErrors.output_OUT) {
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
            }

            // mark downstream nodes dirty
            g_transaction.node_153_isNodeDirty |= g_transaction.node_145_isOutputDirty_OUT;
            g_transaction.node_183_isNodeDirty |= g_transaction.node_145_isOutputDirty_OUT;
        }

        // propagate errors hold by the node outputs
        if (node_145.errors.flags) {
            if (node_145.errors.output_OUT) {
                g_transaction.node_153_hasUpstreamError = true;
                g_transaction.node_183_hasUpstreamError = true;
            }
        }
    }
    { // xod__core__flip_flop #146

        if (g_transaction.node_146_hasUpstreamError) {
            g_transaction.node_154_hasUpstreamError = true;
        } else if (g_transaction.node_146_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(146);

            xod__core__flip_flop::ContextObject ctxObj;
            ctxObj._node = &node_146;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_SET = false;
            ctxObj._isInputDirty_RST = false;
            ctxObj._isInputDirty_TGL = g_transaction.node_139_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_MEM = false;

            xod__core__flip_flop::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_146_isOutputDirty_MEM = ctxObj._isOutputDirty_MEM;

            // mark downstream nodes dirty
            g_transaction.node_154_isNodeDirty |= g_transaction.node_146_isOutputDirty_MEM;
        }

    }
    { // xod__gpio__pwm_write #147

        if (g_transaction.node_147_hasUpstreamError) {
        } else if (g_transaction.node_147_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(147);

            xod__gpio__pwm_write::ContextObject ctxObj;
            ctxObj._node = &node_147;

            // copy data from upstream nodes into context
            ctxObj._input_PORT = node_66_output_VAL;
            ctxObj._input_DUTY = node_124.output_OUT;

            ctxObj._isInputDirty_UPD = g_transaction.node_140_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DONE = false;

            xod__gpio__pwm_write::NodeErrors previousErrors = node_147.errors;

            node_147.errors.output_DONE = false;

            xod__gpio__pwm_write::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            if (previousErrors.flags != node_147.errors.flags) {
                detail::printErrorToDebugSerial(147, node_147.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_147.errors.output_DONE != previousErrors.output_DONE) {
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
                if (previousErrors.output_DONE && !node_147.errors.output_DONE) {
                }
            }

            // mark downstream nodes dirty
        }

        // propagate errors hold by the node outputs
        if (node_147.errors.flags) {
            if (node_147.errors.output_DONE) {
            }
        }
    }
    { // xod__core__count #148

        if (g_transaction.node_148_hasUpstreamError) {
            g_transaction.node_155_hasUpstreamError = true;
            g_transaction.node_156_hasUpstreamError = true;
            g_transaction.node_185_hasUpstreamError = true;
        } else if (g_transaction.node_148_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(148);

            xod__core__count::ContextObject ctxObj;
            ctxObj._node = &node_148;

            // copy data from upstream nodes into context
            ctxObj._input_STEP = node_84.output_OUT;

            ctxObj._isInputDirty_INC = g_transaction.node_142_isOutputDirty_TICK;
            ctxObj._isInputDirty_RST = g_transaction.node_127_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__count::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_148_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_155_isNodeDirty |= g_transaction.node_148_isOutputDirty_OUT;
            g_transaction.node_156_isNodeDirty |= g_transaction.node_148_isOutputDirty_OUT;
            g_transaction.node_185_isNodeDirty |= g_transaction.node_148_isOutputDirty_OUT;
        }

    }
    { // xod__core__any #149

        if (g_transaction.node_149_hasUpstreamError) {
            g_transaction.node_157_hasUpstreamError = true;
        } else if (g_transaction.node_149_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(149);

            xod__core__any::ContextObject ctxObj;
            ctxObj._node = &node_149;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_127_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_142_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__any::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_149_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_157_isNodeDirty |= g_transaction.node_149_isOutputDirty_OUT;
        }

    }
    { // xod__core__square_wave #150

        if (g_transaction.node_150_hasUpstreamError) {
            g_transaction.node_158_hasUpstreamError = true;
            g_transaction.node_159_hasUpstreamError = true;
        } else if (g_transaction.node_150_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(150);

            xod__core__square_wave::ContextObject ctxObj;
            ctxObj._node = &node_150;

            // copy data from upstream nodes into context
            ctxObj._input_T = node_15_output_VAL;
            ctxObj._input_DUTY = node_16_output_VAL;
            ctxObj._input_EN = node_133.output_OUT;

            ctxObj._isInputDirty_RST = g_transaction.node_143_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;
            ctxObj._isOutputDirty_N = false;

            xod__core__square_wave::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_150_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_158_isNodeDirty |= g_transaction.node_150_isOutputDirty_OUT;
            g_transaction.node_159_isNodeDirty |= g_transaction.node_150_isOutputDirty_OUT;
        }

    }
    { // xod__core__and #151

        if (g_transaction.node_151_hasUpstreamError) {
            g_transaction.node_160_hasUpstreamError = true;
        } else if (g_transaction.node_151_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(151);

            xod__core__and::ContextObject ctxObj;
            ctxObj._node = &node_151;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_133.output_OUT;
            ctxObj._input_IN2 = node_144.output_MEM;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__and::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_160_isNodeDirty = true;
        }

    }
    { // xod__core__not #152

        if (g_transaction.node_152_hasUpstreamError) {
            g_transaction.node_161_hasUpstreamError = true;
        } else if (g_transaction.node_152_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(152);

            xod__core__not::ContextObject ctxObj;
            ctxObj._node = &node_152;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_144.output_MEM;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__not::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_161_isNodeDirty = true;
        }

    }
    { // xod__core__pulse_on_change__string #153

        if (g_transaction.node_153_hasUpstreamError) {
            g_transaction.node_162_hasUpstreamError = true;
        } else if (g_transaction.node_153_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(153);

            xod__core__pulse_on_change__string::ContextObject ctxObj;
            ctxObj._node = &node_153;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_145.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__pulse_on_change__string::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_153_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_162_isNodeDirty |= g_transaction.node_153_isOutputDirty_OUT;
        }

    }
    { // xod__core__if_else__string #154

        if (g_transaction.node_154_hasUpstreamError) {
            g_transaction.node_163_hasUpstreamError = true;
        } else if (g_transaction.node_154_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(154);

            xod__core__if_else__string::ContextObject ctxObj;
            ctxObj._node = &node_154;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_146.output_MEM;
            ctxObj._input_T = node_33_output_VAL;
            ctxObj._input_F = node_131.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__if_else__string::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_163_isNodeDirty = true;
        }

    }
    { // xod__core__if_else__number #155

        if (g_transaction.node_155_hasUpstreamError) {
            g_transaction.node_180_hasUpstreamError = true;
        } else if (g_transaction.node_155_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(155);

            xod__core__if_else__number::ContextObject ctxObj;
            ctxObj._node = &node_155;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_107.output_OUT;
            ctxObj._input_T = node_148.output_OUT;
            ctxObj._input_F = node_204.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__if_else__number::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__less #156

        if (g_transaction.node_156_hasUpstreamError) {
            g_transaction.node_164_hasUpstreamError = true;
        } else if (g_transaction.node_156_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(156);

            xod__core__less::ContextObject ctxObj;
            ctxObj._node = &node_156;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_148.output_OUT;
            ctxObj._input_IN2 = node_59_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__less::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__buffer__number #157

        if (g_transaction.node_157_hasUpstreamError) {
            g_transaction.node_202_hasUpstreamError = true;
        } else if (g_transaction.node_157_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(157);

            xod__core__buffer__number::ContextObject ctxObj;
            ctxObj._node = &node_157;

            // copy data from upstream nodes into context
            ctxObj._input_NEW = node_141.output_R;

            ctxObj._isInputDirty_UPD = g_transaction.node_149_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_MEM = false;

            xod__core__buffer__number::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_157_isOutputDirty_MEM = ctxObj._isOutputDirty_MEM;

            // mark downstream nodes dirty
            g_transaction.node_202_isNodeDirty |= g_transaction.node_157_isOutputDirty_MEM;
        }

    }
    { // xod__core__not #158

        if (g_transaction.node_158_hasUpstreamError) {
            g_transaction.node_165_hasUpstreamError = true;
        } else if (g_transaction.node_158_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(158);

            xod__core__not::ContextObject ctxObj;
            ctxObj._node = &node_158;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_150.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__not::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_165_isNodeDirty = true;
        }

    }
    { // xod__core__cast_to_pulse__boolean #159

        if (g_transaction.node_159_hasUpstreamError) {
            g_transaction.node_166_hasUpstreamError = true;
        } else if (g_transaction.node_159_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(159);

            xod__core__cast_to_pulse__boolean::ContextObject ctxObj;
            ctxObj._node = &node_159;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_150.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__cast_to_pulse__boolean::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_159_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_166_isNodeDirty |= g_transaction.node_159_isOutputDirty_OUT;
        }

    }
    { // xod__core__cast_to_number__boolean #160

        if (g_transaction.node_160_hasUpstreamError) {
            g_transaction.node_167_hasUpstreamError = true;
            g_transaction.node_168_hasUpstreamError = true;
        } else if (g_transaction.node_160_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(160);

            xod__core__cast_to_number__boolean::ContextObject ctxObj;
            ctxObj._node = &node_160;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_151.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__cast_to_number__boolean::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_167_isNodeDirty = true;
            g_transaction.node_168_isNodeDirty = true;
        }

    }
    { // xod__core__and #161

        if (g_transaction.node_161_hasUpstreamError) {
            g_transaction.node_169_hasUpstreamError = true;
        } else if (g_transaction.node_161_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(161);

            xod__core__and::ContextObject ctxObj;
            ctxObj._node = &node_161;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_133.output_OUT;
            ctxObj._input_IN2 = node_152.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__and::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_169_isNodeDirty = true;
        }

    }
    { // xod__core__any #162

        if (g_transaction.node_162_hasUpstreamError) {
            g_transaction.node_170_hasUpstreamError = true;
        } else if (g_transaction.node_162_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(162);

            xod__core__any::ContextObject ctxObj;
            ctxObj._node = &node_162;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_153_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_80_isOutputDirty_BOOT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__any::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_162_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_170_isNodeDirty |= g_transaction.node_162_isOutputDirty_OUT;
        }

    }
    { // xod__core__if_else__string #163

        if (g_transaction.node_163_hasUpstreamError) {
            g_transaction.node_171_hasUpstreamError = true;
        } else if (g_transaction.node_163_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(163);

            xod__core__if_else__string::ContextObject ctxObj;
            ctxObj._node = &node_163;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_133.output_OUT;
            ctxObj._input_T = node_154.output_R;
            ctxObj._input_F = node_131.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__if_else__string::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_171_isNodeDirty = true;
        }

    }
    { // xod__core__branch #164

        if (g_transaction.node_164_hasUpstreamError) {
            g_transaction.node_172_hasUpstreamError = true;
            g_transaction.node_173_hasUpstreamError = true;
            g_transaction.node_203_hasUpstreamError = true;
        } else if (g_transaction.node_164_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(164);

            xod__core__branch::ContextObject ctxObj;
            ctxObj._node = &node_164;

            // copy data from upstream nodes into context
            ctxObj._input_GATE = node_156.output_OUT;

            ctxObj._isInputDirty_TRIG = g_transaction.node_142_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_T = false;
            ctxObj._isOutputDirty_F = false;

            xod__core__branch::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_164_isOutputDirty_T = ctxObj._isOutputDirty_T;
            g_transaction.node_164_isOutputDirty_F = ctxObj._isOutputDirty_F;

            // mark downstream nodes dirty
            g_transaction.node_172_isNodeDirty |= g_transaction.node_164_isOutputDirty_T;
            g_transaction.node_173_isNodeDirty |= g_transaction.node_164_isOutputDirty_F;
            g_transaction.node_203_isNodeDirty |= g_transaction.node_164_isOutputDirty_F;
        }

    }
    { // xod__core__cast_to_pulse__boolean #165

        if (g_transaction.node_165_hasUpstreamError) {
            g_transaction.node_174_hasUpstreamError = true;
        } else if (g_transaction.node_165_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(165);

            xod__core__cast_to_pulse__boolean::ContextObject ctxObj;
            ctxObj._node = &node_165;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_158.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__cast_to_pulse__boolean::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_165_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_174_isNodeDirty |= g_transaction.node_165_isOutputDirty_OUT;
        }

    }
    { // ____play_note #166

        if (g_transaction.node_166_hasUpstreamError) {
        } else if (g_transaction.node_166_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(166);

            ____play_note::ContextObject ctxObj;
            ctxObj._node = &node_166;

            // copy data from upstream nodes into context
            ctxObj._input_PIN = node_22_output_VAL;
            ctxObj._input_FREQ = node_23_output_VAL;
            ctxObj._input_DUR = node_81.output_OUT;

            ctxObj._isInputDirty_UPD = g_transaction.node_159_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            ____play_note::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__math__cube #167

        if (g_transaction.node_167_hasUpstreamError) {
            g_transaction.node_191_hasUpstreamError = true;
        } else if (g_transaction.node_167_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(167);

            xod__math__cube::ContextObject ctxObj;
            ctxObj._node = &node_167;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_160.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__math__cube::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__pulse_on_change__number #168

        if (g_transaction.node_168_hasUpstreamError) {
            g_transaction.node_175_hasUpstreamError = true;
        } else if (g_transaction.node_168_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(168);

            xod__core__pulse_on_change__number::ContextObject ctxObj;
            ctxObj._node = &node_168;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_160.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__pulse_on_change__number::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_168_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_175_isNodeDirty |= g_transaction.node_168_isOutputDirty_OUT;
        }

    }
    { // xod__core__cast_to_number__boolean #169

        if (g_transaction.node_169_hasUpstreamError) {
            g_transaction.node_176_hasUpstreamError = true;
            g_transaction.node_177_hasUpstreamError = true;
        } else if (g_transaction.node_169_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(169);

            xod__core__cast_to_number__boolean::ContextObject ctxObj;
            ctxObj._node = &node_169;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_161.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__cast_to_number__boolean::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_176_isNodeDirty = true;
            g_transaction.node_177_isNodeDirty = true;
        }

    }
    { // xod__core__any #170

        if (g_transaction.node_170_hasUpstreamError) {
            g_transaction.node_178_hasUpstreamError = true;
        } else if (g_transaction.node_170_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(170);

            xod__core__any::ContextObject ctxObj;
            ctxObj._node = &node_170;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_162_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_89_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__any::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_170_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_178_isNodeDirty |= g_transaction.node_170_isOutputDirty_OUT;
        }

    }
    { // xod__core__if_error__string #171

        if (g_transaction.node_171_isNodeDirty) {
            bool error_input_IN = false;
            error_input_IN |= node_93.errors.output_VAL;
            error_input_IN |= node_95.errors.output_VAL;
            error_input_IN |= node_96.errors.output_SIG;
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(171);

            xod__core__if_error__string::ContextObject ctxObj;
            ctxObj._node = &node_171;

            ctxObj._error_input_IN = error_input_IN;
            ctxObj._error_input_DEF = 0;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_163.output_R;
            ctxObj._input_DEF = node_49_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__if_error__string::NodeErrors previousErrors = node_171.errors;

            xod__core__if_error__string::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_171_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            if (previousErrors.flags != node_171.errors.flags) {
                detail::printErrorToDebugSerial(171, node_171.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_171.errors.output_OUT != previousErrors.output_OUT) {
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
            }

            // mark downstream nodes dirty
            g_transaction.node_179_isNodeDirty |= g_transaction.node_171_isOutputDirty_OUT;
            g_transaction.node_196_isNodeDirty |= g_transaction.node_171_isOutputDirty_OUT;
        }

        // propagate errors hold by the node outputs
        if (node_171.errors.flags) {
            if (node_171.errors.output_OUT) {
                g_transaction.node_179_hasUpstreamError = true;
                g_transaction.node_196_hasUpstreamError = true;
            }
        }
    }
    { // xod__core__any #172

        if (g_transaction.node_172_hasUpstreamError) {
            g_transaction.node_180_hasUpstreamError = true;
        } else if (g_transaction.node_172_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(172);

            xod__core__any::ContextObject ctxObj;
            ctxObj._node = &node_172;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_127_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_164_isOutputDirty_T;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__any::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_172_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_180_isNodeDirty |= g_transaction.node_172_isOutputDirty_OUT;
        }

    }
    { // xod__core__flip_flop #173

        if (g_transaction.node_173_hasUpstreamError) {
            g_transaction.node_185_hasUpstreamError = true;
        } else if (g_transaction.node_173_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(173);

            xod__core__flip_flop::ContextObject ctxObj;
            ctxObj._node = &node_173;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_SET = false;
            ctxObj._isInputDirty_TGL = g_transaction.node_164_isOutputDirty_F;
            ctxObj._isInputDirty_RST = g_transaction.node_127_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_MEM = false;

            xod__core__flip_flop::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_173_isOutputDirty_MEM = ctxObj._isOutputDirty_MEM;

            // mark downstream nodes dirty
            g_transaction.node_185_isNodeDirty |= g_transaction.node_173_isOutputDirty_MEM;
        }

    }
    { // ____play_note #174

        if (g_transaction.node_174_hasUpstreamError) {
        } else if (g_transaction.node_174_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(174);

            ____play_note::ContextObject ctxObj;
            ctxObj._node = &node_174;

            // copy data from upstream nodes into context
            ctxObj._input_PIN = node_19_output_VAL;
            ctxObj._input_FREQ = node_20_output_VAL;
            ctxObj._input_DUR = node_98.output_OUT;

            ctxObj._isInputDirty_UPD = g_transaction.node_165_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            ____play_note::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__any #175

        if (g_transaction.node_175_hasUpstreamError) {
            g_transaction.node_181_hasUpstreamError = true;
        } else if (g_transaction.node_175_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(175);

            xod__core__any::ContextObject ctxObj;
            ctxObj._node = &node_175;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_168_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_80_isOutputDirty_BOOT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__any::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_175_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_181_isNodeDirty |= g_transaction.node_175_isOutputDirty_OUT;
        }

    }
    { // xod__math__cube #176

        if (g_transaction.node_176_hasUpstreamError) {
            g_transaction.node_195_hasUpstreamError = true;
        } else if (g_transaction.node_176_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(176);

            xod__math__cube::ContextObject ctxObj;
            ctxObj._node = &node_176;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_169.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__math__cube::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__pulse_on_change__number #177

        if (g_transaction.node_177_hasUpstreamError) {
            g_transaction.node_182_hasUpstreamError = true;
        } else if (g_transaction.node_177_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(177);

            xod__core__pulse_on_change__number::ContextObject ctxObj;
            ctxObj._node = &node_177;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_169.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__pulse_on_change__number::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_177_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_182_isNodeDirty |= g_transaction.node_177_isOutputDirty_OUT;
        }

    }
    { // xod__core__gate__pulse #178

        if (g_transaction.node_178_hasUpstreamError) {
            g_transaction.node_183_hasUpstreamError = true;
        } else if (g_transaction.node_178_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(178);

            xod__core__gate__pulse::ContextObject ctxObj;
            ctxObj._node = &node_178;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_36_output_VAL;

            ctxObj._isInputDirty_IN = g_transaction.node_170_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__gate__pulse::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_178_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_183_isNodeDirty |= g_transaction.node_178_isOutputDirty_OUT;
        }

    }
    { // xod__core__pulse_on_change__string #179

        if (g_transaction.node_179_hasUpstreamError) {
            g_transaction.node_184_hasUpstreamError = true;
        } else if (g_transaction.node_179_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(179);

            xod__core__pulse_on_change__string::ContextObject ctxObj;
            ctxObj._node = &node_179;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_171.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__pulse_on_change__string::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_179_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_184_isNodeDirty |= g_transaction.node_179_isOutputDirty_OUT;
        }

    }
    { // xod__core__buffer__number #180

        if (g_transaction.node_180_hasUpstreamError) {
            g_transaction.node_185_hasUpstreamError = true;
            g_transaction.node_204_hasUpstreamError = true;
        } else if (g_transaction.node_180_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(180);

            xod__core__buffer__number::ContextObject ctxObj;
            ctxObj._node = &node_180;

            // copy data from upstream nodes into context
            ctxObj._input_NEW = node_155.output_R;

            ctxObj._isInputDirty_UPD = g_transaction.node_172_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_MEM = false;

            xod__core__buffer__number::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_180_isOutputDirty_MEM = ctxObj._isOutputDirty_MEM;

            // mark downstream nodes dirty
            g_transaction.node_185_isNodeDirty |= g_transaction.node_180_isOutputDirty_MEM;
            g_transaction.node_204_isNodeDirty |= g_transaction.node_180_isOutputDirty_MEM;
        }

    }
    { // xod__core__any #181

        if (g_transaction.node_181_hasUpstreamError) {
            g_transaction.node_186_hasUpstreamError = true;
        } else if (g_transaction.node_181_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(181);

            xod__core__any::ContextObject ctxObj;
            ctxObj._node = &node_181;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_175_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_87_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__any::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_181_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_186_isNodeDirty |= g_transaction.node_181_isOutputDirty_OUT;
        }

    }
    { // xod__core__any #182

        if (g_transaction.node_182_hasUpstreamError) {
            g_transaction.node_187_hasUpstreamError = true;
        } else if (g_transaction.node_182_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(182);

            xod__core__any::ContextObject ctxObj;
            ctxObj._node = &node_182;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_177_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_80_isOutputDirty_BOOT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__any::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_182_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_187_isNodeDirty |= g_transaction.node_182_isOutputDirty_OUT;
        }

    }
    { // xod_dev__text_lcd__print_at__text_lcd_i2c_device #183

        if (g_transaction.node_183_hasUpstreamError) {
            g_transaction.node_196_hasUpstreamError = true;
            g_transaction.node_188_hasUpstreamError = true;
        } else if (g_transaction.node_183_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(183);

            xod_dev__text_lcd__print_at__text_lcd_i2c_device::ContextObject ctxObj;
            ctxObj._node = &node_183;

            // copy data from upstream nodes into context
            ctxObj._input_DEV = node_123.output_DEVU0027;
            ctxObj._input_ROW = node_38_output_VAL;
            ctxObj._input_POS = node_39_output_VAL;
            ctxObj._input_LEN = node_40_output_VAL;
            ctxObj._input_VAL = node_145.output_OUT;

            ctxObj._isInputDirty_DO = g_transaction.node_178_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DEVU0027 = false;
            ctxObj._isOutputDirty_DONE = false;

            xod_dev__text_lcd__print_at__text_lcd_i2c_device::NodeErrors previousErrors = node_183.errors;

            node_183.errors.output_DONE = false;

            xod_dev__text_lcd__print_at__text_lcd_i2c_device::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_183_isOutputDirty_DEVU0027 = ctxObj._isOutputDirty_DEVU0027;
            g_transaction.node_183_isOutputDirty_DONE = ctxObj._isOutputDirty_DONE;

            if (previousErrors.flags != node_183.errors.flags) {
                detail::printErrorToDebugSerial(183, node_183.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_183.errors.output_DEVU0027 != previousErrors.output_DEVU0027) {
                }
                if (node_183.errors.output_DONE != previousErrors.output_DONE) {
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
                if (previousErrors.output_DONE && !node_183.errors.output_DONE) {
                    g_transaction.node_188_isNodeDirty = true;
                }
            }

            // mark downstream nodes dirty
            g_transaction.node_196_isNodeDirty |= g_transaction.node_183_isOutputDirty_DEVU0027;
            g_transaction.node_188_isNodeDirty |= g_transaction.node_183_isOutputDirty_DONE;
        }

        // propagate errors hold by the node outputs
        if (node_183.errors.flags) {
            if (node_183.errors.output_DEVU0027) {
                g_transaction.node_196_hasUpstreamError = true;
            }
            if (node_183.errors.output_DONE) {
                g_transaction.node_188_hasUpstreamError = true;
            }
        }
    }
    { // xod__core__any #184

        if (g_transaction.node_184_hasUpstreamError) {
            g_transaction.node_189_hasUpstreamError = true;
        } else if (g_transaction.node_184_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(184);

            xod__core__any::ContextObject ctxObj;
            ctxObj._node = &node_184;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_179_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_80_isOutputDirty_BOOT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__any::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_184_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_189_isNodeDirty |= g_transaction.node_184_isOutputDirty_OUT;
        }

    }
    { // xod__core__if_else__number #185

        if (g_transaction.node_185_hasUpstreamError) {
            g_transaction.node_190_hasUpstreamError = true;
        } else if (g_transaction.node_185_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(185);

            xod__core__if_else__number::ContextObject ctxObj;
            ctxObj._node = &node_185;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_173.output_MEM;
            ctxObj._input_T = node_180.output_MEM;
            ctxObj._input_F = node_148.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__core__if_else__number::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_190_isNodeDirty = true;
        }

    }
    { // xod__core__gate__pulse #186

        if (g_transaction.node_186_hasUpstreamError) {
            g_transaction.node_191_hasUpstreamError = true;
        } else if (g_transaction.node_186_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(186);

            xod__core__gate__pulse::ContextObject ctxObj;
            ctxObj._node = &node_186;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_27_output_VAL;

            ctxObj._isInputDirty_IN = g_transaction.node_181_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__gate__pulse::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_186_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_191_isNodeDirty |= g_transaction.node_186_isOutputDirty_OUT;
        }

    }
    { // xod__core__any #187

        if (g_transaction.node_187_hasUpstreamError) {
            g_transaction.node_192_hasUpstreamError = true;
        } else if (g_transaction.node_187_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(187);

            xod__core__any::ContextObject ctxObj;
            ctxObj._node = &node_187;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_182_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_86_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__any::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_187_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_192_isNodeDirty |= g_transaction.node_187_isOutputDirty_OUT;
        }

    }
    { // xod__core__any #188

        if (g_transaction.node_188_hasUpstreamError) {
            g_transaction.node_198_hasUpstreamError = true;
        } else if (g_transaction.node_188_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(188);

            xod__core__any::ContextObject ctxObj;
            ctxObj._node = &node_188;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_123_isOutputDirty_DONE;
            ctxObj._isInputDirty_IN2 = g_transaction.node_183_isOutputDirty_DONE;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__any::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_188_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_198_isNodeDirty |= g_transaction.node_188_isOutputDirty_OUT;
        }

    }
    { // xod__core__any #189

        if (g_transaction.node_189_hasUpstreamError) {
            g_transaction.node_193_hasUpstreamError = true;
        } else if (g_transaction.node_189_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(189);

            xod__core__any::ContextObject ctxObj;
            ctxObj._node = &node_189;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_184_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_90_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__any::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_189_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_193_isNodeDirty |= g_transaction.node_189_isOutputDirty_OUT;
        }

    }
    { // xod__math__map #190

        if (g_transaction.node_190_hasUpstreamError) {
            g_transaction.node_194_hasUpstreamError = true;
            g_transaction.node_201_hasUpstreamError = true;
        } else if (g_transaction.node_190_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(190);

            xod__math__map::ContextObject ctxObj;
            ctxObj._node = &node_190;

            // copy data from upstream nodes into context
            ctxObj._input_X = node_185.output_R;
            ctxObj._input_Smin = node_62_output_VAL;
            ctxObj._input_Smax = node_63_output_VAL;
            ctxObj._input_Tmin = node_64_output_VAL;
            ctxObj._input_Tmax = node_65_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            xod__math__map::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_194_isNodeDirty = true;
        }

    }
    { // xod__gpio__pwm_write #191

        if (g_transaction.node_191_hasUpstreamError) {
        } else if (g_transaction.node_191_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(191);

            xod__gpio__pwm_write::ContextObject ctxObj;
            ctxObj._node = &node_191;

            // copy data from upstream nodes into context
            ctxObj._input_PORT = node_26_output_VAL;
            ctxObj._input_DUTY = node_167.output_OUT;

            ctxObj._isInputDirty_UPD = g_transaction.node_186_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DONE = false;

            xod__gpio__pwm_write::NodeErrors previousErrors = node_191.errors;

            node_191.errors.output_DONE = false;

            xod__gpio__pwm_write::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            if (previousErrors.flags != node_191.errors.flags) {
                detail::printErrorToDebugSerial(191, node_191.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_191.errors.output_DONE != previousErrors.output_DONE) {
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
                if (previousErrors.output_DONE && !node_191.errors.output_DONE) {
                }
            }

            // mark downstream nodes dirty
        }

        // propagate errors hold by the node outputs
        if (node_191.errors.flags) {
            if (node_191.errors.output_DONE) {
            }
        }
    }
    { // xod__core__gate__pulse #192

        if (g_transaction.node_192_hasUpstreamError) {
            g_transaction.node_195_hasUpstreamError = true;
        } else if (g_transaction.node_192_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(192);

            xod__core__gate__pulse::ContextObject ctxObj;
            ctxObj._node = &node_192;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_25_output_VAL;

            ctxObj._isInputDirty_IN = g_transaction.node_187_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__gate__pulse::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_192_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_195_isNodeDirty |= g_transaction.node_192_isOutputDirty_OUT;
        }

    }
    { // xod__core__gate__pulse #193

        if (g_transaction.node_193_hasUpstreamError) {
            g_transaction.node_196_hasUpstreamError = true;
        } else if (g_transaction.node_193_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(193);

            xod__core__gate__pulse::ContextObject ctxObj;
            ctxObj._node = &node_193;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_44_output_VAL;

            ctxObj._isInputDirty_IN = g_transaction.node_189_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__gate__pulse::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_193_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_196_isNodeDirty |= g_transaction.node_193_isOutputDirty_OUT;
        }

    }
    { // xod__core__pulse_on_change__number #194

        if (g_transaction.node_194_hasUpstreamError) {
            g_transaction.node_197_hasUpstreamError = true;
        } else if (g_transaction.node_194_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(194);

            xod__core__pulse_on_change__number::ContextObject ctxObj;
            ctxObj._node = &node_194;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_190.output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__pulse_on_change__number::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_194_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_197_isNodeDirty |= g_transaction.node_194_isOutputDirty_OUT;
        }

    }
    { // xod__gpio__pwm_write #195

        if (g_transaction.node_195_hasUpstreamError) {
        } else if (g_transaction.node_195_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(195);

            xod__gpio__pwm_write::ContextObject ctxObj;
            ctxObj._node = &node_195;

            // copy data from upstream nodes into context
            ctxObj._input_PORT = node_24_output_VAL;
            ctxObj._input_DUTY = node_176.output_OUT;

            ctxObj._isInputDirty_UPD = g_transaction.node_192_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DONE = false;

            xod__gpio__pwm_write::NodeErrors previousErrors = node_195.errors;

            node_195.errors.output_DONE = false;

            xod__gpio__pwm_write::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            if (previousErrors.flags != node_195.errors.flags) {
                detail::printErrorToDebugSerial(195, node_195.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_195.errors.output_DONE != previousErrors.output_DONE) {
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
                if (previousErrors.output_DONE && !node_195.errors.output_DONE) {
                }
            }

            // mark downstream nodes dirty
        }

        // propagate errors hold by the node outputs
        if (node_195.errors.flags) {
            if (node_195.errors.output_DONE) {
            }
        }
    }
    { // xod_dev__text_lcd__print_at__text_lcd_i2c_device #196

        if (g_transaction.node_196_hasUpstreamError) {
            g_transaction.node_198_hasUpstreamError = true;
        } else if (g_transaction.node_196_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(196);

            xod_dev__text_lcd__print_at__text_lcd_i2c_device::ContextObject ctxObj;
            ctxObj._node = &node_196;

            // copy data from upstream nodes into context
            ctxObj._input_DEV = node_183.output_DEVU0027;
            ctxObj._input_ROW = node_45_output_VAL;
            ctxObj._input_POS = node_46_output_VAL;
            ctxObj._input_LEN = node_47_output_VAL;
            ctxObj._input_VAL = node_171.output_OUT;

            ctxObj._isInputDirty_DO = g_transaction.node_193_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DEVU0027 = false;
            ctxObj._isOutputDirty_DONE = false;

            xod_dev__text_lcd__print_at__text_lcd_i2c_device::NodeErrors previousErrors = node_196.errors;

            node_196.errors.output_DONE = false;

            xod_dev__text_lcd__print_at__text_lcd_i2c_device::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_196_isOutputDirty_DONE = ctxObj._isOutputDirty_DONE;

            if (previousErrors.flags != node_196.errors.flags) {
                detail::printErrorToDebugSerial(196, node_196.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_196.errors.output_DEVU0027 != previousErrors.output_DEVU0027) {
                }
                if (node_196.errors.output_DONE != previousErrors.output_DONE) {
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
                if (previousErrors.output_DONE && !node_196.errors.output_DONE) {
                    g_transaction.node_198_isNodeDirty = true;
                }
            }

            // mark downstream nodes dirty
            g_transaction.node_198_isNodeDirty |= g_transaction.node_196_isOutputDirty_DONE;
        }

        // propagate errors hold by the node outputs
        if (node_196.errors.flags) {
            if (node_196.errors.output_DEVU0027) {
            }
            if (node_196.errors.output_DONE) {
                g_transaction.node_198_hasUpstreamError = true;
            }
        }
    }
    { // xod__core__any #197

        if (g_transaction.node_197_hasUpstreamError) {
            g_transaction.node_199_hasUpstreamError = true;
        } else if (g_transaction.node_197_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(197);

            xod__core__any::ContextObject ctxObj;
            ctxObj._node = &node_197;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_194_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_80_isOutputDirty_BOOT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__any::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_197_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_199_isNodeDirty |= g_transaction.node_197_isOutputDirty_OUT;
        }

    }
    { // xod__core__any #198

        if (g_transaction.node_198_hasUpstreamError) {
        } else if (g_transaction.node_198_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(198);

            xod__core__any::ContextObject ctxObj;
            ctxObj._node = &node_198;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_188_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_196_isOutputDirty_DONE;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__any::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__any #199

        if (g_transaction.node_199_hasUpstreamError) {
            g_transaction.node_200_hasUpstreamError = true;
        } else if (g_transaction.node_199_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(199);

            xod__core__any::ContextObject ctxObj;
            ctxObj._node = &node_199;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_197_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_92_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__any::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_199_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_200_isNodeDirty |= g_transaction.node_199_isOutputDirty_OUT;
        }

    }
    { // xod__core__gate__pulse #200

        if (g_transaction.node_200_hasUpstreamError) {
            g_transaction.node_201_hasUpstreamError = true;
        } else if (g_transaction.node_200_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(200);

            xod__core__gate__pulse::ContextObject ctxObj;
            ctxObj._node = &node_200;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_71_output_VAL;

            ctxObj._isInputDirty_IN = g_transaction.node_199_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__gate__pulse::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_200_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_201_isNodeDirty |= g_transaction.node_200_isOutputDirty_OUT;
        }

    }
    { // xod_dev__servo__rotate #201

        if (g_transaction.node_201_hasUpstreamError) {
        } else if (g_transaction.node_201_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(201);

            xod_dev__servo__rotate::ContextObject ctxObj;
            ctxObj._node = &node_201;

            // copy data from upstream nodes into context
            ctxObj._input_DEV = node_85.output_DEV;
            ctxObj._input_VAL = node_190.output_OUT;

            ctxObj._isInputDirty_DO = g_transaction.node_200_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DEVU0027 = false;
            ctxObj._isOutputDirty_ACK = false;

            xod_dev__servo__rotate::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__defer__number #202

        if (g_transaction.node_202_isNodeDirty) {
            bool error_input_IN = false;
            error_input_IN |= node_94.errors.output_SIG;
            error_input_IN |= node_203.errors.output_OUT;
            error_input_IN |= node_93.errors.output_VAL;
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(202);

            xod__core__defer__number::ContextObject ctxObj;
            ctxObj._node = &node_202;

            ctxObj._error_input_IN = error_input_IN;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_157.output_MEM;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__defer__number::NodeErrors previousErrors = node_202.errors;

            xod__core__defer__number::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_202_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            if (previousErrors.flags != node_202.errors.flags) {
                detail::printErrorToDebugSerial(202, node_202.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_202.errors.output_OUT != previousErrors.output_OUT) {
                    g_transaction.node_202_isNodeDirty = true;
                    g_transaction.node_204_isNodeDirty = true;
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
            }

            // mark downstream nodes dirty
            g_transaction.node_107_isNodeDirty |= g_transaction.node_202_isOutputDirty_OUT;
            g_transaction.node_116_isNodeDirty |= g_transaction.node_202_isOutputDirty_OUT;
        }

        // propagate errors hold by the node outputs
        if (node_202.errors.flags) {
            if (node_202.errors.output_OUT) {
                g_transaction.node_107_hasUpstreamError = true;
                g_transaction.node_116_hasUpstreamError = true;
            }
        }
    }
    { // xod__core__defer__pulse #203

        if (g_transaction.node_203_isNodeDirty) {
            bool error_input_IN = false;
            error_input_IN |= node_94.errors.output_SIG;
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(203);

            xod__core__defer__pulse::ContextObject ctxObj;
            ctxObj._node = &node_203;

            ctxObj._error_input_IN = error_input_IN;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN = g_transaction.node_164_isOutputDirty_F;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__defer__pulse::NodeErrors previousErrors = node_203.errors;

            xod__core__defer__pulse::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_203_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            if (previousErrors.flags != node_203.errors.flags) {
                detail::printErrorToDebugSerial(203, node_203.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_203.errors.output_OUT != previousErrors.output_OUT) {
                    g_transaction.node_202_isNodeDirty = true;
                    g_transaction.node_204_isNodeDirty = true;
                    g_transaction.node_203_isNodeDirty = true;
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
                if (previousErrors.output_OUT && !node_203.errors.output_OUT) {
                    g_transaction.node_132_isNodeDirty = true;
                }
            }

            // mark downstream nodes dirty
            g_transaction.node_132_isNodeDirty |= g_transaction.node_203_isOutputDirty_OUT;
        }

        // propagate errors hold by the node outputs
        if (node_203.errors.flags) {
            if (node_203.errors.output_OUT) {
                g_transaction.node_132_hasUpstreamError = true;
            }
        }
    }
    { // xod__core__defer__number #204

        if (g_transaction.node_204_isNodeDirty) {
            bool error_input_IN = false;
            error_input_IN |= node_94.errors.output_SIG;
            error_input_IN |= node_203.errors.output_OUT;
            error_input_IN |= node_93.errors.output_VAL;
            error_input_IN |= node_202.errors.output_OUT;
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(204);

            xod__core__defer__number::ContextObject ctxObj;
            ctxObj._node = &node_204;

            ctxObj._error_input_IN = error_input_IN;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_180.output_MEM;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            xod__core__defer__number::NodeErrors previousErrors = node_204.errors;

            xod__core__defer__number::evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_204_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            if (previousErrors.flags != node_204.errors.flags) {
                detail::printErrorToDebugSerial(204, node_204.errors.flags);

                // if an error was just raised or cleared from an output,
                // mark nearest downstream error catchers as dirty
                if (node_204.errors.output_OUT != previousErrors.output_OUT) {
                    g_transaction.node_204_isNodeDirty = true;
                }

                // if a pulse output was cleared from error, mark downstream nodes as dirty
                // (no matter if a pulse was emitted or not)
            }

            // mark downstream nodes dirty
            g_transaction.node_155_isNodeDirty |= g_transaction.node_204_isOutputDirty_OUT;
        }

        // propagate errors hold by the node outputs
        if (node_204.errors.flags) {
            if (node_204.errors.output_OUT) {
                g_transaction.node_155_hasUpstreamError = true;
            }
        }
    }

    // Clear dirtieness and timeouts for all nodes and pins
    memset(&g_transaction, 0, sizeof(g_transaction));

    detail::clearStaleTimeout(&node_79);
    detail::clearStaleTimeout(&node_109);
    detail::clearStaleTimeout(&node_113);
    detail::clearStaleTimeout(&node_137);
    detail::clearStaleTimeout(&node_139);
    detail::clearStaleTimeout(&node_142);
    detail::clearStaleTimeout(&node_150);
    detail::clearStaleTimeout(&node_202);
    detail::clearStaleTimeout(&node_203);
    detail::clearStaleTimeout(&node_204);

    XOD_TRACE_F("Transaction completed, t=");
    XOD_TRACE_LN(millis());
}

} // namespace xod
