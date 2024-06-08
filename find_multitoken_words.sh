#!/bin/bash

wget https://www.vilaweb.cat/paraulogic -O index.html

python3 find_multitoken_words.py
res=$?

if [ $res -eq 2 ]; then
	exit 1
fi
