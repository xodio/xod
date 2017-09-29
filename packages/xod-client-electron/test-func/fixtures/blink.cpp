// The sketch is auto-generated with XOD (https://xod.io).
//
// You can compile and upload it to an Arduino-compatible board with
// Arduino IDE.
//
// Rough code overview:
//
// - Intrusive pointer (a smart pointer with ref counter)
// - Immutable dynamic list data structure
// - XOD runtime environment
// - Native node implementation
// - Program graph definition
//
// Search for comments fenced with '====' and '----' to navigate through
// the major code blocks.

#include <Arduino.h>
#include <inttypes.h>
#include <avr/pgmspace.h>

// ============================================================================
//
// Intrusive pointer
//
// ============================================================================

// This is a stripped down version of Boost v1.63 intrusive pointer.
//
//  Copyright (c) 2001, 2002 Peter Dimov
//
// Distributed under the Boost Software License, Version 1.0. (See
// accompanying file LICENSE_1_0.txt or copy at
// http://www.boost.org/LICENSE_1_0.txt)
//
//  See http://www.boost.org/libs/smart_ptr/intrusive_ptr.html for
//  documentation.

#ifndef XOD_INTRUSIVE_PTR_H
#define XOD_INTRUSIVE_PTR_H

namespace boost {
//
//  intrusive_ptr
//
//  A smart pointer that uses intrusive reference counting.
//
//  Relies on unqualified calls to
//
//      void intrusive_ptr_add_ref(T * p);
//      void intrusive_ptr_release(T * p);
//
//          (p != 0)
//
//  The object is responsible for destroying itself.
//

template <class T> class intrusive_ptr {
  private:
    typedef intrusive_ptr this_type;

  public:
    typedef T element_type;

    constexpr intrusive_ptr() : px(0) {}

    intrusive_ptr(T *p, bool add_ref = true) : px(p) {
        if (px != 0 && add_ref)
            intrusive_ptr_add_ref(px);
    }

    template <class U>
    intrusive_ptr(intrusive_ptr<U> const &rhs) : px(rhs.get()) {
        if (px != 0)
            intrusive_ptr_add_ref(px);
    }

    intrusive_ptr(intrusive_ptr const &rhs) : px(rhs.px) {
        if (px != 0)
            intrusive_ptr_add_ref(px);
    }

    ~intrusive_ptr() {
        if (px != 0)
            intrusive_ptr_release(px);
    }

    template <class U> intrusive_ptr &operator=(intrusive_ptr<U> const &rhs) {
        this_type(rhs).swap(*this);
        return *this;
    }

    intrusive_ptr(intrusive_ptr &&rhs) : px(rhs.px) { rhs.px = 0; }

    intrusive_ptr &operator=(intrusive_ptr &&rhs) {
        this_type(static_cast<intrusive_ptr &&>(rhs)).swap(*this);
        return *this;
    }

    template <class U> friend class intrusive_ptr;

    template <class U> intrusive_ptr(intrusive_ptr<U> &&rhs) : px(rhs.px) {
        rhs.px = 0;
    }

    template <class U> intrusive_ptr &operator=(intrusive_ptr<U> &&rhs) {
        this_type(static_cast<intrusive_ptr<U> &&>(rhs)).swap(*this);
        return *this;
    }

    intrusive_ptr &operator=(intrusive_ptr const &rhs) {
        this_type(rhs).swap(*this);
        return *this;
    }

    intrusive_ptr &operator=(T *rhs) {
        this_type(rhs).swap(*this);
        return *this;
    }

    void reset() { this_type().swap(*this); }

    void reset(T *rhs) { this_type(rhs).swap(*this); }

    void reset(T *rhs, bool add_ref) { this_type(rhs, add_ref).swap(*this); }

    T *get() const { return px; }

    T *detach() {
        T *ret = px;
        px = 0;
        return ret;
    }

    T &operator*() const { return *px; }

    T *operator->() const { return px; }

    operator bool() const { return px != 0; }

    void swap(intrusive_ptr &rhs) {
        T *tmp = px;
        px = rhs.px;
        rhs.px = tmp;
    }

  private:
    T *px;
};

template <class T, class U>
inline bool operator==(intrusive_ptr<T> const &a, intrusive_ptr<U> const &b) {
    return a.get() == b.get();
}

template <class T, class U>
inline bool operator!=(intrusive_ptr<T> const &a, intrusive_ptr<U> const &b) {
    return a.get() != b.get();
}

template <class T, class U>
inline bool operator==(intrusive_ptr<T> const &a, U *b) {
    return a.get() == b;
}

template <class T, class U>
inline bool operator!=(intrusive_ptr<T> const &a, U *b) {
    return a.get() != b;
}

template <class T, class U>
inline bool operator==(T *a, intrusive_ptr<U> const &b) {
    return a == b.get();
}

template <class T, class U>
inline bool operator!=(T *a, intrusive_ptr<U> const &b) {
    return a != b.get();
}

#if __GNUC__ == 2 && __GNUC_MINOR__ <= 96

// Resolve the ambiguity between our op!= and the one in rel_ops

template <class T>
inline bool operator!=(intrusive_ptr<T> const &a, intrusive_ptr<T> const &b) {
    return a.get() != b.get();
}

#endif

template <class T>
inline bool operator==(intrusive_ptr<T> const &p, nullptr_t) {
    return p.get() == 0;
}

template <class T>
inline bool operator==(nullptr_t, intrusive_ptr<T> const &p) {
    return p.get() == 0;
}

template <class T>
inline bool operator!=(intrusive_ptr<T> const &p, nullptr_t) {
    return p.get() != 0;
}

template <class T>
inline bool operator!=(nullptr_t, intrusive_ptr<T> const &p) {
    return p.get() != 0;
}

template <class T>
inline bool operator<(intrusive_ptr<T> const &a, intrusive_ptr<T> const &b) {
    return a.get() < b.get();
}

template <class T> void swap(intrusive_ptr<T> &lhs, intrusive_ptr<T> &rhs) {
    lhs.swap(rhs);
}

} // namespace boost

