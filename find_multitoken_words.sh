#!/bin/bash

#wget https://www.vilaweb.cat/paraulogic -O index.html

python3 find_multitoken_words.py
res=$?

if [ $res -ne 0 ]; then
	exit 1
fi
