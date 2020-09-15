/*
 * ESP32Tone.h
 *
 *  Created on: Sep 23, 2018
 *      Author: hephaestus
 */

#ifndef LIBRARIES_ESP32SERVO_SRC_ESP32TONE_H_
#define LIBRARIES_ESP32SERVO_SRC_ESP32TONE_H_
#include "ESP32PWM.h"
void tone(int pin,unsigned int frequency);

void tone(int pin, unsigned int frequency, unsigned long duration);

void noTone(int pin);



#endif /* LIBRARIES_ESP32SERVO_SRC_ESP32TONE_H_ */
