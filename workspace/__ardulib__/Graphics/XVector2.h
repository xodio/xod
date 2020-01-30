
#ifndef X_VECTOR2_H
#define X_VECTOR2_H

/*
 * Utility template class for manipulating 2-dimensional vectors.
 */
template <typename T>
class XVector2 {
public:
    XVector2();
    XVector2(T X, T Y);

    template <typename U>
    explicit XVector2(const XVector2<U>& vector);

    T x;
    T y;
};

template <typename T>
XVector2<T> operator-(const XVector2<T>& right);

template <typename T>
XVector2<T>& operator+=(XVector2<T>& left, const XVector2<T>& right);

template <typename T>
XVector2<T>& operator-=(XVector2<T>& left, const XVector2<T>& right);

template <typename T>
XVector2<T> operator+(const XVector2<T>& left, const XVector2<T>& right);

template <typename T>
XVector2<T> operator-(const XVector2<T>& left, const XVector2<T>& right);

template <typename T>
XVector2<T> operator*(const XVector2<T>& left, T right);

template <typename T>
XVector2<T> operator*(T left, const XVector2<T>& right);

template <typename T>
XVector2<T>& operator*=(XVector2<T>& left, T right);

template <typename T>
XVector2<T> operator/(const XVector2<T>& left, T right);

template <typename T>
XVector2<T>& operator/=(XVector2<T>& left, T right);

template <typename T>
bool operator==(const XVector2<T>& left, const XVector2<T>& right);

template <typename T>
bool operator!=(const XVector2<T>& left, const XVector2<T>& right);

template <typename T>
inline XVector2<T>::XVector2()
    : x(0)
    , y(0) {}

template <typename T>
inline XVector2<T>::XVector2(T X, T Y)
    : x(X)
    , y(Y) {}

template <typename T>
template <typename U>
inline XVector2<T>::XVector2(const XVector2<U>& vector)
    : x(static_cast<T>(vector.x))
    , y(static_cast<T>(vector.y)) {}

template <typename T>
inline XVector2<T> operator-(const XVector2<T>& right) {
    return XVector2<T>(-right.x, -right.y);
}

template <typename T>
inline XVector2<T>& operator+=(XVector2<T>& left, const XVector2<T>& right) {
    left.x += right.x;
    left.y += right.y;

    return left;
}

template <typename T>
inline XVector2<T>& operator-=(XVector2<T>& left, const XVector2<T>& right) {
    left.x -= right.x;
    left.y -= right.y;

    return left;
}

template <typename T>
inline XVector2<T> operator+(const XVector2<T>& left, const XVector2<T>& right) {
    return XVector2<T>(left.x + right.x, left.y + right.y);
}

template <typename T>
inline XVector2<T> operator-(const XVector2<T>& left, const XVector2<T>& right) {
    return XVector2<T>(left.x - right.x, left.y - right.y);
}

template <typename T>
inline XVector2<T> operator*(const XVector2<T>& left, T right) {
    return XVector2<T>(left.x * right, left.y * right);
}

template <typename T>
inline XVector2<T> operator*(T left, const XVector2<T>& right) {
    return XVector2<T>(right.x * left, right.y * left);
}

template <typename T>
inline XVector2<T>& operator*=(XVector2<T>& left, T right) {
    left.x *= right;
    left.y *= right;

    return left;
}

template <typename T>
inline XVector2<T> operator/(const XVector2<T>& left, T right) {
    return XVector2<T>(left.x / right, left.y / right);
}

template <typename T>
inline XVector2<T>& operator/=(XVector2<T>& left, T right) {
    left.x /= right;
    left.y /= right;

    return left;
}

template <typename T>
inline bool operator==(const XVector2<T>& left, const XVector2<T>& right) {
    return (left.x == right.x) && (left.y == right.y);
}

template <typename T>
inline bool operator!=(const XVector2<T>& left, const XVector2<T>& right) {
    return (left.x != right.x) || (left.y != right.y);
}

#endif // X_VECTOR2_H