#endif // #ifndef XOD_INTRUSIVE_PTR_H

// ============================================================================
//
// Immutable dynamic list
//
// ============================================================================

#ifndef XOD_LIST_H
#define XOD_LIST_H

#ifndef XOD_LIST_CHUNK_SIZE
#define XOD_LIST_CHUNK_SIZE 15
#endif

namespace xod {
// forward declaration
template <typename T> class List;
}

namespace xod {
namespace detail {

#if XOD_LIST_CHUNK_SIZE < 256
typedef uint8_t index_t;
#else
typedef size_t index_t;
#endif

typedef uint8_t refcount_t;
typedef uint8_t depth_t;

/*
 * Bounds define a used range of data within Chunk’s ring buffer.  `first` is
 * an index (not byte offset) of the first element in range.  `last` is an
 * index (not byte offset) of the last filled element.  I.e. `last` points to
 * an existing element, *not* a slot past end.
 *
 * Value of `first` can be greater than `last`. It means that the range is
 * wrapped arround buffer’s origin.
 *
 * Examples:
 *
 * - `first == 0 && last == 0`: chunk have 1 element and it is at buffer[0]
 * - `first == 0 && last == 15`: chunk have 16 elements spanning from buffer[0]
 *   to buffer[15] inclusive
 * - `first == 14 && last == 2`: given the chunk size == 16 it has 5 elements:
 *   buffer[14], buffer[15], buffer[0], buffer[1], buffer[2].
 */
struct Bounds {
#if XOD_LIST_CHUNK_SIZE < 16
    index_t first : 4;
    index_t last : 4;
#else
    index_t first;
    index_t last;
#endif
};

template <typename T> struct Traits {
    enum { N = XOD_LIST_CHUNK_SIZE / sizeof(T) };
};

/*
 * Ring buffer
 */
struct Chunk {
    char buffer[XOD_LIST_CHUNK_SIZE];
    Bounds bounds;
    refcount_t _refcount;

    Chunk() { memset(this, 0, sizeof(Chunk)); }

    /*
     * Returns number of elements occupied
     */
    template <typename T> index_t usage() {
        return (bounds.last - bounds.first + Traits<T>::N) % Traits<T>::N + 1;
    }

    template <typename T> bool isFull() { return usage<T>() == Traits<T>::N; }

    template <typename T> bool append(T val) {
        if (isFull<T>())
            return false;

        appendUnsafe(val);
        return true;
    }

    template <typename T> void appendUnsafe(T val) {
        auto idx = ++bounds.last;
        *((T *)buffer + idx) = val;
    }

