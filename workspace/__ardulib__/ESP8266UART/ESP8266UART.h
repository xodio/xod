#ifndef __ESP8266_UART_H__
#define __ESP8266_UART_H__

// #define ESP8266_DEBUG

const char OK[] PROGMEM = "OK";
const char FAIL[] PROGMEM = "FAIL";
const char ERROR[] PROGMEM = "ERROR";

const char SEND_OK[] PROGMEM = "SEND OK";
const char LINK_IS_NOT[] PROGMEM = "link is not";
const char PROMPT[] PROGMEM = ">";
const char NO_IP[] PROGMEM = "0.0.0.0";
const char CONNECTED[] PROGMEM = "WIFI CONNECTED";
const char GOT_IP[] PROGMEM = "WIFI GOT IP";

const char AT[] PROGMEM = "AT";
const char CIPSEND[] PROGMEM = "AT+CIPSEND=";
const char CIPSTART[] PROGMEM = "AT+CIPSTART=\"";
const char CIPCLOSE[] PROGMEM = "AT+CIPCLOSE";
const char TCP[] PROGMEM = "TCP";

const char CWJAP[] PROGMEM = "AT+CWJAP_CUR=\"";

const char CWMODE_SET[] PROGMEM = "AT+CWMODE_CUR=";

const char CIFSR[] PROGMEM = "AT+CIFSR";
const char CIPMUX_1[] PROGMEM = "AT+CIPMUX=1";

const char CWSAP[] PROGMEM = "AT+CWSAP_CUR=\"";

const char IPD[] PROGMEM = "IPD,";
const char CONNECT[] PROGMEM = "CONNECT";
const char CLOSED[] PROGMEM = "CLOSED";

const char COMMA[] PROGMEM = ",";
const char COMMA_1[] PROGMEM = "\",";
const char COMMA_2[] PROGMEM = "\",\"";
const char THREE_COMMA[] PROGMEM = ",3";
const char DOUBLE_QUOTE[] PROGMEM = "\"";
const char EOL[] PROGMEM = "\r\n";
const char COLON[] PROGMEM = ":";

const char STAIP[] PROGMEM = "STAIP,\"";
const char STAMAC[] PROGMEM = "STAMAC,\"";

namespace xod {
class Uart;
}
class ESP8266 {
private:
    xod::Uart* _uart;
#ifdef ESP8266_DEBUG
    Stream* _debug = nullptr;
#endif
    char _msg[128];
    uint16_t _pkgSize = 0;
    bool _connected = false;

protected:
#ifdef ESP8266_DEBUG
    void debug(const char* prefix, const char* ln) {
        if (_debug) {
            _debug->print(prefix);
            _debug->print(ln);
            _debug->println();
        }
    }
    void debugChar(char ch) {
        if (_debug) {
            _debug->print(ch);
        }
    }
#endif

    void print(const char* cmd) {
#ifdef ESP8266_DEBUG
        debug(">> ", cmd);
#endif
        _uart->toStream()->print(cmd);
    }
    void println(const char* cmd = nullptr) {
#ifdef ESP8266_DEBUG
        debug(">> ", cmd);
#endif
        _uart->toStream()->println(cmd);
    }

    void writeCmd(const char* text1 = nullptr, const char* text2 = nullptr) {
        char buf[16] = { '\0' };
        strcpy_P(buf, text1);
        print(buf);
        if (text2 == EOL) {
            println();
        } else if (text2 != nullptr) {
            strcpy_P(buf, text2);
            print(buf);
        }
    }

    bool cmdOK(const char* okResponse, const char* failResponse = nullptr, uint32_t timeout = 1000) {
        uint8_t res = readCmd(okResponse, failResponse, timeout);
        return res == 1;
    }

    uint8_t readCmd(const char* text1, const char* text2 = nullptr, uint32_t timeout = 1000) {
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
            while (_uart->available()) {
                uint8_t c = 0x00;
                bool res = _uart->readByte(&c);
#ifdef ESP8266_DEBUG
                debugChar((char)c);
#endif
                if (!res)
                    break;
                pos1 = (c == buf1[pos1]) ? pos1 + 1 : 0;
                pos2 = (c == buf2[pos2]) ? pos2 + 1 : 0;
                if (len1 > 0 && pos1 == len1)
                    return 1;
                if (len2 > 0 && pos2 == len2)
                    return 2;
            }
        } while (millis() < stop);
        return 0;
    }

    uint8_t readBuffer(char* buff, uint8_t count, char delim, uint32_t timeout = 1000) {
        uint8_t pos = 0;
        uint8_t c;
        uint32_t stop = millis() + timeout;
        bool done = false;
        do {
            while (_uart->available() && pos < count) {
                _uart->readByte(&c);
#ifdef ESP8266_DEBUG
                debugChar((char)c);
#endif
                if (c == (uint8_t)delim) {
#ifdef ESP8266_DEBUG
                    debug("B << ", "DELIMITER");
#endif
                    done = true;
                    break;
                }
                buff[pos++] = c;
            }
            if (done)
                break;
        } while (millis() < stop);
        buff[pos] = '\0';
        return pos;
    }

    char* getIPAddress() {
        _msg[0] = '\0';
        writeCmd(CIFSR, EOL);
        uint8_t code = readCmd(STAIP, ERROR);
        if (code == 1) {
            // found ip
            readBuffer(_msg, sizeof(_msg), '"');
            readCmd(OK, ERROR);
            return _msg;
        }
        readCmd(OK, ERROR);
        return _msg;
    }

