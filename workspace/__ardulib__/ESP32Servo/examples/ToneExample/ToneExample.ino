/*


 */

#include <ESP32Servo.h>
int pin = 2;
void setup() {
	// Allow allocation of all timers
	ESP32PWM::allocateTimer(0);
	ESP32PWM::allocateTimer(1);
	ESP32PWM::allocateTimer(2);
	ESP32PWM::allocateTimer(3);
	Serial.begin(115200);

}

void loop() {
	tone(pin, 4186, // C
			500); // half a second
	tone(pin, 5274, // E
			500); // half a second
	delay(500);

}
