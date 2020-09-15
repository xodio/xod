# Servo Library for ESP32

This library attempts to faithfully replicate the semantics of the
Arduino Servo library (see http://www.arduino.cc/en/Reference/Servo)
for the ESP32, with two (optional) additions. The two new functions
expose the ability of the ESP32 PWM timers to vary timer width.
# Documentation by Doxygen

[ESP32Servo Doxygen](https://madhephaestus.github.io/ESP32Servo/annotated.html)

## License

Copyright (c) 2017 John K. Bennett.  All right reserved.

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 2.1 of the License, or (at your option) any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public
License along with this library; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA

## Library Description:
```
    Servo - Class for manipulating servo motors connected to ESP32 pins.
    
    int attach(pin )  - Attaches the given GPIO pin to the next free channel
        (channels that have previously been detached are used first), 
        returns channel number or 0 if failure. All pin numbers are allowed,
        but only pins 2,4,12-19,21-23,25-27,32-33 are recommended.
    
    int attach(pin, min, max  ) - Attaches to a pin setting min and max 
        values in microseconds; enforced minimum min is 500, enforced max
        is 2500. Other semantics are the same as attach().
    
    void write () - Sets the servo angle in degrees; a value below 500 is
        treated as a value in degrees (0 to 180). These limit are enforced,
        i.e., values are constrained as follows:
            Value                                   Becomes
            -----                                   -------
            < 0                                        0
            0 - 180                                  value (treated as degrees)
            181 - 499                                 180
            500 - (min-1)                             min
            min-max (from attach or default)         value (treated as microseconds)
            (max+1) - 2500                            max
    
    void writeMicroseconds() - Sets the servo pulse width in microseconds.
        min and max are enforced (see above). 
        
    int read() - Gets the last written servo pulse width as an angle between 0 and 180. 
    
    int readMicroseconds()   - Gets the last written servo pulse width in microseconds.
    
    bool attached() - Returns true if this servo instance is attached to a pin.
    
    void detach() - Stops an the attached servo, frees the attached pin, and frees
        its channel for reuse.  
```

### **New ESP32-specific functions**
 
```
    setTimerWidth(value) - Sets the PWM timer width (must be 16-20) (ESP32 ONLY);
        as a side effect, the pulse width is recomputed.

    int readTimerWidth() - Gets the PWM timer width (ESP32 ONLY) 
```
 
### Useful Defaults:

default min pulse width for attach(): 544us

default max pulse width for attach(): 2400us

default timer width 16 (if timer width is not set)

default pulse width 1500us (servos are initialized with this value)

MINIMUM pulse with: 500us

MAXIMUM pulse with: 2500us

MAXIMUM number of servos: 16 (this is the number of PWM channels in the ESP32)  
