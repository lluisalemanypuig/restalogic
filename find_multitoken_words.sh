#!/bin/bash

wget https://www.vilaweb.cat/paraulogic -O index.html

python3 find_multitoken_words.py
res=$?

if [ $res -ge 2 ]; then
	echo "The job failed with error code $res"
	exit 1
fi
echo "The job succeeded"