    template <typename T> bool concat(T *val, index_t len) {
        if (usage<T>() > Traits<T>::N - len)
            return false;

        while (len--)
            appendUnsafe(*val++);

        return true;
    }
};

void intrusive_ptr_add_ref(Chunk *chunk) {
    // TODO: deal with possible overflow
    ++chunk->_refcount;
}

void intrusive_ptr_release(Chunk *chunk) {
    if (--chunk->_refcount == 0) {
        delete chunk;
    }
}

template <typename T> class ListIterator {
    typedef List<T> ListT;
    typedef const ListT *ListRawPtr;

  public:
    ListIterator(ListRawPtr root) {
        _stackSize = 0;
        if (root->isEmpty()) {
            _stack = 0;
        } else {
            _stack = new ListRawPtr[root->maxDepth()];
            push(root);
            drillDownToLeftmost();
        }
    }

    ~ListIterator() {
        if (_stack)
            delete[] _stack;
    }

    /*
     * Returns false if iteration is done
     */
    operator bool() const { return _stackSize > 0; }

    const T &operator*() const { return chunk()->buffer[_indexInChunk]; }

    ListIterator &operator++() {
        if (!_stackSize)
            return *this;

        ++_indexInChunk;

        if (_indexInChunk > top()->_rightBounds.last) {
            // we’ve runned over whole chunk, move to next one
            while (true) {
                auto branch = pop();

                if (!_stackSize)
                    break;

                auto parent = top();
                if (parent->_left == branch) {
                    // switch to right branch if we just completed with left one
                    push(parent->_right.get());
                    drillDownToLeftmost();
                    break;
                }
            }
        }

        return *this;
    }

  private:
    ListRawPtr top() const { return _stack[_stackSize - 1]; }

    void push(ListRawPtr list) { _stack[_stackSize++] = list; }

    ListRawPtr pop() { return _stack[_stackSize-- - 1]; }

    void drillDownToLeftmost() {
        ListRawPtr left;
        while ((left = top()->_left.get()))
            push(left);
        _indexInChunk = top()->_rightBounds.first;
    }

    Chunk *chunk() const { return top()->_chunk.get(); }

  private:
    ListRawPtr *_stack;
    depth_t _stackSize;
    index_t _indexInChunk;
};
}
} // namespace xod::detail

namespace xod {

template <typename T> void intrusive_ptr_add_ref(List<T> *list) {
    // TODO: deal with possible overflow
    ++list->_refcount;
}

template <typename T> void intrusive_ptr_release(List<T> *list) {
    if (--list->_refcount == 0) {
        delete list;
    }
}

template <typename T> class List {
    typedef boost::intrusive_ptr<detail::Chunk> ChunkPtr;

  public:
    typedef boost::intrusive_ptr<List> ListPtr;
    typedef detail::ListIterator<T> Iterator;

    static ListPtr empty() { return ListPtr(new List()); }

    static ListPtr of(T val) {
        auto list = empty();
        auto chunk = new detail::Chunk();
        chunk->buffer[0] = val;
        list->_chunk = chunk;
        return list;
    }

    static ListPtr fromPlainArray(const T *buf, size_t len) {
        auto list = empty();
        if (!len)
            return list;

        if (len <= detail::Traits<T>::N) {
            // whole buf can be contained within a single chunk
            auto chunk = new detail::Chunk();
            memcpy(chunk->buffer, buf, len);
            list->_chunk = chunk;
            list->_rightBounds.last = chunk->bounds.last = len - 1;
        } else {
            // split the buffer into two portions
            auto leftLen = len / 2;
            list->_left = fromPlainArray(buf, leftLen);
            list->_right = fromPlainArray(buf + leftLen, len - leftLen);
        }

        return list;
    }

    bool isEmpty() const { return length() == 0; }

    size_t length() const {
        if (_left == nullptr && _right == nullptr) {
            return 0;
        } else if (chunk()) {
            return _rightBounds.last - _rightBounds.first + 1;
        } else {
            return _left->length() + _right->length();
        }
    }

    size_t chunkCount() const {
        if (_left) {
            return _left->chunkCount() + _right->chunkCount();
        } else if (_chunk) {
            return 1;
        } else {
            return 0;
        }
    }

    detail::depth_t maxDepth() const {
        if (_left) {
            auto leftDepth = _left->maxDepth();
            auto rightDepth = _right->maxDepth();
            return 1 + (leftDepth > rightDepth ? leftDepth : rightDepth);
        } else {
            return 1;
        }
    }

    ListPtr append(T val) const {
        if (length() == 0) {
            return of(val);
        }

        auto chunk = this->chunk();

        if (chunk && isChunkTailFree()) {
            bool amend = chunk->append(val);
            if (amend) {
                auto list = empty();
                list->_chunk = chunk;
                list->_rightBounds.last = _rightBounds.last + 1;
                return list;
            }
        }

        auto list = empty();
        list->_left = const_cast<List *>(this);
        list->_right = of(val);
        return list;
    }

    ListPtr concat(ListPtr other) const {
        if (isEmpty()) {
            return other;
        }

        if (other->isEmpty()) {
            return ListPtr(const_cast<List *>(this));
        }

        auto thisChunk = this->chunk();
        auto otherChunk = other->chunk();
        auto otherLen = other->length();
        if (thisChunk && isChunkTailFree() && otherChunk) {
            bool amend = thisChunk->concat(otherChunk->buffer, otherLen);
            if (amend) {
                auto list = empty();
                list->_chunk = thisChunk;
                list->_rightBounds.first = _rightBounds.first;
                list->_rightBounds.last = thisChunk->bounds.last;
                return list;
            }
        }

        auto list = empty();
        list->_left = const_cast<List *>(this);
        list->_right = other;
        return list;
    }

    void toPlainArrayUnsafe(T *buf) const {
        auto chunk = this->chunk();
        if (chunk) {
            memcpy(buf, chunk->buffer, length() * sizeof(T));
        } else if (_left) {
            _left->toPlainArrayUnsafe(buf);
            _right->toPlainArrayUnsafe(buf + _left->length());
        }
    }

    Iterator iterate() const { return Iterator(this); }

  protected:
    ChunkPtr chunk() const {
        if (_left == nullptr) {
            return _chunk;
        } else {
            return nullptr;
        }
    }

    bool isChunkTailFree() const {
      return _chunk->bounds.last == _rightBounds.last;
    }

  private:
    List() { memset(this, 0, sizeof(List)); }

    ~List() {
        // _right branch is in union with _chunk. Call a proper destructor
        // explicitly
        if (_left) {
            _right.~ListPtr();
        } else {
            _chunk.~ChunkPtr();
        }
    }

    friend Iterator;

    // There are two possible conditions of a list. It either:
    //
    // - concatenation of two children, in that case `_left` and `_right` point
    //   to branches
    // - a leaf with data, in that case `_left == nullptr` and `_chunk` contains
    //   pointer to the data
    //
    // Use union to save one pointer size, consider `_left` nullness to
    // understand the condition.
    ListPtr _left;
    union {
        ListPtr _right;
        ChunkPtr _chunk;
    };

    // Branch bounds inside chunks. In case if this is a leaf, only _rightBounds
    // is used.
    //
    // Note that the bounds will not match bounds in chunks themselves. It’s
    // because the chunks are reused across many List’s.
    detail::Bounds _leftBounds;
    detail::Bounds _rightBounds;

    friend void intrusive_ptr_add_ref<T>(List *list);
    friend void intrusive_ptr_release<T>(List *list);
    detail::refcount_t _refcount;
}; // class List<T>

} // namespace xod

