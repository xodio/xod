/*
 * ESP32Tone.cpp
 *
 *  Created on: Sep 23, 2018
 *      Author: hephaestus
 */


#include "ESP32Tone.h"

void tone(int APin,unsigned int frequency){
	ESP32PWM* chan = pwmFactory(APin);
	if (chan == NULL) {
		chan = new ESP32PWM();
	}
	if(!chan->attached()){
		chan->attachPin(APin,frequency, 10); // This adds the PWM instance to the factory list
		//Serial.println("Attaching tone : "+String(APin)+" on PWM "+String(chan->getChannel()));
	}
	chan->writeTone(frequency);// update the time base of the PWM
}

void tone(int pin, unsigned int frequency, unsigned long duration){
	tone(pin,frequency);
	delay(duration);
	noTone(pin);
}

void noTone(int pin){
	ESP32PWM* chan = pwmFactory(pin);
	if (chan != NULL) {
		if(chan->attached())
		{
			chan->detachPin(pin);
			delete chan;
		}
	}
}
