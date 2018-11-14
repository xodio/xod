export const ARDUINO_PACKAGES_DIRNAME = '__packages__';
export const BUNDLED_ADDITIONAL_URLS = [
  // TODO:
  // Replace our fixed esp8266 package with original:
  // http://arduino.esp8266.com/stable/package_esp8266com_index.json
  // When they release new version >2.4.2
  'https://storage.googleapis.com/releases.xod.io/packages/esp8266-2.4.3/package_esp8266com_index.json',
];
export const ARDUINO_LIBRARIES_DIRNAME = '__ardulib__';
export const ARDUINO_CLI_LIBRARIES_DIRNAME = 'libraries';
export const ARDUINO_EXTRA_URLS_FILENAME = 'extra.txt';