#endif // #ifndef XOD_LIST_H


/*=============================================================================
 *
 *
 * Configuration
 *
 *
 =============================================================================*/

#define NODE_COUNT          5
#define MAX_OUTPUT_COUNT    1

// Uncomment to trace the program in the Serial Monitor
//#define XOD_DEBUG


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
#ifndef DEBUG_SERIAL
#  define DEBUG_SERIAL Serial
#endif

#ifdef XOD_DEBUG
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

//----------------------------------------------------------------------------
// Compatibilities
//----------------------------------------------------------------------------

#if !defined(ARDUINO_ARCH_AVR)
/*
 * Provide dtostrf function for non-AVR platforms. Although many platforms
 * provide a stub many others do not. And the stub is based on `sprintf`
 * which doesn’t work with floating point formatters on some platforms
 * (e.g. Arduino M0).
 *
 * This is an implementation based on `fcvt` standard function. Taken here:
 * https://forum.arduino.cc/index.php?topic=368720.msg2542614#msg2542614
 */
char *dtostrf(double val, int width, unsigned int prec, char *sout) {
    int decpt, sign, reqd, pad;
    const char *s, *e;
    char *p;
    s = fcvt(val, prec, &decpt, &sign);
    if (prec == 0 && decpt == 0) {
        s = (*s < '5') ? "0" : "1";
        reqd = 1;
    } else {
        reqd = strlen(s);
        if (reqd > decpt) reqd++;
        if (decpt == 0) reqd++;
    }
    if (sign) reqd++;
    p = sout;
    e = p + reqd;
    pad = width - reqd;
    if (pad > 0) {
        e += pad;
        while (pad-- > 0) *p++ = ' ';
    }
    if (sign) *p++ = '-';
    if (decpt <= 0 && prec > 0) {
        *p++ = '0';
        *p++ = '.';
        e++;
        while ( decpt < 0 ) {
            decpt++;
            *p++ = '0';
        }
    }
    while (p < e) {
        *p++ = *s++;
        if (p == e) break;
        if (--decpt == 0) *p++ = '.';
    }
    if (width < 0) {
        pad = (reqd + width) * -1;
        while (pad-- > 0) *p++ = ' ';
    }
    *p = 0;
    return sout;
}
#endif


