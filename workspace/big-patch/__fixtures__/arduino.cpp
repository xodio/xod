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

class HardwareSerial;
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

template<typename T> struct identity {
  typedef T type;
};

template<typename T> struct remove_pointer                    {typedef T type;};
template<typename T> struct remove_pointer<T*>                {typedef T type;};
template<typename T> struct remove_pointer<T* const>          {typedef T type;};
template<typename T> struct remove_pointer<T* volatile>       {typedef T type;};
template<typename T> struct remove_pointer<T* const volatile> {typedef T type;};

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

constexpr bool isValidDigitalPort(uint8_t port) {
#if defined(__AVR__) && defined(NUM_DIGITAL_PINS)
    return port < NUM_DIGITAL_PINS;
#else
    return true;
#endif
}

constexpr bool isValidAnalogPort(uint8_t port) {
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

//-----------------------------------------------------------------------------
// xod-dev/text-lcd/text-lcd-i2c-device implementation
//-----------------------------------------------------------------------------
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

namespace xod {
struct xod_dev__text_lcd__text_lcd_i2c_device {

    typedef uint8_t TypeOfADDR;
    typedef Number TypeOfCOLS;
    typedef Number TypeOfROWS;

    //#pragma XOD error_raise enable

    struct State {
        uint8_t mem[sizeof(LiquidCrystal_I2C)];
    };

    struct Type {
        LiquidCrystal_I2C* lcd;
        uint8_t rows;
        uint8_t cols;
    };

    typedef Type TypeOfDEV;

    struct input_ADDR { };
    struct input_COLS { };
    struct input_ROWS { };
    struct output_DEV { };

    static const identity<TypeOfADDR> getValueType(input_ADDR) {
      return identity<TypeOfADDR>();
    }
    static const identity<TypeOfCOLS> getValueType(input_COLS) {
      return identity<TypeOfCOLS>();
    }
    static const identity<TypeOfROWS> getValueType(input_ROWS) {
      return identity<TypeOfROWS>();
    }
    static const identity<TypeOfDEV> getValueType(output_DEV) {
      return identity<TypeOfDEV>();
    }

    union NodeErrors {
        struct {
            bool output_DEV : 1;
        };

        ErrorFlags flags = 0;
    };

    NodeErrors errors = {};

    TypeOfDEV _output_DEV;

    State state;

    xod_dev__text_lcd__text_lcd_i2c_device (TypeOfDEV output_DEV) {
        _output_DEV = output_DEV;
    }

    struct ContextObject {

        TypeOfADDR _input_ADDR;
        TypeOfCOLS _input_COLS;
        TypeOfROWS _input_ROWS;

        bool _isOutputDirty_DEV : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_ADDR input_COLS input_ROWS" \
                " output_DEV");
    }

    TypeOfADDR getValue(Context ctx, identity<input_ADDR>) {
        return ctx->_input_ADDR;
    }
    TypeOfCOLS getValue(Context ctx, identity<input_COLS>) {
        return ctx->_input_COLS;
    }
    TypeOfROWS getValue(Context ctx, identity<input_ROWS>) {
        return ctx->_input_ROWS;
    }
    TypeOfDEV getValue(Context ctx, identity<output_DEV>) {
        return this->_output_DEV;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_DEV");
    }

    void emitValue(Context ctx, TypeOfDEV val, identity<output_DEV>) {
        this->_output_DEV = val;
        ctx->_isOutputDirty_DEV = true;
        this->errors.output_DEV = false;
    }

    template<typename OutputT> void raiseError(Context ctx) {
        raiseError(ctx, identity<OutputT>());
    }

    template<typename OutputT> void raiseError(Context ctx, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_DEV");
    }

    void raiseError(Context ctx, identity<output_DEV>) {
        this->errors.output_DEV = true;
        ctx->_isOutputDirty_DEV = true;
    }

    void raiseError(Context ctx) {
        this->errors.output_DEV = true;
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

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod-dev/servo/servo-device implementation
//-----------------------------------------------------------------------------
#include <Servo.h>

namespace xod {
template <uint8_t constant_input_PORT>
struct xod_dev__servo__servo_device {

    typedef uint8_t TypeOfPORT;
    typedef Number TypeOfPmin;
    typedef Number TypeOfPmax;

    //#pragma XOD error_raise enable

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

    typedef Type TypeOfDEV;

    struct input_PORT { };
    struct input_Pmin { };
    struct input_Pmax { };
    struct output_DEV { };

    static const identity<TypeOfPORT> getValueType(input_PORT) {
      return identity<TypeOfPORT>();
    }
    static const identity<TypeOfPmin> getValueType(input_Pmin) {
      return identity<TypeOfPmin>();
    }
    static const identity<TypeOfPmax> getValueType(input_Pmax) {
      return identity<TypeOfPmax>();
    }
    static const identity<TypeOfDEV> getValueType(output_DEV) {
      return identity<TypeOfDEV>();
    }

    union NodeErrors {
        struct {
            bool output_DEV : 1;
        };

        ErrorFlags flags = 0;
    };

    NodeErrors errors = {};

    TypeOfDEV _output_DEV;

    State state;

    xod_dev__servo__servo_device (TypeOfDEV output_DEV) {
        _output_DEV = output_DEV;
    }

    struct ContextObject {

        TypeOfPmin _input_Pmin;
        TypeOfPmax _input_Pmax;

        bool _isOutputDirty_DEV : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_PORT input_Pmin input_Pmax" \
                " output_DEV");
    }

    TypeOfPORT getValue(Context ctx, identity<input_PORT>) {
        return constant_input_PORT;
    }
    TypeOfPmin getValue(Context ctx, identity<input_Pmin>) {
        return ctx->_input_Pmin;
    }
    TypeOfPmax getValue(Context ctx, identity<input_Pmax>) {
        return ctx->_input_Pmax;
    }
    TypeOfDEV getValue(Context ctx, identity<output_DEV>) {
        return this->_output_DEV;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_DEV");
    }

    void emitValue(Context ctx, TypeOfDEV val, identity<output_DEV>) {
        this->_output_DEV = val;
        ctx->_isOutputDirty_DEV = true;
        this->errors.output_DEV = false;
    }

    template<typename OutputT> void raiseError(Context ctx) {
        raiseError(ctx, identity<OutputT>());
    }

    template<typename OutputT> void raiseError(Context ctx, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_DEV");
    }

    void raiseError(Context ctx, identity<output_DEV>) {
        this->errors.output_DEV = true;
        ctx->_isOutputDirty_DEV = true;
    }

    void raiseError(Context ctx) {
        this->errors.output_DEV = true;
        ctx->_isOutputDirty_DEV = true;
    }

    void evaluate(Context ctx) {
        static_assert(isValidDigitalPort(constant_input_PORT), "must be a valid digital port");

        State* servo = getState(ctx);

        // TODO
        auto port = getValue<input_PORT>(ctx);

        servo->reattach(
            port,
            getValue<input_Pmin>(ctx),
            getValue<input_Pmax>(ctx)
        );

        emitValue<output_DEV>(ctx, servo);
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/continuously implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__continuously {

    typedef Pulse TypeOfTICK;

    struct State {
    };

    struct output_TICK { };

    static const identity<TypeOfTICK> getValueType(output_TICK) {
      return identity<TypeOfTICK>();
    }

    TimeMs timeoutAt = 0;

    State state;

    xod__core__continuously () {
    }

    struct ContextObject {

        bool _isOutputDirty_TICK : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    void setTimeout(__attribute__((unused)) Context ctx, TimeMs timeout) {
        this->timeoutAt = transactionTime() + timeout;
    }

    void clearTimeout(__attribute__((unused)) Context ctx) {
        detail::clearTimeout(this);
    }

    bool isTimedOut(__attribute__((unused)) const Context ctx) {
        return detail::isTimedOut(this);
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                "" \
                " output_TICK");
    }

    TypeOfTICK getValue(Context ctx, identity<output_TICK>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_TICK");
    }

    void emitValue(Context ctx, TypeOfTICK val, identity<output_TICK>) {
        ctx->_isOutputDirty_TICK = true;
    }

    void evaluate(Context ctx) {
        emitValue<output_TICK>(ctx, 1);
        setTimeout(ctx, 0);
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/boot implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__boot {

    typedef Pulse TypeOfBOOT;

    struct State {
    };

    struct output_BOOT { };

    static const identity<TypeOfBOOT> getValueType(output_BOOT) {
      return identity<TypeOfBOOT>();
    }

    State state;

    xod__core__boot () {
    }

    struct ContextObject {

        bool _isOutputDirty_BOOT : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                "" \
                " output_BOOT");
    }

    TypeOfBOOT getValue(Context ctx, identity<output_BOOT>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_BOOT");
    }

    void emitValue(Context ctx, TypeOfBOOT val, identity<output_BOOT>) {
        ctx->_isOutputDirty_BOOT = true;
    }

    void evaluate(Context ctx) {
        emitValue<output_BOOT>(ctx, 1);
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/multiply implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__multiply {

    typedef Number TypeOfIN1;
    typedef Number TypeOfIN2;

    typedef Number TypeOfOUT;

    //#pragma XOD dirtieness disable

    struct State {
    };

    struct input_IN1 { };
    struct input_IN2 { };
    struct output_OUT { };

    static const identity<TypeOfIN1> getValueType(input_IN1) {
      return identity<TypeOfIN1>();
    }
    static const identity<TypeOfIN2> getValueType(input_IN2) {
      return identity<TypeOfIN2>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    TypeOfOUT _output_OUT;

    State state;

    xod__core__multiply (TypeOfOUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        TypeOfIN1 _input_IN1;
        TypeOfIN2 _input_IN2;

    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN1 input_IN2" \
                " output_OUT");
    }

    TypeOfIN1 getValue(Context ctx, identity<input_IN1>) {
        return ctx->_input_IN1;
    }
    TypeOfIN2 getValue(Context ctx, identity<input_IN2>) {
        return ctx->_input_IN2;
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    void evaluate(Context ctx) {
        auto x = getValue<input_IN1>(ctx);
        auto y = getValue<input_IN2>(ctx);
        emitValue<output_OUT>(ctx, x * y);
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/pulse-on-change(boolean) implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__pulse_on_change__boolean {

    typedef Logic TypeOfIN;

    typedef Pulse TypeOfOUT;

    struct State {
        bool sample = false;
    };

    struct input_IN { };
    struct output_OUT { };

    static const identity<TypeOfIN> getValueType(input_IN) {
      return identity<TypeOfIN>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    State state;

    xod__core__pulse_on_change__boolean () {
    }

    struct ContextObject {

        TypeOfIN _input_IN;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN" \
                " output_OUT");
    }

    TypeOfIN getValue(Context ctx, identity<input_IN>) {
        return ctx->_input_IN;
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        ctx->_isOutputDirty_OUT = true;
    }

    void evaluate(Context ctx) {
        State* state = getState(ctx);
        int8_t newValue = (int8_t) getValue<input_IN>(ctx);

        if (!isSettingUp() && newValue != state->sample)
            emitValue<output_OUT>(ctx, 1);

        state->sample = newValue;
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/divide implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__divide {

    typedef Number TypeOfIN1;
    typedef Number TypeOfIN2;

    typedef Number TypeOfOUT;

    //#pragma XOD dirtieness disable

    struct State {
    };

    struct input_IN1 { };
    struct input_IN2 { };
    struct output_OUT { };

    static const identity<TypeOfIN1> getValueType(input_IN1) {
      return identity<TypeOfIN1>();
    }
    static const identity<TypeOfIN2> getValueType(input_IN2) {
      return identity<TypeOfIN2>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    TypeOfOUT _output_OUT;

    State state;

    xod__core__divide (TypeOfOUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        TypeOfIN1 _input_IN1;
        TypeOfIN2 _input_IN2;

    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN1 input_IN2" \
                " output_OUT");
    }

    TypeOfIN1 getValue(Context ctx, identity<input_IN1>) {
        return ctx->_input_IN1;
    }
    TypeOfIN2 getValue(Context ctx, identity<input_IN2>) {
        return ctx->_input_IN2;
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    void evaluate(Context ctx) {
        auto x = getValue<input_IN1>(ctx);
        auto y = getValue<input_IN2>(ctx);
        emitValue<output_OUT>(ctx, x / y);
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/cast-to-pulse(boolean) implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__cast_to_pulse__boolean {

    typedef Logic TypeOfIN;

    typedef Pulse TypeOfOUT;

    struct State {
      bool state = false;
    };

    struct input_IN { };
    struct output_OUT { };

    static const identity<TypeOfIN> getValueType(input_IN) {
      return identity<TypeOfIN>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    State state;

    xod__core__cast_to_pulse__boolean () {
    }

    struct ContextObject {

        TypeOfIN _input_IN;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN" \
                " output_OUT");
    }

    TypeOfIN getValue(Context ctx, identity<input_IN>) {
        return ctx->_input_IN;
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        ctx->_isOutputDirty_OUT = true;
    }

    void evaluate(Context ctx) {
        State* state = getState(ctx);
        auto newValue = getValue<input_IN>(ctx);

        if (newValue == true && state->state == false)
            emitValue<output_OUT>(ctx, 1);

        state->state = newValue;
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/gpio/analog-read implementation
//-----------------------------------------------------------------------------

namespace xod {
template <uint8_t constant_input_PORT>
struct xod__gpio__analog_read {

    typedef uint8_t TypeOfPORT;
    typedef Pulse TypeOfUPD;

    typedef Number TypeOfVAL;
    typedef Pulse TypeOfDONE;

    //#pragma XOD evaluate_on_pin disable
    //#pragma XOD evaluate_on_pin enable input_UPD

    struct State {
    };

    struct input_PORT { };
    struct input_UPD { };
    struct output_VAL { };
    struct output_DONE { };

    static const identity<TypeOfPORT> getValueType(input_PORT) {
      return identity<TypeOfPORT>();
    }
    static const identity<TypeOfUPD> getValueType(input_UPD) {
      return identity<TypeOfUPD>();
    }
    static const identity<TypeOfVAL> getValueType(output_VAL) {
      return identity<TypeOfVAL>();
    }
    static const identity<TypeOfDONE> getValueType(output_DONE) {
      return identity<TypeOfDONE>();
    }

    TypeOfVAL _output_VAL;

    State state;

    xod__gpio__analog_read (TypeOfVAL output_VAL) {
        _output_VAL = output_VAL;
    }

    struct ContextObject {

        bool _isInputDirty_UPD;

        bool _isOutputDirty_VAL : 1;
        bool _isOutputDirty_DONE : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_PORT input_UPD" \
                " output_VAL output_DONE");
    }

    TypeOfPORT getValue(Context ctx, identity<input_PORT>) {
        return constant_input_PORT;
    }
    TypeOfUPD getValue(Context ctx, identity<input_UPD>) {
        return Pulse();
    }
    TypeOfVAL getValue(Context ctx, identity<output_VAL>) {
        return this->_output_VAL;
    }
    TypeOfDONE getValue(Context ctx, identity<output_DONE>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_UPD");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_UPD>) {
        return ctx->_isInputDirty_UPD;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_VAL output_DONE");
    }

    void emitValue(Context ctx, TypeOfVAL val, identity<output_VAL>) {
        this->_output_VAL = val;
        ctx->_isOutputDirty_VAL = true;
    }
    void emitValue(Context ctx, TypeOfDONE val, identity<output_DONE>) {
        ctx->_isOutputDirty_DONE = true;
    }

    void evaluate(Context ctx) {
        static_assert(isValidAnalogPort(constant_input_PORT), "must be a valid analog port");

        if (!isInputDirty<input_UPD>(ctx))
            return;

        ::pinMode(constant_input_PORT, INPUT);
        emitValue<output_VAL>(ctx, ::analogRead(constant_input_PORT) / 1023.);
        emitValue<output_DONE>(ctx, 1);
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/gpio/digital-read-pullup implementation
//-----------------------------------------------------------------------------

namespace xod {
template <uint8_t constant_input_PORT>
struct xod__gpio__digital_read_pullup {

    typedef uint8_t TypeOfPORT;
    typedef Pulse TypeOfUPD;

    typedef Logic TypeOfSIG;
    typedef Pulse TypeOfDONE;

    //#pragma XOD evaluate_on_pin disable
    //#pragma XOD evaluate_on_pin enable input_UPD

    struct State {
    };

    struct input_PORT { };
    struct input_UPD { };
    struct output_SIG { };
    struct output_DONE { };

    static const identity<TypeOfPORT> getValueType(input_PORT) {
      return identity<TypeOfPORT>();
    }
    static const identity<TypeOfUPD> getValueType(input_UPD) {
      return identity<TypeOfUPD>();
    }
    static const identity<TypeOfSIG> getValueType(output_SIG) {
      return identity<TypeOfSIG>();
    }
    static const identity<TypeOfDONE> getValueType(output_DONE) {
      return identity<TypeOfDONE>();
    }

    TypeOfSIG _output_SIG;

    State state;

    xod__gpio__digital_read_pullup (TypeOfSIG output_SIG) {
        _output_SIG = output_SIG;
    }

    struct ContextObject {

        bool _isInputDirty_UPD;

        bool _isOutputDirty_SIG : 1;
        bool _isOutputDirty_DONE : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_PORT input_UPD" \
                " output_SIG output_DONE");
    }

    TypeOfPORT getValue(Context ctx, identity<input_PORT>) {
        return constant_input_PORT;
    }
    TypeOfUPD getValue(Context ctx, identity<input_UPD>) {
        return Pulse();
    }
    TypeOfSIG getValue(Context ctx, identity<output_SIG>) {
        return this->_output_SIG;
    }
    TypeOfDONE getValue(Context ctx, identity<output_DONE>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_UPD");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_UPD>) {
        return ctx->_isInputDirty_UPD;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_SIG output_DONE");
    }

    void emitValue(Context ctx, TypeOfSIG val, identity<output_SIG>) {
        this->_output_SIG = val;
        ctx->_isOutputDirty_SIG = true;
    }
    void emitValue(Context ctx, TypeOfDONE val, identity<output_DONE>) {
        ctx->_isOutputDirty_DONE = true;
    }

    void evaluate(Context ctx) {
        static_assert(isValidDigitalPort(constant_input_PORT), "must be a valid digital port");

        if (!isInputDirty<input_UPD>(ctx))
            return;

        ::pinMode(constant_input_PORT, INPUT_PULLUP);
        emitValue<output_SIG>(ctx, ::digitalRead(constant_input_PORT));
        emitValue<output_DONE>(ctx, 1);
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/subtract implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__subtract {

    typedef Number TypeOfIN1;
    typedef Number TypeOfIN2;

    typedef Number TypeOfOUT;

    //#pragma XOD dirtieness disable

    struct State {
    };

    struct input_IN1 { };
    struct input_IN2 { };
    struct output_OUT { };

    static const identity<TypeOfIN1> getValueType(input_IN1) {
      return identity<TypeOfIN1>();
    }
    static const identity<TypeOfIN2> getValueType(input_IN2) {
      return identity<TypeOfIN2>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    TypeOfOUT _output_OUT;

    State state;

    xod__core__subtract (TypeOfOUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        TypeOfIN1 _input_IN1;
        TypeOfIN2 _input_IN2;

    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN1 input_IN2" \
                " output_OUT");
    }

    TypeOfIN1 getValue(Context ctx, identity<input_IN1>) {
        return ctx->_input_IN1;
    }
    TypeOfIN2 getValue(Context ctx, identity<input_IN2>) {
        return ctx->_input_IN2;
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    void evaluate(Context ctx) {
        auto x = getValue<input_IN1>(ctx);
        auto y = getValue<input_IN2>(ctx);
        emitValue<output_OUT>(ctx, x - y);
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/any implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__any {

    typedef Pulse TypeOfIN1;
    typedef Pulse TypeOfIN2;

    typedef Pulse TypeOfOUT;

    struct State {
    };

    struct input_IN1 { };
    struct input_IN2 { };
    struct output_OUT { };

    static const identity<TypeOfIN1> getValueType(input_IN1) {
      return identity<TypeOfIN1>();
    }
    static const identity<TypeOfIN2> getValueType(input_IN2) {
      return identity<TypeOfIN2>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    State state;

    xod__core__any () {
    }

    struct ContextObject {

        bool _isInputDirty_IN1;
        bool _isInputDirty_IN2;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN1 input_IN2" \
                " output_OUT");
    }

    TypeOfIN1 getValue(Context ctx, identity<input_IN1>) {
        return Pulse();
    }
    TypeOfIN2 getValue(Context ctx, identity<input_IN2>) {
        return Pulse();
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_IN1 input_IN2");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_IN1>) {
        return ctx->_isInputDirty_IN1;
    }
    bool isInputDirty(Context ctx, identity<input_IN2>) {
        return ctx->_isInputDirty_IN2;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        ctx->_isOutputDirty_OUT = true;
    }

    void evaluate(Context ctx) {
        bool p1 = isInputDirty<input_IN1>(ctx);
        bool p2 = isInputDirty<input_IN2>(ctx);
        if (p1 || p2)
            emitValue<output_OUT>(ctx, true);
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/math/map implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__math__map {

    typedef Number TypeOfX;
    typedef Number TypeOfSmin;
    typedef Number TypeOfSmax;
    typedef Number TypeOfTmin;
    typedef Number TypeOfTmax;

    typedef Number TypeOfOUT;

    //#pragma XOD dirtieness disable

    struct State {
    };

    struct input_X { };
    struct input_Smin { };
    struct input_Smax { };
    struct input_Tmin { };
    struct input_Tmax { };
    struct output_OUT { };

    static const identity<TypeOfX> getValueType(input_X) {
      return identity<TypeOfX>();
    }
    static const identity<TypeOfSmin> getValueType(input_Smin) {
      return identity<TypeOfSmin>();
    }
    static const identity<TypeOfSmax> getValueType(input_Smax) {
      return identity<TypeOfSmax>();
    }
    static const identity<TypeOfTmin> getValueType(input_Tmin) {
      return identity<TypeOfTmin>();
    }
    static const identity<TypeOfTmax> getValueType(input_Tmax) {
      return identity<TypeOfTmax>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    TypeOfOUT _output_OUT;

    State state;

    xod__math__map (TypeOfOUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        TypeOfX _input_X;
        TypeOfSmin _input_Smin;
        TypeOfSmax _input_Smax;
        TypeOfTmin _input_Tmin;
        TypeOfTmax _input_Tmax;

    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_X input_Smin input_Smax input_Tmin input_Tmax" \
                " output_OUT");
    }

    TypeOfX getValue(Context ctx, identity<input_X>) {
        return ctx->_input_X;
    }
    TypeOfSmin getValue(Context ctx, identity<input_Smin>) {
        return ctx->_input_Smin;
    }
    TypeOfSmax getValue(Context ctx, identity<input_Smax>) {
        return ctx->_input_Smax;
    }
    TypeOfTmin getValue(Context ctx, identity<input_Tmin>) {
        return ctx->_input_Tmin;
    }
    TypeOfTmax getValue(Context ctx, identity<input_Tmax>) {
        return ctx->_input_Tmax;
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        this->_output_OUT = val;
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

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/not implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__not {

    typedef Logic TypeOfIN;

    typedef Logic TypeOfOUT;

    //#pragma XOD dirtieness disable

    struct State {
    };

    struct input_IN { };
    struct output_OUT { };

    static const identity<TypeOfIN> getValueType(input_IN) {
      return identity<TypeOfIN>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    TypeOfOUT _output_OUT;

    State state;

    xod__core__not (TypeOfOUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        TypeOfIN _input_IN;

    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN" \
                " output_OUT");
    }

    TypeOfIN getValue(Context ctx, identity<input_IN>) {
        return ctx->_input_IN;
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    void evaluate(Context ctx) {
        auto x = getValue<input_IN>(ctx);
        emitValue<output_OUT>(ctx, !x);
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/less implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__less {

    typedef Number TypeOfIN1;
    typedef Number TypeOfIN2;

    typedef Logic TypeOfOUT;

    //#pragma XOD dirtieness disable

    struct State {};

    struct input_IN1 { };
    struct input_IN2 { };
    struct output_OUT { };

    static const identity<TypeOfIN1> getValueType(input_IN1) {
      return identity<TypeOfIN1>();
    }
    static const identity<TypeOfIN2> getValueType(input_IN2) {
      return identity<TypeOfIN2>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    TypeOfOUT _output_OUT;

    State state;

    xod__core__less (TypeOfOUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        TypeOfIN1 _input_IN1;
        TypeOfIN2 _input_IN2;

    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN1 input_IN2" \
                " output_OUT");
    }

    TypeOfIN1 getValue(Context ctx, identity<input_IN1>) {
        return ctx->_input_IN1;
    }
    TypeOfIN2 getValue(Context ctx, identity<input_IN2>) {
        return ctx->_input_IN2;
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    void evaluate(Context ctx) {
        auto lhs = getValue<input_IN1>(ctx);
        auto rhs = getValue<input_IN2>(ctx);
        emitValue<output_OUT>(ctx, lhs < rhs);
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/cast-to-string(number) implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__cast_to_string__number {

    typedef Number TypeOfIN;

    typedef XString TypeOfOUT;

    //#pragma XOD dirtieness disable

    struct State {
        char str[16];
        CStringView view;
        State() : view(str) { }
    };

    struct input_IN { };
    struct output_OUT { };

    static const identity<TypeOfIN> getValueType(input_IN) {
      return identity<TypeOfIN>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    TypeOfOUT _output_OUT;

    State state;

    xod__core__cast_to_string__number (TypeOfOUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        TypeOfIN _input_IN;

    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN" \
                " output_OUT");
    }

    TypeOfIN getValue(Context ctx, identity<input_IN>) {
        return ctx->_input_IN;
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    void evaluate(Context ctx) {
        auto state = getState(ctx);
        auto num = getValue<input_IN>(ctx);
        formatNumber(num, 2, state->str);
        emitValue<output_OUT>(ctx, XString(&state->view));
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/debounce(boolean) implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__debounce__boolean {

    typedef Logic TypeOfST;
    typedef Number TypeOfTs;

    typedef Logic TypeOfOUT;

    struct State {
        bool state = false;
    };

    struct input_ST { };
    struct input_Ts { };
    struct output_OUT { };

    static const identity<TypeOfST> getValueType(input_ST) {
      return identity<TypeOfST>();
    }
    static const identity<TypeOfTs> getValueType(input_Ts) {
      return identity<TypeOfTs>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    TimeMs timeoutAt = 0;

    TypeOfOUT _output_OUT;

    State state;

    xod__core__debounce__boolean (TypeOfOUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        TypeOfST _input_ST;
        TypeOfTs _input_Ts;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    void setTimeout(__attribute__((unused)) Context ctx, TimeMs timeout) {
        this->timeoutAt = transactionTime() + timeout;
    }

    void clearTimeout(__attribute__((unused)) Context ctx) {
        detail::clearTimeout(this);
    }

    bool isTimedOut(__attribute__((unused)) const Context ctx) {
        return detail::isTimedOut(this);
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_ST input_Ts" \
                " output_OUT");
    }

    TypeOfST getValue(Context ctx, identity<input_ST>) {
        return ctx->_input_ST;
    }
    TypeOfTs getValue(Context ctx, identity<input_Ts>) {
        return ctx->_input_Ts;
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        this->_output_OUT = val;
        ctx->_isOutputDirty_OUT = true;
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

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/greater implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__greater {

    typedef Number TypeOfIN1;
    typedef Number TypeOfIN2;

    typedef Logic TypeOfOUT;

    //#pragma XOD dirtieness disable

    struct State {
    };

    struct input_IN1 { };
    struct input_IN2 { };
    struct output_OUT { };

    static const identity<TypeOfIN1> getValueType(input_IN1) {
      return identity<TypeOfIN1>();
    }
    static const identity<TypeOfIN2> getValueType(input_IN2) {
      return identity<TypeOfIN2>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    TypeOfOUT _output_OUT;

    State state;

    xod__core__greater (TypeOfOUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        TypeOfIN1 _input_IN1;
        TypeOfIN2 _input_IN2;

    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN1 input_IN2" \
                " output_OUT");
    }

    TypeOfIN1 getValue(Context ctx, identity<input_IN1>) {
        return ctx->_input_IN1;
    }
    TypeOfIN2 getValue(Context ctx, identity<input_IN2>) {
        return ctx->_input_IN2;
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    void evaluate(Context ctx) {
        auto lhs = getValue<input_IN1>(ctx);
        auto rhs = getValue<input_IN2>(ctx);
        emitValue<output_OUT>(ctx, lhs > rhs);
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/gate(pulse) implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__gate__pulse {

    typedef Pulse TypeOfIN;
    typedef Logic TypeOfEN;

    typedef Pulse TypeOfOUT;

    struct State {
    };

    struct input_IN { };
    struct input_EN { };
    struct output_OUT { };

    static const identity<TypeOfIN> getValueType(input_IN) {
      return identity<TypeOfIN>();
    }
    static const identity<TypeOfEN> getValueType(input_EN) {
      return identity<TypeOfEN>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    State state;

    xod__core__gate__pulse () {
    }

    struct ContextObject {

        TypeOfEN _input_EN;

        bool _isInputDirty_IN;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN input_EN" \
                " output_OUT");
    }

    TypeOfIN getValue(Context ctx, identity<input_IN>) {
        return Pulse();
    }
    TypeOfEN getValue(Context ctx, identity<input_EN>) {
        return ctx->_input_EN;
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_IN");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_IN>) {
        return ctx->_isInputDirty_IN;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        ctx->_isOutputDirty_OUT = true;
    }

    void evaluate(Context ctx) {
        if (getValue<input_EN>(ctx) && isInputDirty<input_IN>(ctx))
            emitValue<output_OUT>(ctx, true);
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/if-else(number) implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__if_else__number {

    typedef Logic TypeOfCOND;
    typedef Number TypeOfT;
    typedef Number TypeOfF;

    typedef Number TypeOfR;

    //#pragma XOD dirtieness disable

    struct State {
    };

    struct input_COND { };
    struct input_T { };
    struct input_F { };
    struct output_R { };

    static const identity<TypeOfCOND> getValueType(input_COND) {
      return identity<TypeOfCOND>();
    }
    static const identity<TypeOfT> getValueType(input_T) {
      return identity<TypeOfT>();
    }
    static const identity<TypeOfF> getValueType(input_F) {
      return identity<TypeOfF>();
    }
    static const identity<TypeOfR> getValueType(output_R) {
      return identity<TypeOfR>();
    }

    TypeOfR _output_R;

    State state;

    xod__core__if_else__number (TypeOfR output_R) {
        _output_R = output_R;
    }

    struct ContextObject {

        TypeOfCOND _input_COND;
        TypeOfT _input_T;
        TypeOfF _input_F;

    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_COND input_T input_F" \
                " output_R");
    }

    TypeOfCOND getValue(Context ctx, identity<input_COND>) {
        return ctx->_input_COND;
    }
    TypeOfT getValue(Context ctx, identity<input_T>) {
        return ctx->_input_T;
    }
    TypeOfF getValue(Context ctx, identity<input_F>) {
        return ctx->_input_F;
    }
    TypeOfR getValue(Context ctx, identity<output_R>) {
        return this->_output_R;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_R");
    }

    void emitValue(Context ctx, TypeOfR val, identity<output_R>) {
        this->_output_R = val;
    }

    void evaluate(Context ctx) {
        auto cond = getValue<input_COND>(ctx);
        auto trueVal = getValue<input_T>(ctx);
        auto falseVal = getValue<input_F>(ctx);
        emitValue<output_R>(ctx, cond ? trueVal : falseVal);
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/concat implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__concat {

    typedef XString TypeOfIN1;
    typedef XString TypeOfIN2;

    typedef XString TypeOfOUT;

    //#pragma XOD dirtieness disable

    struct State {
        ConcatListView<char> view;
    };

    struct input_IN1 { };
    struct input_IN2 { };
    struct output_OUT { };

    static const identity<TypeOfIN1> getValueType(input_IN1) {
      return identity<TypeOfIN1>();
    }
    static const identity<TypeOfIN2> getValueType(input_IN2) {
      return identity<TypeOfIN2>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    TypeOfOUT _output_OUT;

    State state;

    xod__core__concat (TypeOfOUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        TypeOfIN1 _input_IN1;
        TypeOfIN2 _input_IN2;

    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN1 input_IN2" \
                " output_OUT");
    }

    TypeOfIN1 getValue(Context ctx, identity<input_IN1>) {
        return ctx->_input_IN1;
    }
    TypeOfIN2 getValue(Context ctx, identity<input_IN2>) {
        return ctx->_input_IN2;
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    void evaluate(Context ctx) {
        auto state = getState(ctx);
        auto head = getValue<input_IN1>(ctx);
        auto tail = getValue<input_IN2>(ctx);
        state->view = ConcatListView<char>(head, tail);
        emitValue<output_OUT>(ctx, XString(&state->view));
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/pulse-on-true implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__pulse_on_true {

    typedef Logic TypeOfIN;

    typedef Pulse TypeOfOUT;

    struct State {
      bool state = false;
    };

    struct input_IN { };
    struct output_OUT { };

    static const identity<TypeOfIN> getValueType(input_IN) {
      return identity<TypeOfIN>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    State state;

    xod__core__pulse_on_true () {
    }

    struct ContextObject {

        TypeOfIN _input_IN;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN" \
                " output_OUT");
    }

    TypeOfIN getValue(Context ctx, identity<input_IN>) {
        return ctx->_input_IN;
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        ctx->_isOutputDirty_OUT = true;
    }

    void evaluate(Context ctx) {
        State* state = getState(ctx);
        auto newValue = getValue<input_IN>(ctx);

        if (!isSettingUp() && newValue == true && state->state == false)
            emitValue<output_OUT>(ctx, 1);

        state->state = newValue;
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/and implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__and {

    typedef Logic TypeOfIN1;
    typedef Logic TypeOfIN2;

    typedef Logic TypeOfOUT;

    //#pragma XOD dirtieness disable

    struct State {
    };

    struct input_IN1 { };
    struct input_IN2 { };
    struct output_OUT { };

    static const identity<TypeOfIN1> getValueType(input_IN1) {
      return identity<TypeOfIN1>();
    }
    static const identity<TypeOfIN2> getValueType(input_IN2) {
      return identity<TypeOfIN2>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    TypeOfOUT _output_OUT;

    State state;

    xod__core__and (TypeOfOUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        TypeOfIN1 _input_IN1;
        TypeOfIN2 _input_IN2;

    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN1 input_IN2" \
                " output_OUT");
    }

    TypeOfIN1 getValue(Context ctx, identity<input_IN1>) {
        return ctx->_input_IN1;
    }
    TypeOfIN2 getValue(Context ctx, identity<input_IN2>) {
        return ctx->_input_IN2;
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    void evaluate(Context ctx) {
        auto a = getValue<input_IN1>(ctx);
        auto b = getValue<input_IN2>(ctx);
        emitValue<output_OUT>(ctx, a && b);
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/if-else(string) implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__if_else__string {

    typedef Logic TypeOfCOND;
    typedef XString TypeOfT;
    typedef XString TypeOfF;

    typedef XString TypeOfR;

    //#pragma XOD dirtieness disable

    struct State {
    };

    struct input_COND { };
    struct input_T { };
    struct input_F { };
    struct output_R { };

    static const identity<TypeOfCOND> getValueType(input_COND) {
      return identity<TypeOfCOND>();
    }
    static const identity<TypeOfT> getValueType(input_T) {
      return identity<TypeOfT>();
    }
    static const identity<TypeOfF> getValueType(input_F) {
      return identity<TypeOfF>();
    }
    static const identity<TypeOfR> getValueType(output_R) {
      return identity<TypeOfR>();
    }

    TypeOfR _output_R;

    State state;

    xod__core__if_else__string (TypeOfR output_R) {
        _output_R = output_R;
    }

    struct ContextObject {

        TypeOfCOND _input_COND;
        TypeOfT _input_T;
        TypeOfF _input_F;

    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_COND input_T input_F" \
                " output_R");
    }

    TypeOfCOND getValue(Context ctx, identity<input_COND>) {
        return ctx->_input_COND;
    }
    TypeOfT getValue(Context ctx, identity<input_T>) {
        return ctx->_input_T;
    }
    TypeOfF getValue(Context ctx, identity<input_F>) {
        return ctx->_input_F;
    }
    TypeOfR getValue(Context ctx, identity<output_R>) {
        return this->_output_R;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_R");
    }

    void emitValue(Context ctx, TypeOfR val, identity<output_R>) {
        this->_output_R = val;
    }

    void evaluate(Context ctx) {
        auto cond = getValue<input_COND>(ctx);
        auto trueVal = getValue<input_T>(ctx);
        auto falseVal = getValue<input_F>(ctx);
        emitValue<output_R>(ctx, cond ? trueVal : falseVal);
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod-dev/text-lcd/set-backlight implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod_dev__text_lcd__set_backlight {

    typedef xod_dev__text_lcd__text_lcd_i2c_device::Type TypeOfDEV;
    typedef Logic TypeOfBL;
    typedef Pulse TypeOfDO;

    typedef xod_dev__text_lcd__text_lcd_i2c_device::Type TypeOfDEVU0027;
    typedef Pulse TypeOfDONE;

    struct State {
    };

    struct input_DEV { };
    struct input_BL { };
    struct input_DO { };
    struct output_DEVU0027 { };
    struct output_DONE { };

    static const identity<TypeOfDEV> getValueType(input_DEV) {
      return identity<TypeOfDEV>();
    }
    static const identity<TypeOfBL> getValueType(input_BL) {
      return identity<TypeOfBL>();
    }
    static const identity<TypeOfDO> getValueType(input_DO) {
      return identity<TypeOfDO>();
    }
    static const identity<TypeOfDEVU0027> getValueType(output_DEVU0027) {
      return identity<TypeOfDEVU0027>();
    }
    static const identity<TypeOfDONE> getValueType(output_DONE) {
      return identity<TypeOfDONE>();
    }

    TypeOfDEVU0027 _output_DEVU0027;

    State state;

    xod_dev__text_lcd__set_backlight (TypeOfDEVU0027 output_DEVU0027) {
        _output_DEVU0027 = output_DEVU0027;
    }

    struct ContextObject {

        TypeOfDEV _input_DEV;
        TypeOfBL _input_BL;

        bool _isInputDirty_DO;

        bool _isOutputDirty_DEVU0027 : 1;
        bool _isOutputDirty_DONE : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_DEV input_BL input_DO" \
                " output_DEVU0027 output_DONE");
    }

    TypeOfDEV getValue(Context ctx, identity<input_DEV>) {
        return ctx->_input_DEV;
    }
    TypeOfBL getValue(Context ctx, identity<input_BL>) {
        return ctx->_input_BL;
    }
    TypeOfDO getValue(Context ctx, identity<input_DO>) {
        return Pulse();
    }
    TypeOfDEVU0027 getValue(Context ctx, identity<output_DEVU0027>) {
        return this->_output_DEVU0027;
    }
    TypeOfDONE getValue(Context ctx, identity<output_DONE>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_DO");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_DO>) {
        return ctx->_isInputDirty_DO;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_DEVU0027 output_DONE");
    }

    void emitValue(Context ctx, TypeOfDEVU0027 val, identity<output_DEVU0027>) {
        this->_output_DEVU0027 = val;
        ctx->_isOutputDirty_DEVU0027 = true;
    }
    void emitValue(Context ctx, TypeOfDONE val, identity<output_DONE>) {
        ctx->_isOutputDirty_DONE = true;
    }

    void evaluate(Context ctx) {
        auto t = getValue<input_DEV>(ctx);
        if (isInputDirty<input_DO>(ctx)) {
            t.lcd->setBacklight(getValue<input_BL>(ctx));
            emitValue<output_DONE>(ctx, 1);
        }

        emitValue<output_DEVU0027>(ctx, t);
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/math/cube implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__math__cube {

    typedef Number TypeOfIN;

    typedef Number TypeOfOUT;

    //#pragma XOD dirtieness disable

    struct State {
    };

    struct input_IN { };
    struct output_OUT { };

    static const identity<TypeOfIN> getValueType(input_IN) {
      return identity<TypeOfIN>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    TypeOfOUT _output_OUT;

    State state;

    xod__math__cube (TypeOfOUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        TypeOfIN _input_IN;

    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN" \
                " output_OUT");
    }

    TypeOfIN getValue(Context ctx, identity<input_IN>) {
        return ctx->_input_IN;
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    void evaluate(Context ctx) {
        Number x = getValue<input_IN>(ctx);
        emitValue<output_OUT>(ctx, x * x * x);
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/pulse-on-change(number) implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__pulse_on_change__number {

    typedef Number TypeOfIN;

    typedef Pulse TypeOfOUT;

    struct State {
        Number sample = NAN;
    };

    struct input_IN { };
    struct output_OUT { };

    static const identity<TypeOfIN> getValueType(input_IN) {
      return identity<TypeOfIN>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    State state;

    xod__core__pulse_on_change__number () {
    }

    struct ContextObject {

        TypeOfIN _input_IN;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN" \
                " output_OUT");
    }

    TypeOfIN getValue(Context ctx, identity<input_IN>) {
        return ctx->_input_IN;
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        ctx->_isOutputDirty_OUT = true;
    }

    void evaluate(Context ctx) {
        State* state = getState(ctx);
        auto newValue = getValue<input_IN>(ctx);

        if (!isSettingUp() && newValue != state->sample)
            emitValue<output_OUT>(ctx, 1);

        state->sample = newValue;
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/flip-flop implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__flip_flop {

    typedef Pulse TypeOfSET;
    typedef Pulse TypeOfTGL;
    typedef Pulse TypeOfRST;

    typedef Logic TypeOfMEM;

    struct State {
    };

    struct input_SET { };
    struct input_TGL { };
    struct input_RST { };
    struct output_MEM { };

    static const identity<TypeOfSET> getValueType(input_SET) {
      return identity<TypeOfSET>();
    }
    static const identity<TypeOfTGL> getValueType(input_TGL) {
      return identity<TypeOfTGL>();
    }
    static const identity<TypeOfRST> getValueType(input_RST) {
      return identity<TypeOfRST>();
    }
    static const identity<TypeOfMEM> getValueType(output_MEM) {
      return identity<TypeOfMEM>();
    }

    TypeOfMEM _output_MEM;

    State state;

    xod__core__flip_flop (TypeOfMEM output_MEM) {
        _output_MEM = output_MEM;
    }

    struct ContextObject {

        bool _isInputDirty_SET;
        bool _isInputDirty_TGL;
        bool _isInputDirty_RST;

        bool _isOutputDirty_MEM : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_SET input_TGL input_RST" \
                " output_MEM");
    }

    TypeOfSET getValue(Context ctx, identity<input_SET>) {
        return Pulse();
    }
    TypeOfTGL getValue(Context ctx, identity<input_TGL>) {
        return Pulse();
    }
    TypeOfRST getValue(Context ctx, identity<input_RST>) {
        return Pulse();
    }
    TypeOfMEM getValue(Context ctx, identity<output_MEM>) {
        return this->_output_MEM;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_SET input_TGL input_RST");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_SET>) {
        return ctx->_isInputDirty_SET;
    }
    bool isInputDirty(Context ctx, identity<input_TGL>) {
        return ctx->_isInputDirty_TGL;
    }
    bool isInputDirty(Context ctx, identity<input_RST>) {
        return ctx->_isInputDirty_RST;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_MEM");
    }

    void emitValue(Context ctx, TypeOfMEM val, identity<output_MEM>) {
        this->_output_MEM = val;
        ctx->_isOutputDirty_MEM = true;
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

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/or implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__or {

    typedef Logic TypeOfIN1;
    typedef Logic TypeOfIN2;

    typedef Logic TypeOfOUT;

    //#pragma XOD dirtieness disable

    struct State {
    };

    struct input_IN1 { };
    struct input_IN2 { };
    struct output_OUT { };

    static const identity<TypeOfIN1> getValueType(input_IN1) {
      return identity<TypeOfIN1>();
    }
    static const identity<TypeOfIN2> getValueType(input_IN2) {
      return identity<TypeOfIN2>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    TypeOfOUT _output_OUT;

    State state;

    xod__core__or (TypeOfOUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        TypeOfIN1 _input_IN1;
        TypeOfIN2 _input_IN2;

    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN1 input_IN2" \
                " output_OUT");
    }

    TypeOfIN1 getValue(Context ctx, identity<input_IN1>) {
        return ctx->_input_IN1;
    }
    TypeOfIN2 getValue(Context ctx, identity<input_IN2>) {
        return ctx->_input_IN2;
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    void evaluate(Context ctx) {
        auto a = getValue<input_IN1>(ctx);
        auto b = getValue<input_IN2>(ctx);
        emitValue<output_OUT>(ctx, a || b);
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/clock implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__clock {

    typedef Logic TypeOfEN;
    typedef Number TypeOfIVAL;
    typedef Pulse TypeOfRST;

    typedef Pulse TypeOfTICK;

    struct State {
      TimeMs nextTrig;
    };

    struct input_EN { };
    struct input_IVAL { };
    struct input_RST { };
    struct output_TICK { };

    static const identity<TypeOfEN> getValueType(input_EN) {
      return identity<TypeOfEN>();
    }
    static const identity<TypeOfIVAL> getValueType(input_IVAL) {
      return identity<TypeOfIVAL>();
    }
    static const identity<TypeOfRST> getValueType(input_RST) {
      return identity<TypeOfRST>();
    }
    static const identity<TypeOfTICK> getValueType(output_TICK) {
      return identity<TypeOfTICK>();
    }

    TimeMs timeoutAt = 0;

    State state;

    xod__core__clock () {
    }

    struct ContextObject {

        TypeOfEN _input_EN;
        TypeOfIVAL _input_IVAL;

        bool _isInputDirty_EN;
        bool _isInputDirty_RST;

        bool _isOutputDirty_TICK : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    void setTimeout(__attribute__((unused)) Context ctx, TimeMs timeout) {
        this->timeoutAt = transactionTime() + timeout;
    }

    void clearTimeout(__attribute__((unused)) Context ctx) {
        detail::clearTimeout(this);
    }

    bool isTimedOut(__attribute__((unused)) const Context ctx) {
        return detail::isTimedOut(this);
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_EN input_IVAL input_RST" \
                " output_TICK");
    }

    TypeOfEN getValue(Context ctx, identity<input_EN>) {
        return ctx->_input_EN;
    }
    TypeOfIVAL getValue(Context ctx, identity<input_IVAL>) {
        return ctx->_input_IVAL;
    }
    TypeOfRST getValue(Context ctx, identity<input_RST>) {
        return Pulse();
    }
    TypeOfTICK getValue(Context ctx, identity<output_TICK>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_EN input_RST");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_EN>) {
        return ctx->_isInputDirty_EN;
    }
    bool isInputDirty(Context ctx, identity<input_RST>) {
        return ctx->_isInputDirty_RST;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_TICK");
    }

    void emitValue(Context ctx, TypeOfTICK val, identity<output_TICK>) {
        ctx->_isOutputDirty_TICK = true;
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

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/if-error(string) implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__if_error__string {

    typedef XString TypeOfIN;
    typedef XString TypeOfDEF;

    typedef XString TypeOfOUT;

    //#pragma XOD error_raise enable
    //#pragma XOD error_catch enable

    struct State {
    };

    struct input_IN { };
    struct input_DEF { };
    struct output_OUT { };

    static const identity<TypeOfIN> getValueType(input_IN) {
      return identity<TypeOfIN>();
    }
    static const identity<TypeOfDEF> getValueType(input_DEF) {
      return identity<TypeOfDEF>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    union NodeErrors {
        struct {
            bool output_OUT : 1;
        };

        ErrorFlags flags = 0;
    };

    NodeErrors errors = {};

    TypeOfOUT _output_OUT;

    State state;

    xod__core__if_error__string (TypeOfOUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {
        uint8_t _error_input_IN;
        uint8_t _error_input_DEF;

        TypeOfIN _input_IN;
        TypeOfDEF _input_DEF;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN input_DEF" \
                " output_OUT");
    }

    TypeOfIN getValue(Context ctx, identity<input_IN>) {
        return ctx->_input_IN;
    }
    TypeOfDEF getValue(Context ctx, identity<input_DEF>) {
        return ctx->_input_DEF;
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        this->_output_OUT = val;
        ctx->_isOutputDirty_OUT = true;
        this->errors.output_OUT = false;
    }

    template<typename OutputT> void raiseError(Context ctx) {
        raiseError(ctx, identity<OutputT>());
    }

    template<typename OutputT> void raiseError(Context ctx, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void raiseError(Context ctx, identity<output_OUT>) {
        this->errors.output_OUT = true;
        ctx->_isOutputDirty_OUT = true;
    }

    void raiseError(Context ctx) {
        this->errors.output_OUT = true;
        ctx->_isOutputDirty_OUT = true;
    }

    template<typename InputT> uint8_t getError(Context ctx) {
        return getError(ctx, identity<InputT>());
    }

    template<typename InputT> uint8_t getError(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_IN input_DEF");
        return 0;
    }

    uint8_t getError(Context ctx, identity<input_IN>) {
        return ctx->_error_input_IN;
    }
    uint8_t getError(Context ctx, identity<input_DEF>) {
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

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/gpio/pwm-write implementation
//-----------------------------------------------------------------------------

namespace xod {
template <uint8_t constant_input_PORT>
struct xod__gpio__pwm_write {

    typedef uint8_t TypeOfPORT;
    typedef Number TypeOfDUTY;
    typedef Pulse TypeOfUPD;

    typedef Pulse TypeOfDONE;

    //#pragma XOD evaluate_on_pin disable
    //#pragma XOD evaluate_on_pin enable input_UPD

    struct State {
    };

    struct input_PORT { };
    struct input_DUTY { };
    struct input_UPD { };
    struct output_DONE { };

    static const identity<TypeOfPORT> getValueType(input_PORT) {
      return identity<TypeOfPORT>();
    }
    static const identity<TypeOfDUTY> getValueType(input_DUTY) {
      return identity<TypeOfDUTY>();
    }
    static const identity<TypeOfUPD> getValueType(input_UPD) {
      return identity<TypeOfUPD>();
    }
    static const identity<TypeOfDONE> getValueType(output_DONE) {
      return identity<TypeOfDONE>();
    }

    State state;

    xod__gpio__pwm_write () {
    }

    struct ContextObject {

        TypeOfDUTY _input_DUTY;

        bool _isInputDirty_UPD;

        bool _isOutputDirty_DONE : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_PORT input_DUTY input_UPD" \
                " output_DONE");
    }

    TypeOfPORT getValue(Context ctx, identity<input_PORT>) {
        return constant_input_PORT;
    }
    TypeOfDUTY getValue(Context ctx, identity<input_DUTY>) {
        return ctx->_input_DUTY;
    }
    TypeOfUPD getValue(Context ctx, identity<input_UPD>) {
        return Pulse();
    }
    TypeOfDONE getValue(Context ctx, identity<output_DONE>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_UPD");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_UPD>) {
        return ctx->_isInputDirty_UPD;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_DONE");
    }

    void emitValue(Context ctx, TypeOfDONE val, identity<output_DONE>) {
        ctx->_isOutputDirty_DONE = true;
    }

    #ifdef PWMRANGE
    static constexpr Number pwmRange = PWMRANGE;
    #else
    static constexpr Number pwmRange = 255.0;
    #endif

    void evaluate(Context ctx) {
        static_assert(isValidDigitalPort(constant_input_PORT), "must be a valid digital port");

        if (!isInputDirty<input_UPD>(ctx))
            return;

        const uint8_t port = getValue<input_PORT>(ctx);

        auto duty = getValue<input_DUTY>(ctx);
        duty = duty > 1 ? 1 : (duty < 0 ? 0 : duty);
        int val = (int)(duty * pwmRange);

        ::pinMode(port, OUTPUT);
        ::analogWrite(port, val);
        emitValue<output_DONE>(ctx, 1);
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/count implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__count {

    typedef Number TypeOfSTEP;
    typedef Pulse TypeOfINC;
    typedef Pulse TypeOfRST;

    typedef Number TypeOfOUT;

    struct State {
    };

    struct input_STEP { };
    struct input_INC { };
    struct input_RST { };
    struct output_OUT { };

    static const identity<TypeOfSTEP> getValueType(input_STEP) {
      return identity<TypeOfSTEP>();
    }
    static const identity<TypeOfINC> getValueType(input_INC) {
      return identity<TypeOfINC>();
    }
    static const identity<TypeOfRST> getValueType(input_RST) {
      return identity<TypeOfRST>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    TypeOfOUT _output_OUT;

    State state;

    xod__core__count (TypeOfOUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        TypeOfSTEP _input_STEP;

        bool _isInputDirty_INC;
        bool _isInputDirty_RST;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_STEP input_INC input_RST" \
                " output_OUT");
    }

    TypeOfSTEP getValue(Context ctx, identity<input_STEP>) {
        return ctx->_input_STEP;
    }
    TypeOfINC getValue(Context ctx, identity<input_INC>) {
        return Pulse();
    }
    TypeOfRST getValue(Context ctx, identity<input_RST>) {
        return Pulse();
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_INC input_RST");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_INC>) {
        return ctx->_isInputDirty_INC;
    }
    bool isInputDirty(Context ctx, identity<input_RST>) {
        return ctx->_isInputDirty_RST;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        this->_output_OUT = val;
        ctx->_isOutputDirty_OUT = true;
    }

    void evaluate(Context ctx) {
        Number count = getValue<output_OUT>(ctx);

        if (isInputDirty<input_RST>(ctx))
            count = 0;
        else if (isInputDirty<input_INC>(ctx))
            count += getValue<input_STEP>(ctx);

        emitValue<output_OUT>(ctx, count);
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/square-wave implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__square_wave {

    typedef Number TypeOfT;
    typedef Number TypeOfDUTY;
    typedef Logic TypeOfEN;
    typedef Pulse TypeOfRST;

    typedef Logic TypeOfOUT;
    typedef Number TypeOfN;

    struct State {
        bool wasEnabled;
        TimeMs timeToSwitch;
        TimeMs nextSwitchTime;
    };

    struct input_T { };
    struct input_DUTY { };
    struct input_EN { };
    struct input_RST { };
    struct output_OUT { };
    struct output_N { };

    static const identity<TypeOfT> getValueType(input_T) {
      return identity<TypeOfT>();
    }
    static const identity<TypeOfDUTY> getValueType(input_DUTY) {
      return identity<TypeOfDUTY>();
    }
    static const identity<TypeOfEN> getValueType(input_EN) {
      return identity<TypeOfEN>();
    }
    static const identity<TypeOfRST> getValueType(input_RST) {
      return identity<TypeOfRST>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }
    static const identity<TypeOfN> getValueType(output_N) {
      return identity<TypeOfN>();
    }

    TimeMs timeoutAt = 0;

    TypeOfOUT _output_OUT;
    TypeOfN _output_N;

    State state;

    xod__core__square_wave (TypeOfOUT output_OUT, TypeOfN output_N) {
        _output_OUT = output_OUT;
        _output_N = output_N;
    }

    struct ContextObject {

        TypeOfT _input_T;
        TypeOfDUTY _input_DUTY;
        TypeOfEN _input_EN;

        bool _isInputDirty_RST;

        bool _isOutputDirty_OUT : 1;
        bool _isOutputDirty_N : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    void setTimeout(__attribute__((unused)) Context ctx, TimeMs timeout) {
        this->timeoutAt = transactionTime() + timeout;
    }

    void clearTimeout(__attribute__((unused)) Context ctx) {
        detail::clearTimeout(this);
    }

    bool isTimedOut(__attribute__((unused)) const Context ctx) {
        return detail::isTimedOut(this);
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_T input_DUTY input_EN input_RST" \
                " output_OUT output_N");
    }

    TypeOfT getValue(Context ctx, identity<input_T>) {
        return ctx->_input_T;
    }
    TypeOfDUTY getValue(Context ctx, identity<input_DUTY>) {
        return ctx->_input_DUTY;
    }
    TypeOfEN getValue(Context ctx, identity<input_EN>) {
        return ctx->_input_EN;
    }
    TypeOfRST getValue(Context ctx, identity<input_RST>) {
        return Pulse();
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }
    TypeOfN getValue(Context ctx, identity<output_N>) {
        return this->_output_N;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_RST");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_RST>) {
        return ctx->_isInputDirty_RST;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT output_N");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        this->_output_OUT = val;
        ctx->_isOutputDirty_OUT = true;
    }
    void emitValue(Context ctx, TypeOfN val, identity<output_N>) {
        this->_output_N = val;
        ctx->_isOutputDirty_N = true;
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

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/pulse-on-change(string) implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__pulse_on_change__string {

    typedef XString TypeOfIN;

    typedef Pulse TypeOfOUT;

    struct State {
        uint8_t prev = 0;
    };

    struct input_IN { };
    struct output_OUT { };

    static const identity<TypeOfIN> getValueType(input_IN) {
      return identity<TypeOfIN>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    State state;

    xod__core__pulse_on_change__string () {
    }

    struct ContextObject {

        TypeOfIN _input_IN;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN" \
                " output_OUT");
    }

    TypeOfIN getValue(Context ctx, identity<input_IN>) {
        return ctx->_input_IN;
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        ctx->_isOutputDirty_OUT = true;
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

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/buffer(number) implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__buffer__number {

    typedef Number TypeOfNEW;
    typedef Pulse TypeOfUPD;

    typedef Number TypeOfMEM;

    //#pragma XOD evaluate_on_pin disable
    //#pragma XOD evaluate_on_pin enable input_UPD

    struct State {
    };

    struct input_NEW { };
    struct input_UPD { };
    struct output_MEM { };

    static const identity<TypeOfNEW> getValueType(input_NEW) {
      return identity<TypeOfNEW>();
    }
    static const identity<TypeOfUPD> getValueType(input_UPD) {
      return identity<TypeOfUPD>();
    }
    static const identity<TypeOfMEM> getValueType(output_MEM) {
      return identity<TypeOfMEM>();
    }

    TypeOfMEM _output_MEM;

    State state;

    xod__core__buffer__number (TypeOfMEM output_MEM) {
        _output_MEM = output_MEM;
    }

    struct ContextObject {

        TypeOfNEW _input_NEW;

        bool _isInputDirty_UPD;

        bool _isOutputDirty_MEM : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_NEW input_UPD" \
                " output_MEM");
    }

    TypeOfNEW getValue(Context ctx, identity<input_NEW>) {
        return ctx->_input_NEW;
    }
    TypeOfUPD getValue(Context ctx, identity<input_UPD>) {
        return Pulse();
    }
    TypeOfMEM getValue(Context ctx, identity<output_MEM>) {
        return this->_output_MEM;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_UPD");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_UPD>) {
        return ctx->_isInputDirty_UPD;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_MEM");
    }

    void emitValue(Context ctx, TypeOfMEM val, identity<output_MEM>) {
        this->_output_MEM = val;
        ctx->_isOutputDirty_MEM = true;
    }

    void evaluate(Context ctx) {
        if (!isInputDirty<input_UPD>(ctx))
            return;

        emitValue<output_MEM>(ctx, getValue<input_NEW>(ctx));
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/cast-to-number(boolean) implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__cast_to_number__boolean {

    typedef Logic TypeOfIN;

    typedef Number TypeOfOUT;

    //#pragma XOD dirtieness disable

    struct State {
    };

    struct input_IN { };
    struct output_OUT { };

    static const identity<TypeOfIN> getValueType(input_IN) {
      return identity<TypeOfIN>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    TypeOfOUT _output_OUT;

    State state;

    xod__core__cast_to_number__boolean (TypeOfOUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {

        TypeOfIN _input_IN;

    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN" \
                " output_OUT");
    }

    TypeOfIN getValue(Context ctx, identity<input_IN>) {
        return ctx->_input_IN;
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        this->_output_OUT = val;
    }

    void evaluate(Context ctx) {
        emitValue<output_OUT>(ctx, getValue<input_IN>(ctx) ? 1.0 : 0.0);
    }

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/branch implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__branch {

    typedef Logic TypeOfGATE;
    typedef Pulse TypeOfTRIG;

    typedef Pulse TypeOfT;
    typedef Pulse TypeOfF;

    //#pragma XOD evaluate_on_pin disable
    //#pragma XOD evaluate_on_pin enable input_TRIG

    struct State {
    };

    struct input_GATE { };
    struct input_TRIG { };
    struct output_T { };
    struct output_F { };

    static const identity<TypeOfGATE> getValueType(input_GATE) {
      return identity<TypeOfGATE>();
    }
    static const identity<TypeOfTRIG> getValueType(input_TRIG) {
      return identity<TypeOfTRIG>();
    }
    static const identity<TypeOfT> getValueType(output_T) {
      return identity<TypeOfT>();
    }
    static const identity<TypeOfF> getValueType(output_F) {
      return identity<TypeOfF>();
    }

    State state;

    xod__core__branch () {
    }

    struct ContextObject {

        TypeOfGATE _input_GATE;

        bool _isInputDirty_TRIG;

        bool _isOutputDirty_T : 1;
        bool _isOutputDirty_F : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_GATE input_TRIG" \
                " output_T output_F");
    }

    TypeOfGATE getValue(Context ctx, identity<input_GATE>) {
        return ctx->_input_GATE;
    }
    TypeOfTRIG getValue(Context ctx, identity<input_TRIG>) {
        return Pulse();
    }
    TypeOfT getValue(Context ctx, identity<output_T>) {
        return Pulse();
    }
    TypeOfF getValue(Context ctx, identity<output_F>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_TRIG");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_TRIG>) {
        return ctx->_isInputDirty_TRIG;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_T output_F");
    }

    void emitValue(Context ctx, TypeOfT val, identity<output_T>) {
        ctx->_isOutputDirty_T = true;
    }
    void emitValue(Context ctx, TypeOfF val, identity<output_F>) {
        ctx->_isOutputDirty_F = true;
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

};
} // namespace xod

//-----------------------------------------------------------------------------
// @/play-note implementation
//-----------------------------------------------------------------------------

namespace xod {
template <uint8_t constant_input_PIN>
struct ____play_note {

    typedef uint8_t TypeOfPIN;
    typedef Number TypeOfFREQ;
    typedef Number TypeOfDUR;
    typedef Pulse TypeOfUPD;

    struct State {
    };

    struct input_PIN { };
    struct input_FREQ { };
    struct input_DUR { };
    struct input_UPD { };

    static const identity<TypeOfPIN> getValueType(input_PIN) {
      return identity<TypeOfPIN>();
    }
    static const identity<TypeOfFREQ> getValueType(input_FREQ) {
      return identity<TypeOfFREQ>();
    }
    static const identity<TypeOfDUR> getValueType(input_DUR) {
      return identity<TypeOfDUR>();
    }
    static const identity<TypeOfUPD> getValueType(input_UPD) {
      return identity<TypeOfUPD>();
    }

    State state;

    ____play_note () {
    }

    struct ContextObject {

        TypeOfFREQ _input_FREQ;
        TypeOfDUR _input_DUR;

        bool _isInputDirty_UPD;

    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_PIN input_FREQ input_DUR input_UPD" \
                "");
    }

    TypeOfPIN getValue(Context ctx, identity<input_PIN>) {
        return constant_input_PIN;
    }
    TypeOfFREQ getValue(Context ctx, identity<input_FREQ>) {
        return ctx->_input_FREQ;
    }
    TypeOfDUR getValue(Context ctx, identity<input_DUR>) {
        return ctx->_input_DUR;
    }
    TypeOfUPD getValue(Context ctx, identity<input_UPD>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_UPD");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_UPD>) {
        return ctx->_isInputDirty_UPD;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                "");
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

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod-dev/text-lcd/print-at(text-lcd-i2c-device) implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod_dev__text_lcd__print_at__text_lcd_i2c_device {

    typedef xod_dev__text_lcd__text_lcd_i2c_device::Type TypeOfDEV;
    typedef Number TypeOfROW;
    typedef Number TypeOfPOS;
    typedef Number TypeOfLEN;
    typedef XString TypeOfVAL;
    typedef Pulse TypeOfDO;

    typedef xod_dev__text_lcd__text_lcd_i2c_device::Type TypeOfDEVU0027;
    typedef Pulse TypeOfDONE;

    struct State {
    };

    struct input_DEV { };
    struct input_ROW { };
    struct input_POS { };
    struct input_LEN { };
    struct input_VAL { };
    struct input_DO { };
    struct output_DEVU0027 { };
    struct output_DONE { };

    static const identity<TypeOfDEV> getValueType(input_DEV) {
      return identity<TypeOfDEV>();
    }
    static const identity<TypeOfROW> getValueType(input_ROW) {
      return identity<TypeOfROW>();
    }
    static const identity<TypeOfPOS> getValueType(input_POS) {
      return identity<TypeOfPOS>();
    }
    static const identity<TypeOfLEN> getValueType(input_LEN) {
      return identity<TypeOfLEN>();
    }
    static const identity<TypeOfVAL> getValueType(input_VAL) {
      return identity<TypeOfVAL>();
    }
    static const identity<TypeOfDO> getValueType(input_DO) {
      return identity<TypeOfDO>();
    }
    static const identity<TypeOfDEVU0027> getValueType(output_DEVU0027) {
      return identity<TypeOfDEVU0027>();
    }
    static const identity<TypeOfDONE> getValueType(output_DONE) {
      return identity<TypeOfDONE>();
    }

    union NodeErrors {
        struct {
            bool output_DEVU0027 : 1;
            bool output_DONE : 1;
        };

        ErrorFlags flags = 0;
    };

    NodeErrors errors = {};

    TypeOfDEVU0027 _output_DEVU0027;

    State state;

    xod_dev__text_lcd__print_at__text_lcd_i2c_device (TypeOfDEVU0027 output_DEVU0027) {
        _output_DEVU0027 = output_DEVU0027;
    }

    struct ContextObject {

        TypeOfDEV _input_DEV;
        TypeOfROW _input_ROW;
        TypeOfPOS _input_POS;
        TypeOfLEN _input_LEN;
        TypeOfVAL _input_VAL;

        bool _isInputDirty_DO;

        bool _isOutputDirty_DEVU0027 : 1;
        bool _isOutputDirty_DONE : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_DEV input_ROW input_POS input_LEN input_VAL input_DO" \
                " output_DEVU0027 output_DONE");
    }

    TypeOfDEV getValue(Context ctx, identity<input_DEV>) {
        return ctx->_input_DEV;
    }
    TypeOfROW getValue(Context ctx, identity<input_ROW>) {
        return ctx->_input_ROW;
    }
    TypeOfPOS getValue(Context ctx, identity<input_POS>) {
        return ctx->_input_POS;
    }
    TypeOfLEN getValue(Context ctx, identity<input_LEN>) {
        return ctx->_input_LEN;
    }
    TypeOfVAL getValue(Context ctx, identity<input_VAL>) {
        return ctx->_input_VAL;
    }
    TypeOfDO getValue(Context ctx, identity<input_DO>) {
        return Pulse();
    }
    TypeOfDEVU0027 getValue(Context ctx, identity<output_DEVU0027>) {
        return this->_output_DEVU0027;
    }
    TypeOfDONE getValue(Context ctx, identity<output_DONE>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_DO");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_DO>) {
        return ctx->_isInputDirty_DO;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_DEVU0027 output_DONE");
    }

    void emitValue(Context ctx, TypeOfDEVU0027 val, identity<output_DEVU0027>) {
        this->_output_DEVU0027 = val;
        ctx->_isOutputDirty_DEVU0027 = true;
        this->errors.output_DEVU0027 = false;
    }
    void emitValue(Context ctx, TypeOfDONE val, identity<output_DONE>) {
        ctx->_isOutputDirty_DONE = true;
        this->errors.output_DONE = false;
    }

    template<typename OutputT> void raiseError(Context ctx) {
        raiseError(ctx, identity<OutputT>());
    }

    template<typename OutputT> void raiseError(Context ctx, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_DEVU0027 output_DONE");
    }

    void raiseError(Context ctx, identity<output_DEVU0027>) {
        this->errors.output_DEVU0027 = true;
        ctx->_isOutputDirty_DEVU0027 = true;
    }
    void raiseError(Context ctx, identity<output_DONE>) {
        this->errors.output_DONE = true;
        ctx->_isOutputDirty_DONE = true;
    }

    void raiseError(Context ctx) {
        this->errors.output_DEVU0027 = true;
        ctx->_isOutputDirty_DEVU0027 = true;
        this->errors.output_DONE = true;
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

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod-dev/servo/rotate implementation
//-----------------------------------------------------------------------------

namespace xod {
template <typename TypeOfDEV>
struct xod_dev__servo__rotate {

    typedef Number TypeOfVAL;
    typedef Pulse TypeOfDO;

    typedef TypeOfDEV TypeOfDEVU0027;
    typedef Pulse TypeOfACK;

    //#pragma XOD evaluate_on_pin disable
    //#pragma XOD evaluate_on_pin enable input_DO

    struct State { };

    struct input_DEV { };
    struct input_VAL { };
    struct input_DO { };
    struct output_DEVU0027 { };
    struct output_ACK { };

    static const identity<TypeOfDEV> getValueType(input_DEV) {
      return identity<TypeOfDEV>();
    }
    static const identity<TypeOfVAL> getValueType(input_VAL) {
      return identity<TypeOfVAL>();
    }
    static const identity<TypeOfDO> getValueType(input_DO) {
      return identity<TypeOfDO>();
    }
    static const identity<TypeOfDEVU0027> getValueType(output_DEVU0027) {
      return identity<TypeOfDEVU0027>();
    }
    static const identity<TypeOfACK> getValueType(output_ACK) {
      return identity<TypeOfACK>();
    }

    TypeOfDEVU0027 _output_DEVU0027;

    State state;

    xod_dev__servo__rotate (TypeOfDEVU0027 output_DEVU0027) {
        _output_DEVU0027 = output_DEVU0027;
    }

    struct ContextObject {

        TypeOfDEV _input_DEV;
        TypeOfVAL _input_VAL;

        bool _isInputDirty_DO;

        bool _isOutputDirty_DEVU0027 : 1;
        bool _isOutputDirty_ACK : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_DEV input_VAL input_DO" \
                " output_DEVU0027 output_ACK");
    }

    TypeOfDEV getValue(Context ctx, identity<input_DEV>) {
        return ctx->_input_DEV;
    }
    TypeOfVAL getValue(Context ctx, identity<input_VAL>) {
        return ctx->_input_VAL;
    }
    TypeOfDO getValue(Context ctx, identity<input_DO>) {
        return Pulse();
    }
    TypeOfDEVU0027 getValue(Context ctx, identity<output_DEVU0027>) {
        return this->_output_DEVU0027;
    }
    TypeOfACK getValue(Context ctx, identity<output_ACK>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_DO");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_DO>) {
        return ctx->_isInputDirty_DO;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_DEVU0027 output_ACK");
    }

    void emitValue(Context ctx, TypeOfDEVU0027 val, identity<output_DEVU0027>) {
        this->_output_DEVU0027 = val;
        ctx->_isOutputDirty_DEVU0027 = true;
    }
    void emitValue(Context ctx, TypeOfACK val, identity<output_ACK>) {
        ctx->_isOutputDirty_ACK = true;
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

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/defer(number) implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__defer__number {

    typedef Number TypeOfIN;

    typedef Number TypeOfOUT;

    //#pragma XOD error_catch enable
    //#pragma XOD error_raise enable

    struct State {
        bool shouldRaiseAtTheNextDeferOnlyRun = false;
    };

    struct input_IN { };
    struct output_OUT { };

    static const identity<TypeOfIN> getValueType(input_IN) {
      return identity<TypeOfIN>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    union NodeErrors {
        struct {
            bool output_OUT : 1;
        };

        ErrorFlags flags = 0;
    };

    NodeErrors errors = {};
    TimeMs timeoutAt = 0;

    TypeOfOUT _output_OUT;

    State state;

    xod__core__defer__number (TypeOfOUT output_OUT) {
        _output_OUT = output_OUT;
    }

    struct ContextObject {
        uint8_t _error_input_IN;

        TypeOfIN _input_IN;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    void setTimeout(__attribute__((unused)) Context ctx, TimeMs timeout) {
        this->timeoutAt = transactionTime() + timeout;
    }

    void clearTimeout(__attribute__((unused)) Context ctx) {
        detail::clearTimeout(this);
    }

    bool isTimedOut(__attribute__((unused)) const Context ctx) {
        return detail::isTimedOut(this);
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN" \
                " output_OUT");
    }

    TypeOfIN getValue(Context ctx, identity<input_IN>) {
        return ctx->_input_IN;
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return this->_output_OUT;
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                "");
        return false;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        this->_output_OUT = val;
        ctx->_isOutputDirty_OUT = true;
        if (isEarlyDeferPass()) this->errors.output_OUT = false;
    }

    template<typename OutputT> void raiseError(Context ctx) {
        raiseError(ctx, identity<OutputT>());
    }

    template<typename OutputT> void raiseError(Context ctx, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void raiseError(Context ctx, identity<output_OUT>) {
        this->errors.output_OUT = true;
        ctx->_isOutputDirty_OUT = true;
    }

    void raiseError(Context ctx) {
        this->errors.output_OUT = true;
        ctx->_isOutputDirty_OUT = true;
    }

    template<typename InputT> uint8_t getError(Context ctx) {
        return getError(ctx, identity<InputT>());
    }

    template<typename InputT> uint8_t getError(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_IN");
        return 0;
    }

    uint8_t getError(Context ctx, identity<input_IN>) {
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

};
} // namespace xod

//-----------------------------------------------------------------------------
// xod/core/defer(pulse) implementation
//-----------------------------------------------------------------------------

namespace xod {
struct xod__core__defer__pulse {

    typedef Pulse TypeOfIN;

    typedef Pulse TypeOfOUT;

    //#pragma XOD error_catch enable
    //#pragma XOD error_raise enable

    struct State {
        bool shouldRaiseAtTheNextDeferOnlyRun = false;
        bool shouldPulseAtTheNextDeferOnlyRun = false;
    };

    struct input_IN { };
    struct output_OUT { };

    static const identity<TypeOfIN> getValueType(input_IN) {
      return identity<TypeOfIN>();
    }
    static const identity<TypeOfOUT> getValueType(output_OUT) {
      return identity<TypeOfOUT>();
    }

    union NodeErrors {
        struct {
            bool output_OUT : 1;
        };

        ErrorFlags flags = 0;
    };

    NodeErrors errors = {};
    TimeMs timeoutAt = 0;

    State state;

    xod__core__defer__pulse () {
    }

    struct ContextObject {
        uint8_t _error_input_IN;

        bool _isInputDirty_IN;

        bool _isOutputDirty_OUT : 1;
    };

    using Context = ContextObject*;

    State* getState(__attribute__((unused)) Context ctx) {
        return &state;
    }

    void setTimeout(__attribute__((unused)) Context ctx, TimeMs timeout) {
        this->timeoutAt = transactionTime() + timeout;
    }

    void clearTimeout(__attribute__((unused)) Context ctx) {
        detail::clearTimeout(this);
    }

    bool isTimedOut(__attribute__((unused)) const Context ctx) {
        return detail::isTimedOut(this);
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx) {
        return getValue(ctx, identity<PinT>());
    }

    template<typename PinT> typename decltype(getValueType(PinT()))::type getValue(Context ctx, identity<PinT>) {
        static_assert(always_false<PinT>::value,
                "Invalid pin descriptor. Expected one of:" \
                " input_IN" \
                " output_OUT");
    }

    TypeOfIN getValue(Context ctx, identity<input_IN>) {
        return Pulse();
    }
    TypeOfOUT getValue(Context ctx, identity<output_OUT>) {
        return Pulse();
    }

    template<typename InputT> bool isInputDirty(Context ctx) {
        return isInputDirty(ctx, identity<InputT>());
    }

    template<typename InputT> bool isInputDirty(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_IN");
        return false;
    }

    bool isInputDirty(Context ctx, identity<input_IN>) {
        return ctx->_isInputDirty_IN;
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val) {
        emitValue(ctx, val, identity<OutputT>());
    }

    template<typename OutputT> void emitValue(Context ctx, typename decltype(getValueType(OutputT()))::type val, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void emitValue(Context ctx, TypeOfOUT val, identity<output_OUT>) {
        ctx->_isOutputDirty_OUT = true;
        if (isEarlyDeferPass()) this->errors.output_OUT = false;
    }

    template<typename OutputT> void raiseError(Context ctx) {
        raiseError(ctx, identity<OutputT>());
    }

    template<typename OutputT> void raiseError(Context ctx, identity<OutputT>) {
        static_assert(always_false<OutputT>::value,
                "Invalid output descriptor. Expected one of:" \
                " output_OUT");
    }

    void raiseError(Context ctx, identity<output_OUT>) {
        this->errors.output_OUT = true;
        ctx->_isOutputDirty_OUT = true;
    }

    void raiseError(Context ctx) {
        this->errors.output_OUT = true;
        ctx->_isOutputDirty_OUT = true;
    }

    template<typename InputT> uint8_t getError(Context ctx) {
        return getError(ctx, identity<InputT>());
    }

    template<typename InputT> uint8_t getError(Context ctx, identity<InputT>) {
        static_assert(always_false<InputT>::value,
                "Invalid input descriptor. Expected one of:" \
                " input_IN");
        return 0;
    }

    uint8_t getError(Context ctx, identity<input_IN>) {
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

};
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

// outputs of constant nodes
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
    bool node_101_isNodeDirty : 1;
    bool node_101_isOutputDirty_OUT : 1;
    bool node_102_isNodeDirty : 1;
    bool node_102_isOutputDirty_OUT : 1;
    bool node_103_isNodeDirty : 1;
    bool node_103_isOutputDirty_OUT : 1;
    bool node_104_isNodeDirty : 1;
    bool node_104_isOutputDirty_OUT : 1;
    bool node_105_isNodeDirty : 1;
    bool node_105_isOutputDirty_OUT : 1;
    bool node_106_isNodeDirty : 1;
    bool node_106_isOutputDirty_OUT : 1;
    bool node_107_isNodeDirty : 1;
    bool node_107_isOutputDirty_OUT : 1;
    bool node_107_hasUpstreamError : 1;
    bool node_108_isNodeDirty : 1;
    bool node_108_isOutputDirty_OUT : 1;
    bool node_109_isNodeDirty : 1;
    bool node_109_isOutputDirty_OUT : 1;
    bool node_110_isNodeDirty : 1;
    bool node_110_isOutputDirty_OUT : 1;
    bool node_111_isNodeDirty : 1;
    bool node_111_isOutputDirty_OUT : 1;
    bool node_112_isNodeDirty : 1;
    bool node_112_isOutputDirty_OUT : 1;
    bool node_113_isNodeDirty : 1;
    bool node_113_isOutputDirty_OUT : 1;
    bool node_114_isNodeDirty : 1;
    bool node_114_isOutputDirty_OUT : 1;
    bool node_115_isNodeDirty : 1;
    bool node_115_isOutputDirty_R : 1;
    bool node_116_isNodeDirty : 1;
    bool node_116_isOutputDirty_R : 1;
    bool node_116_hasUpstreamError : 1;
    bool node_117_isNodeDirty : 1;
    bool node_117_isOutputDirty_OUT : 1;
    bool node_118_isNodeDirty : 1;
    bool node_118_isOutputDirty_OUT : 1;
    bool node_119_isNodeDirty : 1;
    bool node_119_isOutputDirty_OUT : 1;
    bool node_120_isNodeDirty : 1;
    bool node_120_isOutputDirty_OUT : 1;
    bool node_121_isNodeDirty : 1;
    bool node_121_isOutputDirty_R : 1;
    bool node_122_isNodeDirty : 1;
    bool node_122_isOutputDirty_OUT : 1;
    bool node_123_isNodeDirty : 1;
    bool node_123_isOutputDirty_DEVU0027 : 1;
    bool node_123_isOutputDirty_DONE : 1;
    bool node_123_hasUpstreamError : 1;
    bool node_124_isNodeDirty : 1;
    bool node_125_isNodeDirty : 1;
    bool node_125_isOutputDirty_OUT : 1;
    bool node_126_isNodeDirty : 1;
    bool node_126_isOutputDirty_OUT : 1;
    bool node_127_isNodeDirty : 1;
    bool node_127_isOutputDirty_OUT : 1;
    bool node_128_isNodeDirty : 1;
    bool node_128_isOutputDirty_OUT : 1;
    bool node_129_isNodeDirty : 1;
    bool node_129_isOutputDirty_MEM : 1;
    bool node_130_isNodeDirty : 1;
    bool node_130_isOutputDirty_OUT : 1;
    bool node_131_isNodeDirty : 1;
    bool node_131_isOutputDirty_OUT : 1;
    bool node_132_isNodeDirty : 1;
    bool node_132_isOutputDirty_OUT : 1;
    bool node_132_hasUpstreamError : 1;
    bool node_133_isNodeDirty : 1;
    bool node_133_isOutputDirty_OUT : 1;
    bool node_134_isNodeDirty : 1;
    bool node_134_isOutputDirty_OUT : 1;
    bool node_135_isNodeDirty : 1;
    bool node_135_isOutputDirty_MEM : 1;
    bool node_135_hasUpstreamError : 1;
    bool node_136_isNodeDirty : 1;
    bool node_136_isOutputDirty_OUT : 1;
    bool node_137_isNodeDirty : 1;
    bool node_137_isOutputDirty_TICK : 1;
    bool node_138_isNodeDirty : 1;
    bool node_138_isOutputDirty_R : 1;
    bool node_139_isNodeDirty : 1;
    bool node_139_isOutputDirty_TICK : 1;
    bool node_140_isNodeDirty : 1;
    bool node_140_isOutputDirty_OUT : 1;
    bool node_141_isNodeDirty : 1;
    bool node_141_hasUpstreamError : 1;
    bool node_142_isNodeDirty : 1;
    bool node_142_isOutputDirty_TICK : 1;
    bool node_142_hasUpstreamError : 1;
    bool node_143_isNodeDirty : 1;
    bool node_143_isOutputDirty_OUT : 1;
    bool node_144_isNodeDirty : 1;
    bool node_144_isOutputDirty_MEM : 1;
    bool node_145_isNodeDirty : 1;
    bool node_145_isOutputDirty_OUT : 1;
    bool node_146_isNodeDirty : 1;
    bool node_146_isOutputDirty_MEM : 1;
    bool node_147_isNodeDirty : 1;
    bool node_148_isNodeDirty : 1;
    bool node_148_isOutputDirty_OUT : 1;
    bool node_148_hasUpstreamError : 1;
    bool node_149_isNodeDirty : 1;
    bool node_149_isOutputDirty_OUT : 1;
    bool node_149_hasUpstreamError : 1;
    bool node_150_isNodeDirty : 1;
    bool node_150_isOutputDirty_OUT : 1;
    bool node_151_isNodeDirty : 1;
    bool node_151_isOutputDirty_OUT : 1;
    bool node_152_isNodeDirty : 1;
    bool node_152_isOutputDirty_OUT : 1;
    bool node_153_isNodeDirty : 1;
    bool node_153_isOutputDirty_OUT : 1;
    bool node_153_hasUpstreamError : 1;
    bool node_154_isNodeDirty : 1;
    bool node_154_isOutputDirty_R : 1;
    bool node_155_isNodeDirty : 1;
    bool node_155_hasUpstreamError : 1;
    bool node_156_isNodeDirty : 1;
    bool node_156_hasUpstreamError : 1;
    bool node_157_isNodeDirty : 1;
    bool node_157_isOutputDirty_MEM : 1;
    bool node_157_hasUpstreamError : 1;
    bool node_158_isNodeDirty : 1;
    bool node_158_isOutputDirty_OUT : 1;
    bool node_159_isNodeDirty : 1;
    bool node_159_isOutputDirty_OUT : 1;
    bool node_160_isNodeDirty : 1;
    bool node_160_isOutputDirty_OUT : 1;
    bool node_161_isNodeDirty : 1;
    bool node_161_isOutputDirty_OUT : 1;
    bool node_162_isNodeDirty : 1;
    bool node_162_isOutputDirty_OUT : 1;
    bool node_162_hasUpstreamError : 1;
    bool node_163_isNodeDirty : 1;
    bool node_163_isOutputDirty_R : 1;
    bool node_164_isNodeDirty : 1;
    bool node_164_isOutputDirty_T : 1;
    bool node_164_isOutputDirty_F : 1;
    bool node_164_hasUpstreamError : 1;
    bool node_165_isNodeDirty : 1;
    bool node_165_isOutputDirty_OUT : 1;
    bool node_166_isNodeDirty : 1;
    bool node_167_isNodeDirty : 1;
    bool node_168_isNodeDirty : 1;
    bool node_168_isOutputDirty_OUT : 1;
    bool node_169_isNodeDirty : 1;
    bool node_169_isOutputDirty_OUT : 1;
    bool node_170_isNodeDirty : 1;
    bool node_170_isOutputDirty_OUT : 1;
    bool node_170_hasUpstreamError : 1;
    bool node_171_isNodeDirty : 1;
    bool node_171_isOutputDirty_OUT : 1;
    bool node_172_isNodeDirty : 1;
    bool node_172_isOutputDirty_OUT : 1;
    bool node_172_hasUpstreamError : 1;
    bool node_173_isNodeDirty : 1;
    bool node_173_isOutputDirty_MEM : 1;
    bool node_173_hasUpstreamError : 1;
    bool node_174_isNodeDirty : 1;
    bool node_175_isNodeDirty : 1;
    bool node_175_isOutputDirty_OUT : 1;
    bool node_176_isNodeDirty : 1;
    bool node_177_isNodeDirty : 1;
    bool node_177_isOutputDirty_OUT : 1;
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
    bool node_182_isNodeDirty : 1;
    bool node_182_isOutputDirty_OUT : 1;
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
    bool node_187_isNodeDirty : 1;
    bool node_187_isOutputDirty_OUT : 1;
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
    bool node_192_isNodeDirty : 1;
    bool node_192_isOutputDirty_OUT : 1;
    bool node_193_isNodeDirty : 1;
    bool node_193_isOutputDirty_OUT : 1;
    bool node_193_hasUpstreamError : 1;
    bool node_194_isNodeDirty : 1;
    bool node_194_isOutputDirty_OUT : 1;
    bool node_194_hasUpstreamError : 1;
    bool node_195_isNodeDirty : 1;
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

typedef xod__core__continuously TypeOfNode79;
TypeOfNode79 node_79 = TypeOfNode79();

typedef xod__core__boot TypeOfNode80;
TypeOfNode80 node_80 = TypeOfNode80();

typedef xod__core__multiply TypeOfNode81;
TypeOfNode81 node_81 = TypeOfNode81(0);

typedef xod__core__pulse_on_change__boolean TypeOfNode82;
TypeOfNode82 node_82 = TypeOfNode82();

typedef xod_dev__text_lcd__text_lcd_i2c_device TypeOfNode83;
TypeOfNode83 node_83 = TypeOfNode83({ /* xod-dev/text-lcd/text-lcd-i2c-device */ });

typedef xod__core__divide TypeOfNode84;
TypeOfNode84 node_84 = TypeOfNode84(0);

typedef xod_dev__servo__servo_device<node_68_output_VAL> TypeOfNode85;
TypeOfNode85 node_85 = TypeOfNode85({ /* xod-dev/servo/servo-device */ });

typedef xod__core__cast_to_pulse__boolean TypeOfNode86;
TypeOfNode86 node_86 = TypeOfNode86();

typedef xod__core__cast_to_pulse__boolean TypeOfNode87;
TypeOfNode87 node_87 = TypeOfNode87();

typedef xod__core__cast_to_pulse__boolean TypeOfNode88;
TypeOfNode88 node_88 = TypeOfNode88();

typedef xod__core__cast_to_pulse__boolean TypeOfNode89;
TypeOfNode89 node_89 = TypeOfNode89();

typedef xod__core__cast_to_pulse__boolean TypeOfNode90;
TypeOfNode90 node_90 = TypeOfNode90();

typedef xod__core__cast_to_pulse__boolean TypeOfNode91;
TypeOfNode91 node_91 = TypeOfNode91();

typedef xod__core__cast_to_pulse__boolean TypeOfNode92;
TypeOfNode92 node_92 = TypeOfNode92();

typedef xod__gpio__analog_read<node_5_output_VAL> TypeOfNode93;
TypeOfNode93 node_93 = TypeOfNode93(0);

typedef xod__gpio__digital_read_pullup<node_7_output_VAL> TypeOfNode94;
TypeOfNode94 node_94 = TypeOfNode94(false);

typedef xod__gpio__analog_read<node_13_output_VAL> TypeOfNode95;
TypeOfNode95 node_95 = TypeOfNode95(0);

typedef xod__gpio__digital_read_pullup<node_30_output_VAL> TypeOfNode96;
TypeOfNode96 node_96 = TypeOfNode96(false);

typedef xod__gpio__analog_read<node_31_output_VAL> TypeOfNode97;
TypeOfNode97 node_97 = TypeOfNode97(0);

typedef xod__core__subtract TypeOfNode98;
TypeOfNode98 node_98 = TypeOfNode98(0);

typedef xod__core__any TypeOfNode99;
TypeOfNode99 node_99 = TypeOfNode99();

typedef xod__math__map TypeOfNode100;
TypeOfNode100 node_100 = TypeOfNode100(0);

typedef xod__core__not TypeOfNode101;
TypeOfNode101 node_101 = TypeOfNode101(false);

typedef xod__math__map TypeOfNode102;
TypeOfNode102 node_102 = TypeOfNode102(0);

typedef xod__core__not TypeOfNode103;
TypeOfNode103 node_103 = TypeOfNode103(false);

typedef xod__core__any TypeOfNode104;
TypeOfNode104 node_104 = TypeOfNode104();

typedef xod__core__less TypeOfNode105;
TypeOfNode105 node_105 = TypeOfNode105(false);

typedef xod__core__less TypeOfNode106;
TypeOfNode106 node_106 = TypeOfNode106(false);

typedef xod__core__less TypeOfNode107;
TypeOfNode107 node_107 = TypeOfNode107(false);

typedef xod__core__cast_to_string__number TypeOfNode108;
TypeOfNode108 node_108 = TypeOfNode108(XString());

typedef xod__core__debounce__boolean TypeOfNode109;
TypeOfNode109 node_109 = TypeOfNode109(false);

typedef xod__core__less TypeOfNode110;
TypeOfNode110 node_110 = TypeOfNode110(false);

typedef xod__core__greater TypeOfNode111;
TypeOfNode111 node_111 = TypeOfNode111(false);

typedef xod__core__cast_to_string__number TypeOfNode112;
TypeOfNode112 node_112 = TypeOfNode112(XString());

typedef xod__core__debounce__boolean TypeOfNode113;
TypeOfNode113 node_113 = TypeOfNode113(false);

typedef xod__core__gate__pulse TypeOfNode114;
TypeOfNode114 node_114 = TypeOfNode114();

typedef xod__core__if_else__number TypeOfNode115;
TypeOfNode115 node_115 = TypeOfNode115(0);

typedef xod__core__if_else__number TypeOfNode116;
TypeOfNode116 node_116 = TypeOfNode116(0);

typedef xod__core__concat TypeOfNode117;
TypeOfNode117 node_117 = TypeOfNode117(XString());

typedef xod__core__pulse_on_true TypeOfNode118;
TypeOfNode118 node_118 = TypeOfNode118();

typedef xod__core__not TypeOfNode119;
TypeOfNode119 node_119 = TypeOfNode119(false);

typedef xod__core__and TypeOfNode120;
TypeOfNode120 node_120 = TypeOfNode120(false);

typedef xod__core__if_else__string TypeOfNode121;
TypeOfNode121 node_121 = TypeOfNode121(XString());

typedef xod__core__cast_to_pulse__boolean TypeOfNode122;
TypeOfNode122 node_122 = TypeOfNode122();

typedef xod_dev__text_lcd__set_backlight TypeOfNode123;
TypeOfNode123 node_123 = TypeOfNode123({ /* xod-dev/text-lcd/text-lcd-i2c-device */ });

typedef xod__math__cube TypeOfNode124;
TypeOfNode124 node_124 = TypeOfNode124(0);

typedef xod__core__pulse_on_change__number TypeOfNode125;
TypeOfNode125 node_125 = TypeOfNode125();

typedef xod__core__concat TypeOfNode126;
TypeOfNode126 node_126 = TypeOfNode126(XString());

typedef xod__core__any TypeOfNode127;
TypeOfNode127 node_127 = TypeOfNode127();

typedef xod__core__pulse_on_true TypeOfNode128;
TypeOfNode128 node_128 = TypeOfNode128();

typedef xod__core__flip_flop TypeOfNode129;
TypeOfNode129 node_129 = TypeOfNode129(false);

typedef xod__core__any TypeOfNode130;
TypeOfNode130 node_130 = TypeOfNode130();

typedef xod__core__concat TypeOfNode131;
TypeOfNode131 node_131 = TypeOfNode131(XString());

typedef xod__core__any TypeOfNode132;
TypeOfNode132 node_132 = TypeOfNode132();

typedef xod__core__or TypeOfNode133;
TypeOfNode133 node_133 = TypeOfNode133(false);

typedef xod__core__any TypeOfNode134;
TypeOfNode134 node_134 = TypeOfNode134();

typedef xod__core__flip_flop TypeOfNode135;
TypeOfNode135 node_135 = TypeOfNode135(false);

typedef xod__core__not TypeOfNode136;
TypeOfNode136 node_136 = TypeOfNode136(false);

typedef xod__core__clock TypeOfNode137;
TypeOfNode137 node_137 = TypeOfNode137();

typedef xod__core__if_else__string TypeOfNode138;
TypeOfNode138 node_138 = TypeOfNode138(XString());

typedef xod__core__clock TypeOfNode139;
TypeOfNode139 node_139 = TypeOfNode139();

typedef xod__core__gate__pulse TypeOfNode140;
TypeOfNode140 node_140 = TypeOfNode140();

typedef xod__core__if_else__number TypeOfNode141;
TypeOfNode141 node_141 = TypeOfNode141(0);

typedef xod__core__clock TypeOfNode142;
TypeOfNode142 node_142 = TypeOfNode142();

typedef xod__core__pulse_on_true TypeOfNode143;
TypeOfNode143 node_143 = TypeOfNode143();

typedef xod__core__flip_flop TypeOfNode144;
TypeOfNode144 node_144 = TypeOfNode144(false);

typedef xod__core__if_error__string TypeOfNode145;
TypeOfNode145 node_145 = TypeOfNode145(XString());

typedef xod__core__flip_flop TypeOfNode146;
TypeOfNode146 node_146 = TypeOfNode146(false);

typedef xod__gpio__pwm_write<node_66_output_VAL> TypeOfNode147;
TypeOfNode147 node_147 = TypeOfNode147();

typedef xod__core__count TypeOfNode148;
TypeOfNode148 node_148 = TypeOfNode148(0);

typedef xod__core__any TypeOfNode149;
TypeOfNode149 node_149 = TypeOfNode149();

typedef xod__core__square_wave TypeOfNode150;
TypeOfNode150 node_150 = TypeOfNode150(false, 0);

typedef xod__core__and TypeOfNode151;
TypeOfNode151 node_151 = TypeOfNode151(false);

typedef xod__core__not TypeOfNode152;
TypeOfNode152 node_152 = TypeOfNode152(false);

typedef xod__core__pulse_on_change__string TypeOfNode153;
TypeOfNode153 node_153 = TypeOfNode153();

typedef xod__core__if_else__string TypeOfNode154;
TypeOfNode154 node_154 = TypeOfNode154(XString());

typedef xod__core__if_else__number TypeOfNode155;
TypeOfNode155 node_155 = TypeOfNode155(0);

typedef xod__core__less TypeOfNode156;
TypeOfNode156 node_156 = TypeOfNode156(false);

typedef xod__core__buffer__number TypeOfNode157;
TypeOfNode157 node_157 = TypeOfNode157(0);

typedef xod__core__not TypeOfNode158;
TypeOfNode158 node_158 = TypeOfNode158(false);

typedef xod__core__cast_to_pulse__boolean TypeOfNode159;
TypeOfNode159 node_159 = TypeOfNode159();

typedef xod__core__cast_to_number__boolean TypeOfNode160;
TypeOfNode160 node_160 = TypeOfNode160(0);

typedef xod__core__and TypeOfNode161;
TypeOfNode161 node_161 = TypeOfNode161(false);

typedef xod__core__any TypeOfNode162;
TypeOfNode162 node_162 = TypeOfNode162();

typedef xod__core__if_else__string TypeOfNode163;
TypeOfNode163 node_163 = TypeOfNode163(XString());

typedef xod__core__branch TypeOfNode164;
TypeOfNode164 node_164 = TypeOfNode164();

typedef xod__core__cast_to_pulse__boolean TypeOfNode165;
TypeOfNode165 node_165 = TypeOfNode165();

typedef ____play_note<node_22_output_VAL> TypeOfNode166;
TypeOfNode166 node_166 = TypeOfNode166();

typedef xod__math__cube TypeOfNode167;
TypeOfNode167 node_167 = TypeOfNode167(0);

typedef xod__core__pulse_on_change__number TypeOfNode168;
TypeOfNode168 node_168 = TypeOfNode168();

typedef xod__core__cast_to_number__boolean TypeOfNode169;
TypeOfNode169 node_169 = TypeOfNode169(0);

typedef xod__core__any TypeOfNode170;
TypeOfNode170 node_170 = TypeOfNode170();

typedef xod__core__if_error__string TypeOfNode171;
TypeOfNode171 node_171 = TypeOfNode171(XString());

typedef xod__core__any TypeOfNode172;
TypeOfNode172 node_172 = TypeOfNode172();

typedef xod__core__flip_flop TypeOfNode173;
TypeOfNode173 node_173 = TypeOfNode173(false);

typedef ____play_note<node_19_output_VAL> TypeOfNode174;
TypeOfNode174 node_174 = TypeOfNode174();

typedef xod__core__any TypeOfNode175;
TypeOfNode175 node_175 = TypeOfNode175();

typedef xod__math__cube TypeOfNode176;
TypeOfNode176 node_176 = TypeOfNode176(0);

typedef xod__core__pulse_on_change__number TypeOfNode177;
TypeOfNode177 node_177 = TypeOfNode177();

typedef xod__core__gate__pulse TypeOfNode178;
TypeOfNode178 node_178 = TypeOfNode178();

typedef xod__core__pulse_on_change__string TypeOfNode179;
TypeOfNode179 node_179 = TypeOfNode179();

typedef xod__core__buffer__number TypeOfNode180;
TypeOfNode180 node_180 = TypeOfNode180(0);

typedef xod__core__any TypeOfNode181;
TypeOfNode181 node_181 = TypeOfNode181();

typedef xod__core__any TypeOfNode182;
TypeOfNode182 node_182 = TypeOfNode182();

typedef xod_dev__text_lcd__print_at__text_lcd_i2c_device TypeOfNode183;
TypeOfNode183 node_183 = TypeOfNode183({ /* xod-dev/text-lcd/text-lcd-i2c-device */ });

typedef xod__core__any TypeOfNode184;
TypeOfNode184 node_184 = TypeOfNode184();

typedef xod__core__if_else__number TypeOfNode185;
TypeOfNode185 node_185 = TypeOfNode185(0);

typedef xod__core__gate__pulse TypeOfNode186;
TypeOfNode186 node_186 = TypeOfNode186();

typedef xod__core__any TypeOfNode187;
TypeOfNode187 node_187 = TypeOfNode187();

typedef xod__core__any TypeOfNode188;
TypeOfNode188 node_188 = TypeOfNode188();

typedef xod__core__any TypeOfNode189;
TypeOfNode189 node_189 = TypeOfNode189();

typedef xod__math__map TypeOfNode190;
TypeOfNode190 node_190 = TypeOfNode190(0);

typedef xod__gpio__pwm_write<node_26_output_VAL> TypeOfNode191;
TypeOfNode191 node_191 = TypeOfNode191();

typedef xod__core__gate__pulse TypeOfNode192;
TypeOfNode192 node_192 = TypeOfNode192();

typedef xod__core__gate__pulse TypeOfNode193;
TypeOfNode193 node_193 = TypeOfNode193();

typedef xod__core__pulse_on_change__number TypeOfNode194;
TypeOfNode194 node_194 = TypeOfNode194();

typedef xod__gpio__pwm_write<node_24_output_VAL> TypeOfNode195;
TypeOfNode195 node_195 = TypeOfNode195();

typedef xod_dev__text_lcd__print_at__text_lcd_i2c_device TypeOfNode196;
TypeOfNode196 node_196 = TypeOfNode196({ /* xod-dev/text-lcd/text-lcd-i2c-device */ });

typedef xod__core__any TypeOfNode197;
TypeOfNode197 node_197 = TypeOfNode197();

typedef xod__core__any TypeOfNode198;
TypeOfNode198 node_198 = TypeOfNode198();

typedef xod__core__any TypeOfNode199;
TypeOfNode199 node_199 = TypeOfNode199();

typedef xod__core__gate__pulse TypeOfNode200;
TypeOfNode200 node_200 = TypeOfNode200();

typedef xod_dev__servo__rotate<TypeOfNode85::TypeOfDEV> TypeOfNode201;
TypeOfNode201 node_201 = TypeOfNode201({ /* xod-dev/servo/servo-device */ });

typedef xod__core__defer__number TypeOfNode202;
TypeOfNode202 node_202 = TypeOfNode202(0);

typedef xod__core__defer__pulse TypeOfNode203;
TypeOfNode203 node_203 = TypeOfNode203();

typedef xod__core__defer__number TypeOfNode204;
TypeOfNode204 node_204 = TypeOfNode204(0);

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
            error_input_IN |= node_203.errors.output_OUT;

            XOD_TRACE_F("Trigger defer node #");
            XOD_TRACE_LN(202);

            TypeOfNode202::ContextObject ctxObj;

            ctxObj._input_IN = node_157._output_MEM;

            ctxObj._error_input_IN = error_input_IN;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            TypeOfNode202::NodeErrors previousErrors = node_202.errors;

            node_202.evaluate(&ctxObj);

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

            XOD_TRACE_F("Trigger defer node #");
            XOD_TRACE_LN(203);

            TypeOfNode203::ContextObject ctxObj;
            ctxObj._isInputDirty_IN = false;

            ctxObj._error_input_IN = 0;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            TypeOfNode203::NodeErrors previousErrors = node_203.errors;

            node_203.errors.output_OUT = false;

            node_203.evaluate(&ctxObj);

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
            error_input_IN |= node_203.errors.output_OUT;
            error_input_IN |= node_202.errors.output_OUT;

            XOD_TRACE_F("Trigger defer node #");
            XOD_TRACE_LN(204);

            TypeOfNode204::ContextObject ctxObj;

            ctxObj._input_IN = node_180._output_MEM;

            ctxObj._error_input_IN = error_input_IN;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            TypeOfNode204::NodeErrors previousErrors = node_204.errors;

            node_204.evaluate(&ctxObj);

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

            TypeOfNode79::ContextObject ctxObj;

            // copy data from upstream nodes into context

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_TICK = false;

            node_79.evaluate(&ctxObj);

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

            TypeOfNode80::ContextObject ctxObj;

            // copy data from upstream nodes into context

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_BOOT = false;

            node_80.evaluate(&ctxObj);

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

            TypeOfNode81::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_17_output_VAL;
            ctxObj._input_IN2 = node_18_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_81.evaluate(&ctxObj);

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

            TypeOfNode82::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_35_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_82.evaluate(&ctxObj);

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

            TypeOfNode83::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_ADDR = node_41_output_VAL;
            ctxObj._input_COLS = node_42_output_VAL;
            ctxObj._input_ROWS = node_43_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DEV = false;

            TypeOfNode83::NodeErrors previousErrors = node_83.errors;

            node_83.evaluate(&ctxObj);

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

            TypeOfNode84::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_60_output_VAL;
            ctxObj._input_IN2 = node_61_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_84.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_148_isNodeDirty = true;
        }

    }
    { // xod_dev__servo__servo_device #85
        if (g_transaction.node_85_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(85);

            TypeOfNode85::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_Pmin = node_69_output_VAL;
            ctxObj._input_Pmax = node_70_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DEV = false;

            TypeOfNode85::NodeErrors previousErrors = node_85.errors;

            node_85.evaluate(&ctxObj);

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

            TypeOfNode86::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_72_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_86.evaluate(&ctxObj);

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

            TypeOfNode87::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_73_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_87.evaluate(&ctxObj);

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

            TypeOfNode88::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_74_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_88.evaluate(&ctxObj);

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

            TypeOfNode89::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_75_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_89.evaluate(&ctxObj);

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

            TypeOfNode90::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_76_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_90.evaluate(&ctxObj);

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

            TypeOfNode91::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_77_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_91.evaluate(&ctxObj);

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

            TypeOfNode92::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_78_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_92.evaluate(&ctxObj);

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

            TypeOfNode93::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_UPD = g_transaction.node_79_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_VAL = false;
            ctxObj._isOutputDirty_DONE = false;

            node_93.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_93_isOutputDirty_VAL = ctxObj._isOutputDirty_VAL;

            // mark downstream nodes dirty
            g_transaction.node_100_isNodeDirty |= g_transaction.node_93_isOutputDirty_VAL;
        }

    }
    { // xod__gpio__digital_read_pullup #94
        if (g_transaction.node_94_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(94);

            TypeOfNode94::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_UPD = g_transaction.node_79_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_SIG = false;
            ctxObj._isOutputDirty_DONE = false;

            node_94.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_94_isOutputDirty_SIG = ctxObj._isOutputDirty_SIG;

            // mark downstream nodes dirty
            g_transaction.node_101_isNodeDirty |= g_transaction.node_94_isOutputDirty_SIG;
        }

    }
    { // xod__gpio__analog_read #95
        if (g_transaction.node_95_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(95);

            TypeOfNode95::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_UPD = g_transaction.node_79_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_VAL = false;
            ctxObj._isOutputDirty_DONE = false;

            node_95.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_95_isOutputDirty_VAL = ctxObj._isOutputDirty_VAL;

            // mark downstream nodes dirty
            g_transaction.node_102_isNodeDirty |= g_transaction.node_95_isOutputDirty_VAL;
        }

    }
    { // xod__gpio__digital_read_pullup #96
        if (g_transaction.node_96_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(96);

            TypeOfNode96::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_UPD = g_transaction.node_79_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_SIG = false;
            ctxObj._isOutputDirty_DONE = false;

            node_96.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_96_isOutputDirty_SIG = ctxObj._isOutputDirty_SIG;

            // mark downstream nodes dirty
            g_transaction.node_103_isNodeDirty |= g_transaction.node_96_isOutputDirty_SIG;
        }

    }
    { // xod__gpio__analog_read #97
        if (g_transaction.node_97_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(97);

            TypeOfNode97::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_UPD = g_transaction.node_79_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_VAL = false;
            ctxObj._isOutputDirty_DONE = false;

            node_97.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_97_isOutputDirty_VAL = ctxObj._isOutputDirty_VAL;

            // mark downstream nodes dirty
            g_transaction.node_115_isNodeDirty |= g_transaction.node_97_isOutputDirty_VAL;
        }

    }
    { // xod__core__subtract #98
        if (g_transaction.node_98_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(98);

            TypeOfNode98::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_21_output_VAL;
            ctxObj._input_IN2 = node_81._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_98.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_174_isNodeDirty = true;
        }

    }
    { // xod__core__any #99
        if (g_transaction.node_99_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(99);

            TypeOfNode99::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_82_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_80_isOutputDirty_BOOT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_99.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_99_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_104_isNodeDirty |= g_transaction.node_99_isOutputDirty_OUT;
        }

    }
    { // xod__math__map #100
        if (g_transaction.node_100_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(100);

            TypeOfNode100::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_X = node_93._output_VAL;
            ctxObj._input_Smin = node_1_output_VAL;
            ctxObj._input_Smax = node_2_output_VAL;
            ctxObj._input_Tmin = node_3_output_VAL;
            ctxObj._input_Tmax = node_4_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_100.evaluate(&ctxObj);

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
        if (g_transaction.node_101_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(101);

            TypeOfNode101::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_94._output_SIG;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_101.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_109_isNodeDirty = true;
        }

    }
    { // xod__math__map #102
        if (g_transaction.node_102_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(102);

            TypeOfNode102::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_X = node_95._output_VAL;
            ctxObj._input_Smin = node_9_output_VAL;
            ctxObj._input_Smax = node_10_output_VAL;
            ctxObj._input_Tmin = node_11_output_VAL;
            ctxObj._input_Tmax = node_12_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_102.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_110_isNodeDirty = true;
            g_transaction.node_111_isNodeDirty = true;
            g_transaction.node_112_isNodeDirty = true;
        }

    }
    { // xod__core__not #103
        if (g_transaction.node_103_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(103);

            TypeOfNode103::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_96._output_SIG;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_103.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_113_isNodeDirty = true;
        }

    }
    { // xod__core__any #104
        if (g_transaction.node_104_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(104);

            TypeOfNode104::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_99_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_88_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_104.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_104_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_114_isNodeDirty |= g_transaction.node_104_isOutputDirty_OUT;
        }

    }
    { // xod__core__less #105
        if (g_transaction.node_105_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(105);

            TypeOfNode105::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_100._output_OUT;
            ctxObj._input_IN2 = node_8_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_105.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_115_isNodeDirty = true;
        }

    }
    { // xod__core__less #106
        if (g_transaction.node_106_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(106);

            TypeOfNode106::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_100._output_OUT;
            ctxObj._input_IN2 = node_32_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_106.evaluate(&ctxObj);

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

            TypeOfNode107::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_202._output_OUT;
            ctxObj._input_IN2 = node_100._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_107.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_116_isNodeDirty = true;
            g_transaction.node_155_isNodeDirty = true;
        }

    }
    { // xod__core__cast_to_string__number #108
        if (g_transaction.node_108_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(108);

            TypeOfNode108::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_100._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_108.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_117_isNodeDirty = true;
        }

    }
    { // xod__core__debounce__boolean #109
        if (g_transaction.node_109_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(109);

            TypeOfNode109::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_ST = node_101._output_OUT;
            ctxObj._input_Ts = node_6_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_109.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_109_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_118_isNodeDirty |= g_transaction.node_109_isOutputDirty_OUT;
            g_transaction.node_119_isNodeDirty |= g_transaction.node_109_isOutputDirty_OUT;
        }

    }
    { // xod__core__less #110
        if (g_transaction.node_110_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(110);

            TypeOfNode110::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_102._output_OUT;
            ctxObj._input_IN2 = node_14_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_110.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_120_isNodeDirty = true;
        }

    }
    { // xod__core__greater #111
        if (g_transaction.node_111_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(111);

            TypeOfNode111::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_102._output_OUT;
            ctxObj._input_IN2 = node_50_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_111.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_121_isNodeDirty = true;
        }

    }
    { // xod__core__cast_to_string__number #112
        if (g_transaction.node_112_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(112);

            TypeOfNode112::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_102._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_112.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_131_isNodeDirty = true;
        }

    }
    { // xod__core__debounce__boolean #113
        if (g_transaction.node_113_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(113);

            TypeOfNode113::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_ST = node_103._output_OUT;
            ctxObj._input_Ts = node_29_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_113.evaluate(&ctxObj);

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

            TypeOfNode114::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_34_output_VAL;

            ctxObj._isInputDirty_IN = g_transaction.node_104_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_114.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_114_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_123_isNodeDirty |= g_transaction.node_114_isOutputDirty_OUT;
        }

    }
    { // xod__core__if_else__number #115
        if (g_transaction.node_115_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(115);

            TypeOfNode115::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_105._output_OUT;
            ctxObj._input_T = node_97._output_VAL;
            ctxObj._input_F = node_0_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_115.evaluate(&ctxObj);

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

            TypeOfNode116::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_107._output_OUT;
            ctxObj._input_T = node_100._output_OUT;
            ctxObj._input_F = node_202._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_116.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_141_isNodeDirty = true;
        }

    }
    { // xod__core__concat #117
        if (g_transaction.node_117_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(117);

            TypeOfNode117::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_53_output_VAL;
            ctxObj._input_IN2 = node_108._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_117.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_126_isNodeDirty = true;
        }

    }
    { // xod__core__pulse_on_true #118
        if (g_transaction.node_118_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(118);

            TypeOfNode118::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_109._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_118.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_118_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_127_isNodeDirty |= g_transaction.node_118_isOutputDirty_OUT;
        }

    }
    { // xod__core__not #119
        if (g_transaction.node_119_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(119);

            TypeOfNode119::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_109._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_119.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_128_isNodeDirty = true;
        }

    }
    { // xod__core__and #120
        if (g_transaction.node_120_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(120);

            TypeOfNode120::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_110._output_OUT;
            ctxObj._input_IN2 = node_106._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_120.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_133_isNodeDirty = true;
        }

    }
    { // xod__core__if_else__string #121
        if (g_transaction.node_121_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(121);

            TypeOfNode121::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_111._output_OUT;
            ctxObj._input_T = node_51_output_VAL;
            ctxObj._input_F = node_52_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_121.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_138_isNodeDirty = true;
        }

    }
    { // xod__core__cast_to_pulse__boolean #122
        if (g_transaction.node_122_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(122);

            TypeOfNode122::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_113._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_122.evaluate(&ctxObj);

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

            TypeOfNode123::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_DEV = node_83._output_DEV;
            ctxObj._input_BL = node_48_output_VAL;

            ctxObj._isInputDirty_DO = g_transaction.node_114_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DEVU0027 = false;
            ctxObj._isOutputDirty_DONE = false;

            node_123.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_123_isOutputDirty_DEVU0027 = ctxObj._isOutputDirty_DEVU0027;
            g_transaction.node_123_isOutputDirty_DONE = ctxObj._isOutputDirty_DONE;

            // mark downstream nodes dirty
            g_transaction.node_183_isNodeDirty |= g_transaction.node_123_isOutputDirty_DEVU0027;
            g_transaction.node_188_isNodeDirty |= g_transaction.node_123_isOutputDirty_DONE;
        }

    }
    { // xod__math__cube #124
        if (g_transaction.node_124_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(124);

            TypeOfNode124::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_115._output_R;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_124.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__pulse_on_change__number #125
        if (g_transaction.node_125_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(125);

            TypeOfNode125::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_115._output_R;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_125.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_125_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_130_isNodeDirty |= g_transaction.node_125_isOutputDirty_OUT;
        }

    }
    { // xod__core__concat #126
        if (g_transaction.node_126_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(126);

            TypeOfNode126::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_117._output_OUT;
            ctxObj._input_IN2 = node_54_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_126.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_131_isNodeDirty = true;
        }

    }
    { // xod__core__any #127
        if (g_transaction.node_127_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(127);

            TypeOfNode127::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_118_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_80_isOutputDirty_BOOT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_127.evaluate(&ctxObj);

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
        if (g_transaction.node_128_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(128);

            TypeOfNode128::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_119._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_128.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_128_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_135_isNodeDirty |= g_transaction.node_128_isOutputDirty_OUT;
        }

    }
    { // xod__core__flip_flop #129
        if (g_transaction.node_129_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(129);

            TypeOfNode129::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_SET = false;
            ctxObj._isInputDirty_RST = false;
            ctxObj._isInputDirty_TGL = g_transaction.node_122_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_MEM = false;

            node_129.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_129_isOutputDirty_MEM = ctxObj._isOutputDirty_MEM;

            // mark downstream nodes dirty
            g_transaction.node_133_isNodeDirty |= g_transaction.node_129_isOutputDirty_MEM;
        }

    }
    { // xod__core__any #130
        if (g_transaction.node_130_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(130);

            TypeOfNode130::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_125_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_80_isOutputDirty_BOOT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_130.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_130_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_134_isNodeDirty |= g_transaction.node_130_isOutputDirty_OUT;
        }

    }
    { // xod__core__concat #131
        if (g_transaction.node_131_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(131);

            TypeOfNode131::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_126._output_OUT;
            ctxObj._input_IN2 = node_112._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_131.evaluate(&ctxObj);

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

            TypeOfNode132::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_127_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_203_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_132.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_132_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_135_isNodeDirty |= g_transaction.node_132_isOutputDirty_OUT;
        }

    }
    { // xod__core__or #133
        if (g_transaction.node_133_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(133);

            TypeOfNode133::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_129._output_MEM;
            ctxObj._input_IN2 = node_120._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_133.evaluate(&ctxObj);

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
        if (g_transaction.node_134_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(134);

            TypeOfNode134::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_130_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_91_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_134.evaluate(&ctxObj);

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

            TypeOfNode135::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_SET = false;
            ctxObj._isInputDirty_TGL = g_transaction.node_128_isOutputDirty_OUT;
            ctxObj._isInputDirty_RST = g_transaction.node_132_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_MEM = false;

            node_135.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_135_isOutputDirty_MEM = ctxObj._isOutputDirty_MEM;

            // mark downstream nodes dirty
            g_transaction.node_141_isNodeDirty |= g_transaction.node_135_isOutputDirty_MEM;
            g_transaction.node_142_isNodeDirty |= g_transaction.node_135_isOutputDirty_MEM;
        }

    }
    { // xod__core__not #136
        if (g_transaction.node_136_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(136);

            TypeOfNode136::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_133._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_136.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_143_isNodeDirty = true;
        }

    }
    { // xod__core__clock #137
        if (g_transaction.node_137_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(137);

            TypeOfNode137::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_133._output_OUT;
            ctxObj._input_IVAL = node_28_output_VAL;

            ctxObj._isInputDirty_RST = false;
            ctxObj._isInputDirty_EN = true;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_TICK = false;

            node_137.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_137_isOutputDirty_TICK = ctxObj._isOutputDirty_TICK;

            // mark downstream nodes dirty
            g_transaction.node_144_isNodeDirty |= g_transaction.node_137_isOutputDirty_TICK;
        }

    }
    { // xod__core__if_else__string #138
        if (g_transaction.node_138_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(138);

            TypeOfNode138::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_133._output_OUT;
            ctxObj._input_T = node_55_output_VAL;
            ctxObj._input_F = node_121._output_R;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_138.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_145_isNodeDirty = true;
        }

    }
    { // xod__core__clock #139
        if (g_transaction.node_139_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(139);

            TypeOfNode139::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_133._output_OUT;
            ctxObj._input_IVAL = node_56_output_VAL;

            ctxObj._isInputDirty_RST = false;
            ctxObj._isInputDirty_EN = true;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_TICK = false;

            node_139.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_139_isOutputDirty_TICK = ctxObj._isOutputDirty_TICK;

            // mark downstream nodes dirty
            g_transaction.node_146_isNodeDirty |= g_transaction.node_139_isOutputDirty_TICK;
        }

    }
    { // xod__core__gate__pulse #140
        if (g_transaction.node_140_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(140);

            TypeOfNode140::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_67_output_VAL;

            ctxObj._isInputDirty_IN = g_transaction.node_134_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_140.evaluate(&ctxObj);

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

            TypeOfNode141::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_135._output_MEM;
            ctxObj._input_T = node_116._output_R;
            ctxObj._input_F = node_57_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_141.evaluate(&ctxObj);

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

            TypeOfNode142::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_135._output_MEM;
            ctxObj._input_IVAL = node_58_output_VAL;

            ctxObj._isInputDirty_EN = g_transaction.node_135_isOutputDirty_MEM;
            ctxObj._isInputDirty_RST = g_transaction.node_127_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_TICK = false;

            node_142.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_142_isOutputDirty_TICK = ctxObj._isOutputDirty_TICK;

            // mark downstream nodes dirty
            g_transaction.node_148_isNodeDirty |= g_transaction.node_142_isOutputDirty_TICK;
            g_transaction.node_149_isNodeDirty |= g_transaction.node_142_isOutputDirty_TICK;
            g_transaction.node_164_isNodeDirty |= g_transaction.node_142_isOutputDirty_TICK;
        }

    }
    { // xod__core__pulse_on_true #143
        if (g_transaction.node_143_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(143);

            TypeOfNode143::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_136._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_143.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_143_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_150_isNodeDirty |= g_transaction.node_143_isOutputDirty_OUT;
        }

    }
    { // xod__core__flip_flop #144
        if (g_transaction.node_144_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(144);

            TypeOfNode144::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_SET = false;
            ctxObj._isInputDirty_RST = false;
            ctxObj._isInputDirty_TGL = g_transaction.node_137_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_MEM = false;

            node_144.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_144_isOutputDirty_MEM = ctxObj._isOutputDirty_MEM;

            // mark downstream nodes dirty
            g_transaction.node_151_isNodeDirty |= g_transaction.node_144_isOutputDirty_MEM;
            g_transaction.node_152_isNodeDirty |= g_transaction.node_144_isOutputDirty_MEM;
        }

    }
    { // xod__core__if_error__string #145
        if (g_transaction.node_145_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(145);

            TypeOfNode145::ContextObject ctxObj;

            ctxObj._error_input_IN = 0;
            ctxObj._error_input_DEF = 0;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_138._output_R;
            ctxObj._input_DEF = node_37_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            TypeOfNode145::NodeErrors previousErrors = node_145.errors;

            node_145.evaluate(&ctxObj);

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
        if (g_transaction.node_146_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(146);

            TypeOfNode146::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_SET = false;
            ctxObj._isInputDirty_RST = false;
            ctxObj._isInputDirty_TGL = g_transaction.node_139_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_MEM = false;

            node_146.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_146_isOutputDirty_MEM = ctxObj._isOutputDirty_MEM;

            // mark downstream nodes dirty
            g_transaction.node_154_isNodeDirty |= g_transaction.node_146_isOutputDirty_MEM;
        }

    }
    { // xod__gpio__pwm_write #147
        if (g_transaction.node_147_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(147);

            TypeOfNode147::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_DUTY = node_124._output_OUT;

            ctxObj._isInputDirty_UPD = g_transaction.node_140_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DONE = false;

            node_147.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
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

            TypeOfNode148::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_STEP = node_84._output_OUT;

            ctxObj._isInputDirty_INC = g_transaction.node_142_isOutputDirty_TICK;
            ctxObj._isInputDirty_RST = g_transaction.node_127_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_148.evaluate(&ctxObj);

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

            TypeOfNode149::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_127_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_142_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_149.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_149_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_157_isNodeDirty |= g_transaction.node_149_isOutputDirty_OUT;
        }

    }
    { // xod__core__square_wave #150
        if (g_transaction.node_150_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(150);

            TypeOfNode150::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_T = node_15_output_VAL;
            ctxObj._input_DUTY = node_16_output_VAL;
            ctxObj._input_EN = node_133._output_OUT;

            ctxObj._isInputDirty_RST = g_transaction.node_143_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;
            ctxObj._isOutputDirty_N = false;

            node_150.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_150_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_158_isNodeDirty |= g_transaction.node_150_isOutputDirty_OUT;
            g_transaction.node_159_isNodeDirty |= g_transaction.node_150_isOutputDirty_OUT;
        }

    }
    { // xod__core__and #151
        if (g_transaction.node_151_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(151);

            TypeOfNode151::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_133._output_OUT;
            ctxObj._input_IN2 = node_144._output_MEM;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_151.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_160_isNodeDirty = true;
        }

    }
    { // xod__core__not #152
        if (g_transaction.node_152_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(152);

            TypeOfNode152::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_144._output_MEM;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_152.evaluate(&ctxObj);

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

            TypeOfNode153::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_145._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_153.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_153_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_162_isNodeDirty |= g_transaction.node_153_isOutputDirty_OUT;
        }

    }
    { // xod__core__if_else__string #154
        if (g_transaction.node_154_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(154);

            TypeOfNode154::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_146._output_MEM;
            ctxObj._input_T = node_33_output_VAL;
            ctxObj._input_F = node_131._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_154.evaluate(&ctxObj);

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

            TypeOfNode155::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_107._output_OUT;
            ctxObj._input_T = node_148._output_OUT;
            ctxObj._input_F = node_204._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_155.evaluate(&ctxObj);

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

            TypeOfNode156::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_148._output_OUT;
            ctxObj._input_IN2 = node_59_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_156.evaluate(&ctxObj);

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

            TypeOfNode157::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_NEW = node_141._output_R;

            ctxObj._isInputDirty_UPD = g_transaction.node_149_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_MEM = false;

            node_157.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_157_isOutputDirty_MEM = ctxObj._isOutputDirty_MEM;

            // mark downstream nodes dirty
            g_transaction.node_202_isNodeDirty |= g_transaction.node_157_isOutputDirty_MEM;
        }

    }
    { // xod__core__not #158
        if (g_transaction.node_158_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(158);

            TypeOfNode158::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_150._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_158.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_165_isNodeDirty = true;
        }

    }
    { // xod__core__cast_to_pulse__boolean #159
        if (g_transaction.node_159_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(159);

            TypeOfNode159::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_150._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_159.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_159_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_166_isNodeDirty |= g_transaction.node_159_isOutputDirty_OUT;
        }

    }
    { // xod__core__cast_to_number__boolean #160
        if (g_transaction.node_160_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(160);

            TypeOfNode160::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_151._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_160.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_167_isNodeDirty = true;
            g_transaction.node_168_isNodeDirty = true;
        }

    }
    { // xod__core__and #161
        if (g_transaction.node_161_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(161);

            TypeOfNode161::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN1 = node_133._output_OUT;
            ctxObj._input_IN2 = node_152._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_161.evaluate(&ctxObj);

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

            TypeOfNode162::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_153_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_80_isOutputDirty_BOOT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_162.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_162_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_170_isNodeDirty |= g_transaction.node_162_isOutputDirty_OUT;
        }

    }
    { // xod__core__if_else__string #163
        if (g_transaction.node_163_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(163);

            TypeOfNode163::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_133._output_OUT;
            ctxObj._input_T = node_154._output_R;
            ctxObj._input_F = node_131._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_163.evaluate(&ctxObj);

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

            TypeOfNode164::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_GATE = node_156._output_OUT;

            ctxObj._isInputDirty_TRIG = g_transaction.node_142_isOutputDirty_TICK;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_T = false;
            ctxObj._isOutputDirty_F = false;

            node_164.evaluate(&ctxObj);

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
        if (g_transaction.node_165_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(165);

            TypeOfNode165::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_158._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_165.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_165_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_174_isNodeDirty |= g_transaction.node_165_isOutputDirty_OUT;
        }

    }
    { // ____play_note #166
        if (g_transaction.node_166_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(166);

            TypeOfNode166::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_FREQ = node_23_output_VAL;
            ctxObj._input_DUR = node_81._output_OUT;

            ctxObj._isInputDirty_UPD = g_transaction.node_159_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_166.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__math__cube #167
        if (g_transaction.node_167_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(167);

            TypeOfNode167::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_160._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_167.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__pulse_on_change__number #168
        if (g_transaction.node_168_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(168);

            TypeOfNode168::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_160._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_168.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_168_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_175_isNodeDirty |= g_transaction.node_168_isOutputDirty_OUT;
        }

    }
    { // xod__core__cast_to_number__boolean #169
        if (g_transaction.node_169_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(169);

            TypeOfNode169::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_161._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_169.evaluate(&ctxObj);

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

            TypeOfNode170::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_162_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_89_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_170.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_170_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_178_isNodeDirty |= g_transaction.node_170_isOutputDirty_OUT;
        }

    }
    { // xod__core__if_error__string #171
        if (g_transaction.node_171_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(171);

            TypeOfNode171::ContextObject ctxObj;

            ctxObj._error_input_IN = 0;
            ctxObj._error_input_DEF = 0;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_163._output_R;
            ctxObj._input_DEF = node_49_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            TypeOfNode171::NodeErrors previousErrors = node_171.errors;

            node_171.evaluate(&ctxObj);

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

            TypeOfNode172::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_127_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_164_isOutputDirty_T;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_172.evaluate(&ctxObj);

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

            TypeOfNode173::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_SET = false;
            ctxObj._isInputDirty_TGL = g_transaction.node_164_isOutputDirty_F;
            ctxObj._isInputDirty_RST = g_transaction.node_127_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_MEM = false;

            node_173.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_173_isOutputDirty_MEM = ctxObj._isOutputDirty_MEM;

            // mark downstream nodes dirty
            g_transaction.node_185_isNodeDirty |= g_transaction.node_173_isOutputDirty_MEM;
        }

    }
    { // ____play_note #174
        if (g_transaction.node_174_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(174);

            TypeOfNode174::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_FREQ = node_20_output_VAL;
            ctxObj._input_DUR = node_98._output_OUT;

            ctxObj._isInputDirty_UPD = g_transaction.node_165_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_174.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__any #175
        if (g_transaction.node_175_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(175);

            TypeOfNode175::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_168_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_80_isOutputDirty_BOOT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_175.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_175_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_181_isNodeDirty |= g_transaction.node_175_isOutputDirty_OUT;
        }

    }
    { // xod__math__cube #176
        if (g_transaction.node_176_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(176);

            TypeOfNode176::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_169._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_176.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__pulse_on_change__number #177
        if (g_transaction.node_177_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(177);

            TypeOfNode177::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_169._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_177.evaluate(&ctxObj);

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

            TypeOfNode178::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_36_output_VAL;

            ctxObj._isInputDirty_IN = g_transaction.node_170_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_178.evaluate(&ctxObj);

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

            TypeOfNode179::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_171._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_179.evaluate(&ctxObj);

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

            TypeOfNode180::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_NEW = node_155._output_R;

            ctxObj._isInputDirty_UPD = g_transaction.node_172_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_MEM = false;

            node_180.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_180_isOutputDirty_MEM = ctxObj._isOutputDirty_MEM;

            // mark downstream nodes dirty
            g_transaction.node_185_isNodeDirty |= g_transaction.node_180_isOutputDirty_MEM;
            g_transaction.node_204_isNodeDirty |= g_transaction.node_180_isOutputDirty_MEM;
        }

    }
    { // xod__core__any #181
        if (g_transaction.node_181_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(181);

            TypeOfNode181::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_175_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_87_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_181.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_181_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_186_isNodeDirty |= g_transaction.node_181_isOutputDirty_OUT;
        }

    }
    { // xod__core__any #182
        if (g_transaction.node_182_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(182);

            TypeOfNode182::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_177_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_80_isOutputDirty_BOOT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_182.evaluate(&ctxObj);

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

            TypeOfNode183::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_DEV = node_123._output_DEVU0027;
            ctxObj._input_ROW = node_38_output_VAL;
            ctxObj._input_POS = node_39_output_VAL;
            ctxObj._input_LEN = node_40_output_VAL;
            ctxObj._input_VAL = node_145._output_OUT;

            ctxObj._isInputDirty_DO = g_transaction.node_178_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DEVU0027 = false;
            ctxObj._isOutputDirty_DONE = false;

            TypeOfNode183::NodeErrors previousErrors = node_183.errors;

            node_183.errors.output_DONE = false;

            node_183.evaluate(&ctxObj);

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

            TypeOfNode184::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_179_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_80_isOutputDirty_BOOT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_184.evaluate(&ctxObj);

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

            TypeOfNode185::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_COND = node_173._output_MEM;
            ctxObj._input_T = node_180._output_MEM;
            ctxObj._input_F = node_148._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_185.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_190_isNodeDirty = true;
        }

    }
    { // xod__core__gate__pulse #186
        if (g_transaction.node_186_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(186);

            TypeOfNode186::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_27_output_VAL;

            ctxObj._isInputDirty_IN = g_transaction.node_181_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_186.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_186_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_191_isNodeDirty |= g_transaction.node_186_isOutputDirty_OUT;
        }

    }
    { // xod__core__any #187
        if (g_transaction.node_187_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(187);

            TypeOfNode187::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_182_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_86_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_187.evaluate(&ctxObj);

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

            TypeOfNode188::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_123_isOutputDirty_DONE;
            ctxObj._isInputDirty_IN2 = g_transaction.node_183_isOutputDirty_DONE;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_188.evaluate(&ctxObj);

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

            TypeOfNode189::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_184_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_90_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_189.evaluate(&ctxObj);

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

            TypeOfNode190::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_X = node_185._output_R;
            ctxObj._input_Smin = node_62_output_VAL;
            ctxObj._input_Smax = node_63_output_VAL;
            ctxObj._input_Tmin = node_64_output_VAL;
            ctxObj._input_Tmax = node_65_output_VAL;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`

            node_190.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
            g_transaction.node_194_isNodeDirty = true;
        }

    }
    { // xod__gpio__pwm_write #191
        if (g_transaction.node_191_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(191);

            TypeOfNode191::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_DUTY = node_167._output_OUT;

            ctxObj._isInputDirty_UPD = g_transaction.node_186_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DONE = false;

            node_191.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__gate__pulse #192
        if (g_transaction.node_192_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(192);

            TypeOfNode192::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_25_output_VAL;

            ctxObj._isInputDirty_IN = g_transaction.node_187_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_192.evaluate(&ctxObj);

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

            TypeOfNode193::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_44_output_VAL;

            ctxObj._isInputDirty_IN = g_transaction.node_189_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_193.evaluate(&ctxObj);

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

            TypeOfNode194::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_190._output_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_194.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction
            g_transaction.node_194_isOutputDirty_OUT = ctxObj._isOutputDirty_OUT;

            // mark downstream nodes dirty
            g_transaction.node_197_isNodeDirty |= g_transaction.node_194_isOutputDirty_OUT;
        }

    }
    { // xod__gpio__pwm_write #195
        if (g_transaction.node_195_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(195);

            TypeOfNode195::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_DUTY = node_176._output_OUT;

            ctxObj._isInputDirty_UPD = g_transaction.node_192_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DONE = false;

            node_195.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod_dev__text_lcd__print_at__text_lcd_i2c_device #196

        if (g_transaction.node_196_hasUpstreamError) {
            g_transaction.node_198_hasUpstreamError = true;
        } else if (g_transaction.node_196_isNodeDirty) {
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(196);

            TypeOfNode196::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_DEV = node_183._output_DEVU0027;
            ctxObj._input_ROW = node_45_output_VAL;
            ctxObj._input_POS = node_46_output_VAL;
            ctxObj._input_LEN = node_47_output_VAL;
            ctxObj._input_VAL = node_171._output_OUT;

            ctxObj._isInputDirty_DO = g_transaction.node_193_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DEVU0027 = false;
            ctxObj._isOutputDirty_DONE = false;

            TypeOfNode196::NodeErrors previousErrors = node_196.errors;

            node_196.errors.output_DONE = false;

            node_196.evaluate(&ctxObj);

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

            TypeOfNode197::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_194_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_80_isOutputDirty_BOOT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_197.evaluate(&ctxObj);

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

            TypeOfNode198::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_188_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_196_isOutputDirty_DONE;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_198.evaluate(&ctxObj);

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

            TypeOfNode199::ContextObject ctxObj;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN1 = g_transaction.node_197_isOutputDirty_OUT;
            ctxObj._isInputDirty_IN2 = g_transaction.node_92_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_199.evaluate(&ctxObj);

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

            TypeOfNode200::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_EN = node_71_output_VAL;

            ctxObj._isInputDirty_IN = g_transaction.node_199_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            node_200.evaluate(&ctxObj);

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

            TypeOfNode201::ContextObject ctxObj;

            // copy data from upstream nodes into context
            ctxObj._input_DEV = node_85._output_DEV;
            ctxObj._input_VAL = node_190._output_OUT;

            ctxObj._isInputDirty_DO = g_transaction.node_200_isOutputDirty_OUT;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_DEVU0027 = false;
            ctxObj._isOutputDirty_ACK = false;

            node_201.evaluate(&ctxObj);

            // transfer possibly modified dirtiness state from context to g_transaction

            // mark downstream nodes dirty
        }

    }
    { // xod__core__defer__number #202

        if (g_transaction.node_202_isNodeDirty) {
            bool error_input_IN = false;
            error_input_IN |= node_203.errors.output_OUT;
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(202);

            TypeOfNode202::ContextObject ctxObj;

            ctxObj._error_input_IN = error_input_IN;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_157._output_MEM;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            TypeOfNode202::NodeErrors previousErrors = node_202.errors;

            node_202.evaluate(&ctxObj);

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
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(203);

            TypeOfNode203::ContextObject ctxObj;

            ctxObj._error_input_IN = 0;

            // copy data from upstream nodes into context

            ctxObj._isInputDirty_IN = g_transaction.node_164_isOutputDirty_F;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            TypeOfNode203::NodeErrors previousErrors = node_203.errors;

            node_203.evaluate(&ctxObj);

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
            error_input_IN |= node_203.errors.output_OUT;
            error_input_IN |= node_202.errors.output_OUT;
            XOD_TRACE_F("Eval node #");
            XOD_TRACE_LN(204);

            TypeOfNode204::ContextObject ctxObj;

            ctxObj._error_input_IN = error_input_IN;

            // copy data from upstream nodes into context
            ctxObj._input_IN = node_180._output_MEM;

            // initialize temporary output dirtyness state in the context,
            // where it can be modified from `raiseError` and `emitValue`
            ctxObj._isOutputDirty_OUT = false;

            TypeOfNode204::NodeErrors previousErrors = node_204.errors;

            node_204.evaluate(&ctxObj);

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
