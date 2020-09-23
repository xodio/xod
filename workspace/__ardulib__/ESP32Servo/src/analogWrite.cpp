/*
 * analogWrite.cpp
 *
 *  Created on: Sep 17, 2018
 *      Author: Harry-Laptop
 */

#include "analogWrite.h"
#include "ESP32PWM.h"

void analogWrite(uint8_t APin, uint16_t AValue) {
	if(APin== 25 ||APin==26){
		dacWrite(APin, AValue);
		return;
	}
	ESP32PWM* chan = pwmFactory(APin);
	if (AValue == 0) {
		if ((chan != NULL) && chan->attached()) {
			chan->detachPin(APin);
			delete chan;
			pinMode(APin, OUTPUT);
		}
		digitalWrite(APin, 0);
	} else if (AValue >= 255) {
		if ((chan != NULL) && chan->attached()) {
			chan->detachPin(APin);
			delete chan;
			pinMode(APin, OUTPUT);
		}
		digitalWrite(APin, 1);
	} else
	{
		if (chan == NULL) {
			chan = new ESP32PWM();
		}
		if(!chan->attached()){
			chan->attachPin(APin,1000, 8); // This adds the PWM instance to the factory list
			//Serial.println("Attaching AnalogWrite : "+String(APin)+" on PWM "+String(chan->getChannel()));
		}
		chan->write(AValue);
		//    Serial.print( "ledcWrite: " ); Serial.print(  CESP32PWMPinMap[ APin ] - 1 ); Serial.print( " " ); Serial.println( AValue );
	}
}
