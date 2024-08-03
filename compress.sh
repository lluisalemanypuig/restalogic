#!/bin/bash

if [ -z $1 ]; then
	echo "Error: I need one parameter. Either:"
	echo "    firefox"
	echo "    chrome"
	exit
fi

browser=$1

if [ "$browser" != "firefox" ] && [ "$browser" != "chrome" ]; then
	echo "Error: parameter '$1' is not valid. Use either:"
	echo "    firefox"
	echo "    chrome"
	exit
fi

cd src/
cp ../README.md .
cp manifest_$browser.json manifest.json
zip -r -FS ../restalogic_$browser.zip * -x "manifest_*.json"
rm README.md
rm manifest.json
cd ..
