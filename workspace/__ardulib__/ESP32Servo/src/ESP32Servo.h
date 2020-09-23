/*
 Copyright (c) 2017 John K. Bennett. All right reserved.

 ESP32_Servo.h - Servo library for ESP32 - Version 1

 Original Servo.h written by Michael Margolis in 2009

 This library is free software; you can redistribute it and/or
 modify it under the terms of the GNU Lesser General Public
 License as published by the Free Software Foundation; either
 version 2.1 of the License, or (at your option) any later version.

 This library is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 Lesser General Public License for more details.

 You should have received a copy of the GNU Lesser General Public
 License along with this library; if not, write to the Free Software
 Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */

/* 
 A servo is activated by creating an instance of the Servo class, and passing
 the desired GPIO pin to the attach() method.
 The servos are pulsed in the background using the value most recently
 written using the write() method.

 The class methods are:

 Servo - Class for manipulating servo motors connected to ESP32 pins.
 int attach(pin )  - Attaches the given GPIO pin to the next free channel
 (channels that have previously been detached are used first),
 returns channel number or 0 if failure. All pin numbers are allowed,
 but only pins 2,4,12-19,21-23,25-27,32-33 are recommended.
 int attach(pin, min, max  ) - Attaches to a pin setting min and max
 values in microseconds; enforced minimum min is 500, enforced max
 is 2500. Other semantics same as attach().
 void write () - Sets the servo angle in degrees; a value below 500 is
 treated as a value in degrees (0 to 180). These limit are enforced,
 i.e., values are treated as follows:
 Value                                   Becomes
 -----                                   -------
 < 0                                        0
 0 - 180                             value (treated as degrees)
 181 - 499                                 180
 500 - (min-1)                             min
 min-max (from attach or default)    value (treated as microseconds)
 (max+1) - 2500                            max

 void writeMicroseconds() - Sets the servo pulse width in microseconds.
 min and max are enforced (see above).
 int read() - Gets the last written servo pulse width as an angle between 0 and 180.
 int readMicroseconds()   - Gets the last written servo pulse width in microseconds.
 bool attached() - Returns true if this servo instance is attached.
 void detach() - Stops an the attached servo, frees its attached pin, and frees
 its channel for reuse).

 *** ESP32-specific functions **
 setTimerWidth(value) - Sets the PWM timer width (must be 16-20) (ESP32 ONLY);
 as a side effect, the pulse width is recomputed.
 int readTimerWidth() - Gets the PWM timer width (ESP32 ONLY)
 */

#ifndef ESP32_Servo_h
#define ESP32_Servo_h
#include "analogWrite.h"
#include "ESP32PWM.h"
#include "ESP32Tone.h"
//Enforce only using PWM pins on the ESP32
#define ENFORCE_PINS
// Default Arduino Servo.h
#define DEFAULT_uS_LOW 544
#define DEFAULT_uS_HIGH 2400

// Values for TowerPro MG995 large servos (and many other hobbyist servos)
//#define DEFAULT_uS_LOW 1000        // 1000us
//#define DEFAULT_uS_HIGH 2000      // 2000us

// Values for TowerPro SG90 small servos
//#define DEFAULT_uS_LOW 400
//#define DEFAULT_uS_HIGH 2400

#define DEFAULT_TIMER_WIDTH 16
#define DEFAULT_TIMER_WIDTH_TICKS 65536

#define ESP32_Servo_VERSION           1     // software version of this library

#define MIN_PULSE_WIDTH       500     // the shortest pulse sent to a servo  
#define MAX_PULSE_WIDTH      2500     // the longest pulse sent to a servo 
#define DEFAULT_PULSE_WIDTH  1500     // default pulse width when servo is attached
#define DEFAULT_PULSE_WIDTH_TICKS 4825
//#define REFRESH_CPS            50
#define REFRESH_USEC         20000

#define MAX_SERVOS              16     // no. of PWM channels in ESP32

/*
 * This group/channel/timmer mapping is for information only;
 * the details are handled by lower-level code
 *
 * LEDC Chan to Group/Channel/Timer Mapping
 ** ledc: 0  => Group: 0, Channel: 0, Timer: 0
 ** ledc: 1  => Group: 0, Channel: 1, Timer: 0
 ** ledc: 2  => Group: 0, Channel: 2, Timer: 1
 ** ledc: 3  => Group: 0, Channel: 3, Timer: 1
 ** ledc: 4  => Group: 0, Channel: 4, Timer: 2
 ** ledc: 5  => Group: 0, Channel: 5, Timer: 2
 ** ledc: 6  => Group: 0, Channel: 6, Timer: 3
 ** ledc: 7  => Group: 0, Channel: 7, Timer: 3
 ** ledc: 8  => Group: 1, Channel: 0, Timer: 0
 ** ledc: 9  => Group: 1, Channel: 1, Timer: 0
 ** ledc: 10 => Group: 1, Channel: 2, Timer: 1
 ** ledc: 11 => Group: 1, Channel: 3, Timer: 1
 ** ledc: 12 => Group: 1, Channel: 4, Timer: 2
 ** ledc: 13 => Group: 1, Channel: 5, Timer: 2
 ** ledc: 14 => Group: 1, Channel: 6, Timer: 3
 ** ledc: 15 => Group: 1, Channel: 7, Timer: 3
 */

class Servo {

public:
	Servo();
	// Arduino Servo Library calls
	int attach(int pin); // attach the given pin to the next free channel, returns channel number or 0 if failure
	int attach(int pin, int min, int max); // as above but also sets min and max values for writes.
	void detach();
	void write(int value); // if value is < MIN_PULSE_WIDTH its treated as an angle, otherwise as pulse width in microseconds
	void writeMicroseconds(int value);     // Write pulse width in microseconds
	int read(); // returns current pulse width as an angle between 0 and 180 degrees
	int readMicroseconds(); // returns current pulse width in microseconds for this servo
	bool attached(); // return true if this servo is attached, otherwise false

	// ESP32 only functions
	void setTimerWidth(int value);     // set the PWM timer width (ESP32 ONLY)
	int readTimerWidth();              // get the PWM timer width (ESP32 ONLY)
	void setPeriodHertz(int hertz){
		REFRESH_CPS=hertz;
		setTimerWidth(this->timer_width);
	}
private:
	int usToTicks(int usec);
	int ticksToUs(int ticks);
//   static int ServoCount;                             // the total number of attached servos
//   static int ChannelUsed[];                          // used to track whether a channel is in service
//   int servoChannel = 0;                              // channel number for this servo

	int min = DEFAULT_uS_LOW;           // minimum pulse width for this servo
	int max = DEFAULT_uS_HIGH;            // maximum pulse width for this servo
	int pinNumber = 0;                      // GPIO pin assigned to this channel
	int timer_width = DEFAULT_TIMER_WIDTH; // ESP32 allows variable width PWM timers
	int ticks = DEFAULT_PULSE_WIDTH_TICKS; // current pulse width on this channel
	int timer_width_ticks = DEFAULT_TIMER_WIDTH_TICKS; // no. of ticks at rollover; varies with width
	ESP32PWM * getPwm(); // get the PWM object
	ESP32PWM pwm;
	int REFRESH_CPS = 50;

};
#endif
