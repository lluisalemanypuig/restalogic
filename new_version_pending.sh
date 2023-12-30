#!/bin/bash

if [ "$(git log -1 --pretty=%B)" == "New version" ]; then
	echo "No"
else
	echo "Yes, a new version is pending"
fi
