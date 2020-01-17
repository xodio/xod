#ifndef __X_COLOR_PATTERN_H__
#define __X_COLOR_PATTERN_H__

using xod::XColor;

class PatternNode {
private:
    XColor _color;
    PatternNode* _next = nullptr;
public:
    PatternNode() {};
    PatternNode(XColor color) {
      setColor(color);
    };

    void setColor(XColor color) {
      _color = color;
    };
    void setNext(PatternNode* next) {
      _next = next;
    };

    XColor color() const {
        return _color;
    };

    PatternNode* next() const {
        return _next;
    };

    PatternNode* nextLooped(PatternNode* first) const {
        return (_next == nullptr) ? first : _next;
    };
};

class Pattern {
private:
    PatternNode* _first = nullptr;
    PatternNode* _last = nullptr;
public:
    void add(PatternNode* node) {
        if (_first == nullptr) {
            _first = node;
        }
        if (_last == nullptr) {
            _last = node;
        } else {
            // Link nodes
            _last->setNext(node);
            // Set node as _last
            _last = node;
        }
    };

    PatternNode* first() const {
        return _first;
    };

    PatternNode* last() const {
        return _last;
    };
};

#endif