namespace xod {
//----------------------------------------------------------------------------
// Type definitions
//----------------------------------------------------------------------------
#define NO_NODE                 ((NodeId)-1)

typedef double Number;
typedef bool Logic;

#if NODE_COUNT < 256
typedef uint8_t NodeId;
#elif NODE_COUNT < 65536
typedef uint16_t NodeId;
#else
typedef uint32_t NodeId;
#endif

/*
 * Context is a handle passed to each node `evaluate` function. Currently, it’s
 * alias for NodeId but likely will be changed in future to support list
 * lifting and other features
 */
typedef NodeId Context;

/*
 * LSB of a dirty flag shows whether a particular node is dirty or not
 * Other bits shows dirtieness of its particular outputs:
 * - 1-st bit for 0-th output
 * - 2-nd bit for 1-st output
 * - etc
 *
 * An outcome limitation is that a native node must not have more than 7 output
 * pins.
 */
typedef uint8_t DirtyFlags;

typedef unsigned long TimeMs;
typedef void (*EvalFuncPtr)(Context ctx);

typedef xod::List<char>::ListPtr XString;

/*
 * Each input stores a reference to its upstream node so that we can get values
 * on input pins. Having a direct pointer to the value is not enough because we
 * want to know dirty’ness as well. So we have to use this structure instead of
 * a pointer.
 */
struct UpstreamPinRef {
    // Upstream node ID
    NodeId nodeId;
    // Index of the upstream node’s output.
    // Use 3 bits as it just enough to store values 0..7
    uint16_t pinIndex : 3;
    // Byte offset in a storage of the upstream node where the actual pin value
    // is stored
    uint16_t storageOffset : 13;
};

/*
 * Input descriptor is a metaprogramming structure used to enforce an
 * input’s type and store its wiring data location as a zero-RAM constant.
 *
 * A specialized descriptor is required by `getValue` function. Every
 * input of every type node gets its own descriptor in generated code that
 * can be accessed as input_FOO. Where FOO is a pin identifier.
 */
template<typename ValueT_, size_t wiringOffset>
struct InputDescriptor {
    typedef ValueT_ ValueT;
    enum {
        WIRING_OFFSET = wiringOffset
    };
};

/*
 * Output descriptor serve the same purpose as InputDescriptor but for
 * outputs.
 *
 * In addition to wiring data location it keeps storage data location (where
 * actual value is stored) and own zero-based index among outputs of a particular
 * node
 */
template<typename ValueT_, size_t wiringOffset, size_t storageOffset, uint8_t index>
struct OutputDescriptor {
    typedef ValueT_ ValueT;
    enum {
        WIRING_OFFSET = wiringOffset,
        STORAGE_OFFSET = storageOffset,
        INDEX = index
    };
};

//----------------------------------------------------------------------------
// Forward declarations
//----------------------------------------------------------------------------
extern void* const g_storages[NODE_COUNT];
extern const void* const g_wiring[NODE_COUNT];
extern DirtyFlags g_dirtyFlags[NODE_COUNT];

// TODO: replace with a compact list
extern TimeMs g_schedule[NODE_COUNT];

void clearTimeout(NodeId nid);
bool isTimedOut(NodeId nid);

//----------------------------------------------------------------------------
// Engine (private API)
//----------------------------------------------------------------------------

TimeMs g_transactionTime;

void* getStoragePtr(NodeId nid, size_t offset) {
    return (uint8_t*)pgm_read_ptr(&g_storages[nid]) + offset;
}

template<typename T>
T getStorageValue(NodeId nid, size_t offset) {
    return *reinterpret_cast<T*>(getStoragePtr(nid, offset));
}

void* getWiringPgmPtr(NodeId nid, size_t offset) {
    return (uint8_t*)pgm_read_ptr(&g_wiring[nid]) + offset;
}

template<typename T>
T getWiringValue(NodeId nid, size_t offset) {
    T result;
    memcpy_P(&result, getWiringPgmPtr(nid, offset), sizeof(T));
    return result;
}

bool isOutputDirty(NodeId nid, uint8_t index) {
    return g_dirtyFlags[nid] & (1 << (index + 1));
}

bool isInputDirtyImpl(NodeId nid, size_t wiringOffset) {
    UpstreamPinRef ref = getWiringValue<UpstreamPinRef>(nid, wiringOffset);
    if (ref.nodeId == NO_NODE)
        return false;

    return isOutputDirty(ref.nodeId, ref.pinIndex);
}

template<typename InputT>
bool isInputDirty(NodeId nid) {
    return isInputDirtyImpl(nid, InputT::WIRING_OFFSET);
}

void markPinDirty(NodeId nid, uint8_t index) {
    g_dirtyFlags[nid] |= 1 << (index + 1);
}

void markNodeDirty(NodeId nid) {
    g_dirtyFlags[nid] |= 0x1;
}

bool isNodeDirty(NodeId nid) {
    return g_dirtyFlags[nid] & 0x1;
}

template<typename T>
T getOutputValueImpl(NodeId nid, size_t storageOffset) {
    return getStorageValue<T>(nid, storageOffset);
}

template<typename T>
T getInputValueImpl(NodeId nid, size_t wiringOffset) {
    UpstreamPinRef ref = getWiringValue<UpstreamPinRef>(nid, wiringOffset);
    if (ref.nodeId == NO_NODE)
        return (T)0;

    return getOutputValueImpl<T>(ref.nodeId, ref.storageOffset);
}

template<typename T>
struct always_false {
    enum { value = 0 };
};

// GetValue -- classical trick for partial function (API `xod::getValue`)
// template specialization
template<typename InputOutputT>
struct GetValue {
    static typename InputOutputT::ValueT getValue(Context ctx) {
        static_assert(
                always_false<InputOutputT>::value,
                "You should provide an input_XXX or output_YYY argument " \
                "in angle brackets of getValue"
                );

    }
};

template<typename ValueT, size_t wiringOffset>
struct GetValue<InputDescriptor<ValueT, wiringOffset>> {
    static ValueT getValue(Context ctx) {
        return getInputValueImpl<ValueT>(ctx, wiringOffset);
    }
};

template<typename ValueT, size_t wiringOffset, size_t storageOffset, uint8_t index>
struct GetValue<OutputDescriptor<ValueT, wiringOffset, storageOffset, index>> {
    static ValueT getValue(Context ctx) {
        return getOutputValueImpl<ValueT>(ctx, storageOffset);
    }
};

template<typename T>
void emitValueImpl(
        NodeId nid,
        size_t storageOffset,
        size_t wiringOffset,
        uint8_t index,
        T value) {

    // Store new value and make the node itself dirty
    T* storedValue = reinterpret_cast<T*>(getStoragePtr(nid, storageOffset));
    *storedValue = value;
    markPinDirty(nid, index);

    // Notify downstream nodes about changes
    // NB: linked nodes array is in PGM space
    const NodeId* pDownstreamNid = getWiringValue<const NodeId*>(nid, wiringOffset);
    NodeId downstreamNid = pgm_read_nodeid(pDownstreamNid);

    while (downstreamNid != NO_NODE) {
        markNodeDirty(downstreamNid);
        downstreamNid = pgm_read_nodeid(pDownstreamNid++);
    }
}

void evaluateNode(NodeId nid) {
    XOD_TRACE_F("eval #");
    XOD_TRACE_LN(nid);
    EvalFuncPtr eval = getWiringValue<EvalFuncPtr>(nid, 0);
    eval(nid);
}

void runTransaction() {
    g_transactionTime = millis();

    XOD_TRACE_F("Transaction started, t=");
    XOD_TRACE_LN(g_transactionTime);

    for (NodeId nid = 0; nid < NODE_COUNT; ++nid) {
        if (isNodeDirty(nid)) {
            evaluateNode(nid);

            // If the schedule is stale, clear timeout so that
            // the node would not be marked dirty again in idle
            if (isTimedOut(nid))
                clearTimeout(nid);
        }
    }

    // Clear dirtieness for all nodes and pins
    memset(g_dirtyFlags, 0, sizeof(g_dirtyFlags));

    XOD_TRACE_F("Transaction completed, t=");
    XOD_TRACE_LN(millis());
}

void idle() {
    // Mark timed out nodes dirty. Do not reset schedule here to give
    // a chance for a node to get a reasonable result from `isTimedOut`
    TimeMs now = millis();
    for (NodeId nid = 0; nid < NODE_COUNT; ++nid) {
        TimeMs t = g_schedule[nid];
        if (t && t < now)
            markNodeDirty(nid);
    }
}

//----------------------------------------------------------------------------
// Public API (can be used by native nodes’ `evaluate` functions)
//----------------------------------------------------------------------------

template<typename InputOutputT>
typename InputOutputT::ValueT getValue(Context ctx) {
    return GetValue<InputOutputT>::getValue(ctx);
}

template<typename OutputT>
void emitValue(NodeId nid, typename OutputT::ValueT value) {
    emitValueImpl(
            nid,
            OutputT::STORAGE_OFFSET,
            OutputT::WIRING_OFFSET,
            OutputT::INDEX,
            value);
}

TimeMs transactionTime() {
    return g_transactionTime;
}

void setTimeout(NodeId nid, TimeMs timeout) {
    g_schedule[nid] = transactionTime() + timeout;
}

void clearTimeout(NodeId nid) {
    g_schedule[nid] = 0;
}

bool isTimedOut(NodeId nid) {
    return g_schedule[nid] < transactionTime();
}

} // namespace xod