public:
    ESP8266(xod::Uart& uart, Stream* debugSerial = nullptr) {
        _uart = &uart;
#ifdef ESP8266_DEBUG
        _debug = debugSerial;
#endif
    }

    void begin();
    bool kick();

    bool setStationMode();
    bool connect(const char*, const char*);
    bool isConnectedToAP();

    uint32_t ipStringToUint32(char*);
    uint32_t getIP();

    bool createTCP(const char*, uint32_t);
    bool releaseTCP();
    bool send(char*);
    bool read(char*);
    bool isSocketOpen();
    bool receive(char*);
};

void ESP8266::begin() {
    _uart->begin();
}

bool ESP8266::kick() {
    writeCmd(AT, EOL);
    return cmdOK(OK, ERROR, 5000);
}

bool ESP8266::setStationMode() {
    writeCmd(CWMODE_SET);
    println("1");
    return cmdOK(OK, ERROR, 1000);
}

bool ESP8266::connect(const char* ssid, const char* password) {
    writeCmd(CWJAP);
    print(ssid);
    writeCmd(COMMA_2);
    print(password);
    writeCmd(DOUBLE_QUOTE, EOL);
    cmdOK(OK, FAIL, 15000);
    return isConnectedToAP();
}

bool ESP8266::isConnectedToAP() {
    writeCmd(CIFSR, EOL);
    uint8_t code = readCmd(NO_IP, ERROR, 350);
    readCmd(OK, nullptr, 10); // cleanup
    return (code == 0);
}

uint32_t ESP8266::ipStringToUint32(char* ipAddress) {
    unsigned int ip[4];
    ip[0] = atoi(strtok(ipAddress, "."));
    ip[1] = atoi(strtok(NULL, "."));
    ip[2] = atoi(strtok(NULL, "."));
    ip[3] = atoi(strtok(NULL, "."));

    if ((ip[0] | ip[1] | ip[2] | ip[3]) >= 0x100)
        return 0;

    return ip[0] + ip[1] * 0x100 + ip[2] * 0x10000ul + ip[3] * 0x1000000ul;
}

uint32_t ESP8266::getIP() {
    char* ipstr = getIPAddress();
    return ipStringToUint32(ipstr);
}

bool ESP8266::createTCP(const char* addr, uint32_t port) {
    char _port[32];
    writeCmd(CIPSTART);
    writeCmd(TCP);
    writeCmd(COMMA_2);
    print(addr);
    writeCmd(COMMA_1);
    formatNumber(port, 0, _port);
    println(_port);

    bool ok = cmdOK(OK, ERROR, 5000);
    if (ok)
        _connected = true;
    return ok;
}

bool ESP8266::releaseTCP() {
    if (!_connected)
        return true;
    writeCmd(CIPCLOSE, EOL);
    bool ok = cmdOK(OK, ERROR, 5000);
    if (ok)
        _connected = false;
    return ok;
}

bool ESP8266::send(char* message) {
    writeCmd(CIPSEND);

    size_t len = sprintf(message, "%s", message);
    char reqLen[len];
    formatNumber(len, 0, reqLen);
    println(reqLen);

    bool prompt = cmdOK(PROMPT, LINK_IS_NOT);
    if (!prompt)
        return false;

    print(message);
    bool ok = cmdOK(SEND_OK, nullptr, 5000);
    return ok;
}

bool ESP8266::read(char* outBuff) {
    if (_uart->available()) {
        *outBuff = _uart->toStream()->read();
        return true;
    }
    return false;
}

bool ESP8266::isSocketOpen() {
    return _connected;
}

bool ESP8266::receive(char* r) {
    if (_pkgSize == 0) {
        uint8_t cmd = readCmd(IPD, CLOSED, 100);
        if (cmd == 1) {
            char buf[16] = { '\0' };
            readBuffer(&buf[0], sizeof(buf) - 1, ':');
            _pkgSize = atoi(buf);
        } else if (cmd == 2) {
            _pkgSize = 0;
            _connected = false;
        }
    }

    if (_pkgSize > 0) {
        if (_uart->available()) {
            if (read(r)) {
                _pkgSize--;
                return true;
            }
        }
    }

    return false;
}

#endif /* #ifndef __ESP8266_UART_H__ */
