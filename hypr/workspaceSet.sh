activemonitor=$(hyprctl monitors -j | jq '.[] | select(.focused == true).id')

hyprctl dispatch focusmonitor "DP-1"
hyprctl dispatch workspace "$1"
hyprctl dispatch focusmonitor "DP-2"
#echo $(($1+1))
hyprctl dispatch workspace "$(($1 + 1))"
hyprctl dispatch focusmonitor "$activemonitor"
