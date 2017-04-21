set -ev

npm run verify
if [ -z "$TRAVIS_TAG" ]; then
    npm run electron-dist
fi

#ls -hla packages/xod-client-electron/dist/
#-rw-r--r-- 1 travis travis  78M May  3 07:41 xod-client-electron_0.0.1_amd64.deb
#-rw-r--r-- 1 travis travis 137M May  3 07:42 xod-client-electron-0.0.1.rpm
#-rw-r--r-- 1 travis  staff 137M May  3 07:47 xod-client-electron-0.0.1.dmg
