activemonitor=$(hyprctl monitors -j | jq '.[] | select(.focused == true).id')

echo $activemonitor
if [ "$activemonitor" == "0" ]; then
	hyprctl dispatch focusmonitor "DP-2"
else
	hyprctl dispatch focusmonitor "DP-1"
fi
