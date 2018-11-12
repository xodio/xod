template <typename T>
struct XodStringMaker {
    static std::string convert(T value) {
        size_t len = length(value) + 2;
        std::string str(len, '\0');
        size_t strPos = 1;

        str[0] = '"';
        str[len - 1] = '"';

        for (auto it = value.iterate(); it; ++it) {
            str[strPos++] = *it;
        }
        return str;
    }
};

namespace Catch {
template <>
struct StringMaker<xod::XString> {
    static std::string convert(xod::XString value) {
        return XodStringMaker<xod::XString>::convert(value);
    }
};

template <>
struct StringMaker<xod::XStringCString> {
    static std::string convert(xod::XStringCString value) {
        return XodStringMaker<xod::XStringCString>::convert(value);
    }
};
}
