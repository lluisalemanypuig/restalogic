#!/bin/bash

zip -r -FS ../restalogic.zip * \
	--exclude '*.git' \
	--exclude 'compress_firefox.sh' \
	--exclude '*.html' \
	--exclude 'README.md'