//----------------------------------------------------------------------------
// Entry point
//----------------------------------------------------------------------------
void setup() {
    // FIXME: looks like there is a rounding bug. Waiting for 1 second fights it
    delay(1000);
#ifdef XOD_DEBUG
    DEBUG_SERIAL.begin(115200);
#endif
    XOD_TRACE_FLN("\n\nProgram started");
}

void loop() {
    xod::idle();
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
// xod/core/clock implementation
//-----------------------------------------------------------------------------
namespace xod__core__clock {

struct State {
  TimeMs nextTrig;
};

struct Storage {
    State state;
    Logic output_TICK;
};

struct Wiring {
    EvalFuncPtr eval;
    UpstreamPinRef input_IVAL;
    UpstreamPinRef input_RST;
    const NodeId* output_TICK;
};

State* getState(NodeId nid) {
    return reinterpret_cast<State*>(getStoragePtr(nid, 0));
}

using input_IVAL = InputDescriptor<Number, offsetof(Wiring, input_IVAL)>;
using input_RST = InputDescriptor<Logic, offsetof(Wiring, input_RST)>;

using output_TICK = OutputDescriptor<Logic, offsetof(Wiring, output_TICK), offsetof(Storage, output_TICK), 0>;

void evaluate(Context ctx) {
    State* state = getState(ctx);
    TimeMs tNow = transactionTime();
    TimeMs dt = getValue<input_IVAL>(ctx) * 1000;
    TimeMs tNext = tNow + dt;

    if (isInputDirty<input_RST>(ctx)) {
        if (dt == 0) {
            state->nextTrig = 0;
            clearTimeout(ctx);
        } else if (state->nextTrig < tNow || state->nextTrig > tNext) {
            state->nextTrig = tNext;
            setTimeout(ctx, dt);
        }
    } else {
        // It was a scheduled tick
        emitValue<output_TICK>(ctx, 1);
        state->nextTrig = tNext;
        setTimeout(ctx, dt);
    }
}

} // namespace xod__core__clock

//-----------------------------------------------------------------------------
// xod/core/flip_flop implementation
//-----------------------------------------------------------------------------
namespace xod__core__flip_flop {

struct State {
};

struct Storage {
    State state;
    Logic output_MEM;
};

struct Wiring {
    EvalFuncPtr eval;
    UpstreamPinRef input_SET;
    UpstreamPinRef input_TGL;
    UpstreamPinRef input_RST;
    const NodeId* output_MEM;
};

State* getState(NodeId nid) {
    return reinterpret_cast<State*>(getStoragePtr(nid, 0));
}

using input_SET = InputDescriptor<Logic, offsetof(Wiring, input_SET)>;
using input_TGL = InputDescriptor<Logic, offsetof(Wiring, input_TGL)>;
using input_RST = InputDescriptor<Logic, offsetof(Wiring, input_RST)>;

using output_MEM = OutputDescriptor<Logic, offsetof(Wiring, output_MEM), offsetof(Storage, output_MEM), 0>;

void evaluate(Context ctx) {
    bool oldState = getValue<output_MEM>(ctx);
    bool newState = oldState;

    if (isInputDirty<input_TGL>(ctx)) {
        newState = !oldState;
    } else if (isInputDirty<input_SET>(ctx)) {
        newState = true;
    } else {
        newState = false;
    }

    if (newState == oldState)
        return;

    emitValue<output_MEM>(ctx, newState);
}

} // namespace xod__core__flip_flop

//-----------------------------------------------------------------------------
// xod/core/digital_output implementation
//-----------------------------------------------------------------------------
namespace xod__core__digital_output {

struct State {
    int configuredPort = -1;
};

struct Storage {
    State state;
};

struct Wiring {
    EvalFuncPtr eval;
    UpstreamPinRef input_PORT;
    UpstreamPinRef input_SIG;
};

State* getState(NodeId nid) {
    return reinterpret_cast<State*>(getStoragePtr(nid, 0));
}

using input_PORT = InputDescriptor<Number, offsetof(Wiring, input_PORT)>;
using input_SIG = InputDescriptor<Logic, offsetof(Wiring, input_SIG)>;

void evaluate(Context ctx) {
    State* state = getState(ctx);
    const int port = (int)getValue<input_PORT>(ctx);
    if (port != state->configuredPort) {
        ::pinMode(port, OUTPUT);
        // Store configured port so to avoid repeating `pinMode` call if just
        // SIG is updated
        state->configuredPort = port;
    }

    const bool val = getValue<input_SIG>(ctx);
    ::digitalWrite(port, val);
}

} // namespace xod__core__digital_output

//-----------------------------------------------------------------------------
// xod/core/constant_number implementation
//-----------------------------------------------------------------------------
namespace xod__core__constant_number {

struct State {};

struct Storage {
    State state;
    Number output_VAL;
};

struct Wiring {
    EvalFuncPtr eval;
    const NodeId* output_VAL;
};

State* getState(NodeId nid) {
    return reinterpret_cast<State*>(getStoragePtr(nid, 0));
}

using output_VAL = OutputDescriptor<Number, offsetof(Wiring, output_VAL), offsetof(Storage, output_VAL), 0>;

void evaluate(Context ctx) {
}

} // namespace xod__core__constant_number

} // namespace xod

