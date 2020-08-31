export const ARDUINO_PACKAGES_DIRNAME = '__packages__';
// Default additional urls
export const BUNDLED_ADDITIONAL_URLS = [
  'http://arduino.esp8266.com/stable/package_esp8266com_index.json',
];
// Additional URLS that should migrate to the new one
// [[OldURL, NewURL]]
export const MIGRATE_BUNDLED_ADDITIONAL_URLS = [
  [
    'https://storage.googleapis.com/releases.xod.io/packages/esp8266-2.4.3/package_esp8266com_index.json',
    'http://arduino.esp8266.com/stable/package_esp8266com_index.json',
  ],
];
export const ARDUINO_LIBRARIES_DIRNAME = '__ardulib__';
export const ARDUINO_CLI_LIBRARIES_DIRNAME = 'libraries';
export const ARDUINO_EXTRA_URLS_FILENAME = 'extra.txt';
