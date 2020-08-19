#ifdef __AVR__
#include <avr/pgmspace.h>
#elif defined(ESP8266) || defined(ESP32)
#include <pgmspace.h>
#else
/*
 * Not all non-AVR boards installs define macros
 * for compatibility with existing PROGMEM-reading AVR code.
 */
#ifndef PROGMEM
#define PROGMEM
#endif
#ifndef PGM_P
#define PGM_P const char *
#endif
#ifndef SIZE_IRRELEVANT
#define SIZE_IRRELEVANT 0x7fffffff
#endif
#ifndef pgm_read_byte
#define pgm_read_byte(addr) (*(const unsigned char *)(addr))
#endif
#ifndef strcpy_P
char* strncpy_P(char* dest, PGM_P src, size_t size) {
    bool size_known = (size != SIZE_IRRELEVANT);
    const char* read = src;
    char* write = dest;
    char ch = '.';
    while (size > 0 && ch != '\0')
    {
        ch = pgm_read_byte(read++);
        *write++ = ch;
        size--;
    }
    if (size_known)
    {
        while (size > 0)
        {
            *write++ = 0;
            size--;
        }
    }

    return dest;
}
#define strcpy_P(dest, src) strncpy_P((dest), (src), SIZE_IRRELEVANT)
#endif
#endif // PROGMEM

/*
 * TetheringInternet class
 */
namespace xod {
namespace tethering_inet {

const char XOD_PREFIX[] PROGMEM = "+XOD:";

const char OK[] PROGMEM = "OK";
const char FAIL[] PROGMEM = "FAIL";
const char ERROR[] PROGMEM = "ERROR";
const char IPD[] PROGMEM = "IPD,";
const char CLOSED[] PROGMEM = "CLOSED";
const char CIFSR[] PROGMEM = "AT+CIFSR";
const char STAIP[] PROGMEM = "STAIP,\"";

const char AT[] PROGMEM = "AT";
const char CIPSEND[] PROGMEM = "AT+CIPSEND=";
const char CIPSTART[] PROGMEM = "AT+CIPSTART=\"";
const char CIPCLOSE[] PROGMEM = "AT+CIPCLOSE";
const char TCP[] PROGMEM = "TCP";

const char SEND_OK[] PROGMEM = "SEND OK";
const char LINK_IS_NOT[] PROGMEM = "link is not";
const char PROMPT[] PROGMEM = ">";

const char COMMA[] PROGMEM = ",";
const char COMMA_1[] PROGMEM = "\",";
const char COMMA_2[] PROGMEM = "\",\"";
const char COLON[] PROGMEM = ":";

const char EOL[] PROGMEM = "\r\n";

class TetheringInternet {
    private:
    #ifdef XOD_WASM_SERIAL_H
        WasmSerial_* _serial = &XOD_DEBUG_SERIAL;
    #else
        Stream* _serial = &XOD_DEBUG_SERIAL;
    #endif
        uint16_t _nodeId;
        bool _connected = false;
        static volatile uint16_t _pkgSize;
        void printPrefix() {
            writeCmd(XOD_PREFIX);
            _serial->print(transactionTime());
            writeCmd(COLON);
            _serial->print(_nodeId);
            writeCmd(COLON);
        }
        uint8_t readCmd(const char* text1, const char* text2 = nullptr, uint32_t timeout = 5000) {
            // setup buffers on stack & copy data from PROGMEM pointers
            char buf1[16] = { '\0' };
            char buf2[16] = { '\0' };
            if (text1 != nullptr)
                strcpy_P(buf1, text1);
            if (text2 != nullptr)
                strcpy_P(buf2, text2);
            uint8_t len1 = strlen(buf1);
            uint8_t len2 = strlen(buf2);
            uint8_t pos1 = 0;
            uint8_t pos2 = 0;
            // read chars until first match or timeout
            uint32_t stop = millis() + timeout;
            do {
                while (_serial->available()) {
                    char c = _serial->read();
                    pos1 = (c == buf1[pos1]) ? pos1 + 1 : 0;
                    pos2 = (c == buf2[pos2]) ? pos2 + 1 : 0;
                    if (len1 > 0 && pos1 == len1) {
                        return 1;
                    }
                    if (len2 > 0 && pos2 == len2) {
                        return 2;
                    }
                }
            } while (millis() < stop);
            return 0;
        }
        bool cmdOK(const char* okResponse, const char* failResponse = nullptr, uint32_t timeout = 1000) {
            uint8_t res = readCmd(okResponse, failResponse, timeout);
            return res == 1;
        }
        void writeCmd(const char* text1 = nullptr, const char* text2 = nullptr) {
            char buf[16] = { '\0' };
            strcpy_P(buf, text1);
            _serial->print(buf);
            if (text2 == EOL) {
                _serial->println();
            } else if (text2 != nullptr) {
                strcpy_P(buf, text2);
                _serial->print(buf);
            }
        }
    public:
        TetheringInternet(uint16_t nodeId) {
            _nodeId = nodeId;
        }