/*=============================================================================
 *
 *
 * Program graph
 *
 *
 =============================================================================*/

namespace xod {

    //-------------------------------------------------------------------------
    // Dynamic data
    //-------------------------------------------------------------------------

    // Storage of #0 xod/core/constant_number
    xod__core__constant_number::Storage storage_0 = {
        { }, // state
        0.25 // output_VAL
    };

    // Storage of #1 xod/core/constant_number
    xod__core__constant_number::Storage storage_1 = {
        { }, // state
        13 // output_VAL
    };

    // Storage of #2 xod/core/clock
    xod__core__clock::Storage storage_2 = {
        { }, // state
        false // output_TICK
    };

    // Storage of #3 xod/core/flip_flop
    xod__core__flip_flop::Storage storage_3 = {
        { }, // state
        false // output_MEM
    };

    // Storage of #4 xod/core/digital_output
    xod__core__digital_output::Storage storage_4 = {
        { }, // state
    };

    DirtyFlags g_dirtyFlags[NODE_COUNT] = {
        DirtyFlags(255),
        DirtyFlags(255),
        DirtyFlags(253),
        DirtyFlags(255),
        DirtyFlags(255)
    };

    TimeMs g_schedule[NODE_COUNT] = { 0 };

    //-------------------------------------------------------------------------
    // Static (immutable) data
    //-------------------------------------------------------------------------

