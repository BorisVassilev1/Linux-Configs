#!/bin/bash

CONFIG_FILES="$HOME/.config/ags/ $HOME/.config/ags/widget/"

trap "ags quit" EXIT

while true; do
    ags run --gtk4&
    inotifywait -e create,modify $CONFIG_FILES
	ags quit
done
