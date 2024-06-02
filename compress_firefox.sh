#!/bin/bash

cd src/
cp ../README.md .
zip -r -FS ../restalogic.zip *
rm README.md
cd ..