        static bool isReceiving() {
            return _pkgSize > 0;
        }
        static void beginReceiving(uint16_t pkgSize) {
            _pkgSize = pkgSize;
        }

        bool kick() {
            printPrefix();
            writeCmd(AT, EOL);
            _serial->flush();
            uint8_t res = readCmd(OK, ERROR);
            return res == 1;
        }
        bool openTcp(XString host, uint32_t port, uint16_t keepAlive = 0) {
            printPrefix();
            // Command + connection type
            writeCmd(CIPSTART);
            writeCmd(TCP);
            writeCmd(COMMA_2);
            // Host
            for (auto it = host.iterate(); it; ++it)
                _serial->print((char)*it);
            // Port
            writeCmd(COMMA_1);
            char _port[32];
            xod::formatNumber(port, 0, _port);
            _serial->print(port);
            // Delimiter
            writeCmd(COMMA);
            // Keep alive
            char _keepAlive[1];
            xod::formatNumber(keepAlive, 0, _keepAlive);
            _serial->println(keepAlive);
            _serial->flush();

            _connected = readCmd(OK, ERROR) == 1;
            return _connected;
        }
        bool send(XString req) {
            printPrefix();

            size_t len = length(req);
            char reqLen[len];
            xod::formatNumber(len, 0, reqLen);

            writeCmd(CIPSEND);
            _serial->println(reqLen);
            _serial->flush();

            bool prompt = cmdOK(PROMPT, LINK_IS_NOT);
            if (!prompt)
                return false;

            // Send message in a special way to wrap each line with a XOD prefix
            bool nextLine = true;
            bool cr = false;
            for (auto it = req.iterate(); it; ++it) {
                if (nextLine) {
                    printPrefix();
                    nextLine = false;
                }
                if (*it == '\r') {
                  cr = true;
                  _serial->print("\\r");
                } else if (*it == '\n') {
                    nextLine = true;
                    _serial->print("\\n");
                    if (cr) _serial->print('\r');
                    _serial->print('\n');
                } else {
                    _serial->print((char)*it);
                }
            }
            // Ensure the latest line of request sent
            if (!nextLine) {
                _serial->println();
            }

            _serial->flush();

            return cmdOK(SEND_OK, nullptr, 5000);
        }
        bool isConnected() {
          return _connected;
        }
        bool isAvailable() {
            return _serial->available();
        }
        bool receiveByte(char* outBuff, uint32_t timeout = 5000) {
            uint32_t stop = millis() + timeout;
            uint32_t a = 0;
            do {
                if (isAvailable() && isReceiving()) {
                    *outBuff = _serial->read();
                    _pkgSize--;
                    // Response with ACK character to request next chunks
                    if (_pkgSize == 0) {
                      printPrefix();
                      _serial->println('\6');
                    }
                    if (*outBuff == '\4') {
                      // end of transmittion symbol == connection closed
                      _connected = false;
                      _pkgSize = 0;
                    }
                    return true;
                }
            } while (a < stop);
            return false;
        }
        uint32_t getIP() {
            printPrefix();
            writeCmd(CIFSR, EOL);
            uint8_t code = readCmd(STAIP, ERROR);
            if (code == 1) {
                // found ip
                uint32_t ip[4];
                ip[0] = _serial->parseInt();
                _serial->read(); // .
                ip[1] = _serial->parseInt();
                _serial->read(); // .
                ip[2] = _serial->parseInt();
                _serial->read(); // .
                ip[3] = _serial->parseInt();

                if ((ip[0] | ip[1] | ip[2] | ip[3]) >= 0x100)
                    return 0;

                return ip[0] + ip[1] * 0x100 + ip[2] * 0x10000ul + ip[3] * 0x1000000ul;
            }
            return 0;
        }
        bool close(uint8_t linkId) {
            // TODO: MUX
            printPrefix();
            writeCmd(CIPCLOSE, EOL);
            _connected = false;
            _pkgSize = 0;
            return readCmd(OK, ERROR) == 1;
        }
};

volatile uint16_t TetheringInternet::_pkgSize = 0;

} // namespace tethering_inet
} // namespace xod

node {
    meta {
        // Alias to make accessible static class methods from `handleDebugProtocolMessages` function
        // Can be deleted after fixing mentioned function in the XOD runtime
        using TetheringInternet = tethering_inet::TetheringInternet;
        using Type = TetheringInternet*;
    }

    uint8_t mem[sizeof(TetheringInternet)];
    TetheringInternet* inet;

    void evaluate(Context ctx) {
        inet = new (mem) TetheringInternet(getNodeId(ctx));
        emitValue<output_INET>(ctx, inet);
    }
}
