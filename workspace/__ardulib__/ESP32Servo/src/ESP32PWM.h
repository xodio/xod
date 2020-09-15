/*
 * ESP32PWM.h
 *
 *  Created on: Sep 22, 2018
 *      Author: hephaestus
 */

#ifndef LIBRARIES_ESP32SERVO_SRC_ESP32PWM_H_
#define LIBRARIES_ESP32SERVO_SRC_ESP32PWM_H_
#include "esp32-hal-ledc.h"
#define NUM_PWM 16
#define PWM_BASE_INDEX 0
#define USABLE_ESP32_PWM (NUM_PWM-PWM_BASE_INDEX)
#include <cstdint>

#include "Arduino.h"
class ESP32PWM {
private:

	void attach(int pin);
	int pwmChannel = 0;                         // channel number for this servo
	bool attachedState = false;
	int pin;
	uint8_t resolutionBits;
	double myFreq;
	int allocatenext(double freq);

	static double _ledcSetupTimerFreq(uint8_t chan, double freq,
			uint8_t bit_num);

	bool checkFrequencyForSideEffects(double freq);

	void adjustFrequencyLocal(double freq, float dutyScaled);
	static float mapf(float x, float in_min, float in_max, float out_min,
			float out_max) {
		if(x>in_max)
			return out_max;
		if(x<in_min)
			return out_min;
		return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
	}

	double setup(double freq, uint8_t resolution_bits=10);
	//channel 0-15 resolution 1-16bits freq limits depend on resolution9
	void attachPin(uint8_t pin);
	// pin allocation
	void deallocate();
public:
	// setup
	ESP32PWM();
	virtual ~ESP32PWM();


	void detachPin(int pin);
	void attachPin(uint8_t pin, double freq, uint8_t resolution_bits=10);
	bool attached() {
		return attachedState;
	}

	// write raw duty cycle
	void write(uint32_t duty);
	// Write a duty cycle to the PWM using a unit vector from 0.0-1.0
	void writeScaled(float duty);
	//Adjust frequency
	double writeTone(double freq);
	double writeNote(note_t note, uint8_t octave);
	void adjustFrequency(double freq, float dutyScaled=-1);

	// Read pwm data
	uint32_t read();
	double readFreq();
	float getDutyScaled();

	//Timer data
	static int timerAndIndexToChannel(int timer, int index);
	/**
	 * allocateTimer
	 * @param a timer number 0-3 indicating which timer to allocate in this library
	 * Switch to explicate allocation mode
	 *
	 */
	static void allocateTimer(int timerNumber);
	static bool explicateAllocationMode;
	int getTimer() {
		return timerNum;
	}
	int timerNum = -1;
	uint32_t myDuty = 0;
	int getChannel();
	static int PWMCount;              // the total number of attached pwm
	static int timerCount[4];
	static ESP32PWM * ChannelUsed[NUM_PWM]; // used to track whether a channel is in service
	static long timerFreqSet[4];

	// Helper functions
	int getPin() {
		return pin;
	}
	static bool hasPwm(int pin) {
#if defined(ARDUINO_ESP32S2_DEV)
		if ((pin >=1 && pin <= 21) || //20
				(pin == 26) || //1
				(pin >= 33 && pin <= 42)) //10
#else
		if ((pin == 2) || //1
				(pin == 4) || //1
				(pin == 5) || //1
				((pin >= 12) && (pin <= 19)) || //8
				((pin >= 21) && (pin <= 23)) || //3
				((pin >= 25) && (pin <= 27)) || //3
				(pin == 32) || (pin == 33)) //2
#endif
			return true;
		return false;
	}
	static int channelsRemaining() {
		return NUM_PWM - PWMCount;
	}


};

ESP32PWM* pwmFactory(int pin);

#endif /* LIBRARIES_ESP32SERVO_SRC_ESP32PWM_H_ */