    // Wiring of #0 xod/core/constant_number
    const NodeId outLinks_0_VAL[] PROGMEM = { 2, NO_NODE };
    const xod__core__constant_number::Wiring wiring_0 PROGMEM = {
        &xod__core__constant_number::evaluate,
        // inputs (UpstreamPinRef’s initializers)
        // outputs (NodeId list binding)
        outLinks_0_VAL // output_VAL
    };

    // Wiring of #1 xod/core/constant_number
    const NodeId outLinks_1_VAL[] PROGMEM = { 4, NO_NODE };
    const xod__core__constant_number::Wiring wiring_1 PROGMEM = {
        &xod__core__constant_number::evaluate,
        // inputs (UpstreamPinRef’s initializers)
        // outputs (NodeId list binding)
        outLinks_1_VAL // output_VAL
    };

    // Wiring of #2 xod/core/clock
    const NodeId outLinks_2_TICK[] PROGMEM = { 3, NO_NODE };
    const xod__core__clock::Wiring wiring_2 PROGMEM = {
        &xod__core__clock::evaluate,
        // inputs (UpstreamPinRef’s initializers)
        { NodeId(0),
            xod__core__constant_number::output_VAL::INDEX,
            xod__core__constant_number::output_VAL::STORAGE_OFFSET }, // input_IVAL
        { NO_NODE, 0, 0 }, // input_RST
        // outputs (NodeId list binding)
        outLinks_2_TICK // output_TICK
    };

    // Wiring of #3 xod/core/flip_flop
    const NodeId outLinks_3_MEM[] PROGMEM = { 4, NO_NODE };
    const xod__core__flip_flop::Wiring wiring_3 PROGMEM = {
        &xod__core__flip_flop::evaluate,
        // inputs (UpstreamPinRef’s initializers)
        { NO_NODE, 0, 0 }, // input_SET
        { NodeId(2),
            xod__core__clock::output_TICK::INDEX,
            xod__core__clock::output_TICK::STORAGE_OFFSET }, // input_TGL
        { NO_NODE, 0, 0 }, // input_RST
        // outputs (NodeId list binding)
        outLinks_3_MEM // output_MEM
    };

    // Wiring of #4 xod/core/digital_output
    const xod__core__digital_output::Wiring wiring_4 PROGMEM = {
        &xod__core__digital_output::evaluate,
        // inputs (UpstreamPinRef’s initializers)
        { NodeId(1),
            xod__core__constant_number::output_VAL::INDEX,
            xod__core__constant_number::output_VAL::STORAGE_OFFSET }, // input_PORT
        { NodeId(3),
            xod__core__flip_flop::output_MEM::INDEX,
            xod__core__flip_flop::output_MEM::STORAGE_OFFSET }, // input_SIG
        // outputs (NodeId list binding)
    };

    // PGM array with pointers to PGM wiring information structs
    const void* const g_wiring[NODE_COUNT] PROGMEM = {
        &wiring_0,
        &wiring_1,
        &wiring_2,
        &wiring_3,
        &wiring_4
    };

    // PGM array with pointers to RAM-located storages
    void* const g_storages[NODE_COUNT] PROGMEM = {
        &storage_0,
        &storage_1,
        &storage_2,
        &storage_3,
        &storage_4
    };
}
