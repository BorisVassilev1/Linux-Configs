import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { createBinding, With, For, onCleanup } from "ags"
import { createPoll } from "ags/time"
import GLib from "gi://GLib"
import Hyprland from "gi://AstalHyprland"
import Battery from "gi://AstalBattery"
import Wp from "gi://AstalWp"

import { SysTray } from "./tray"

function Time({ format = "%a %H:%M" }) {
	const time = createPoll("", 1000, () =>
		GLib.DateTime.new_now_local().format(format)!)

	return <label cssName="time" label={time} />
}

function Workspaces() {
	const hypr = Hyprland.get_default()
	const focused = createBinding(hypr, "focusedWorkspace")

	const workspaces = [1, 2, 3, 4]
		.map(i => hypr.get_workspace(i) ?? Hyprland.Workspace.dummy(i, null))

	return <box cssName="Workspaces">
		{
			workspaces.map(ws => (
				<button
					halign={Gtk.Align.END}
					cssClasses={focused(fw =>
						fw && fw.id === ws.id
							? ["_" + ws.id.toString(), "focused"]
							: ["_" + ws.id.toString()])}
					onClicked={() => ws.focus()}>
				</button>
			))
		}
	</box>
}

function EndpointControls({ endpoint }: { endpoint: Wp.Endpoint }) {
	return <box>
		<button
			cssName="mute"
			iconName={createBinding(endpoint, "volumeIcon")}
			onClicked={() => {
				endpoint.mute = !endpoint.mute
			}}
		/>
		<label
			cssName="volume"
			label={createBinding(endpoint, "volume").as(v => Math.round(v * 100) + "%")}
		/>
		<slider widthRequest={100}
			value={createBinding(endpoint, "volume")}
			onChangeValue={({ value }) => endpoint.set_volume(value)}
			sensitive={createBinding(endpoint, "mute").as(m => !m)}
		/>
	</box>
}

function Wireplumber() {
	const wp = Wp.get_default()
	if (!wp) return <label label="ERROR" />

	const speaker = createBinding(wp.audio, "defaultSpeaker")
	const mic = createBinding(wp.audio, "defaultMicrophone")

	// poll for the icon: it must react both to the default device changing
	// and to volume/mute changes on the current device
	const icon = createPoll("audio-volume-muted-symbolic", 500, () =>
		wp.audio.defaultSpeaker?.volumeIcon ?? "audio-volume-muted-symbolic")

	return <menubutton cssName="Wireplumber"
		halign={Gtk.Align.END}
		iconName={icon}
	>
		<popover>
			<box orientation={Gtk.Orientation.VERTICAL}>
				<With value={speaker}>
					{s => s && <EndpointControls endpoint={s} />}
				</With>
				<With value={mic}>
					{m => m && <EndpointControls endpoint={m} />}
				</With>
				<label cssName="devices" label="Audio Devices" halign={Gtk.Align.START} />
				<For each={createBinding(wp.audio, "devices")}>
					{device => <label label={device.description} />}
				</For>
				<label cssName="mics" label="Input Devices" halign={Gtk.Align.START} />
				<For each={createBinding(wp.audio, "microphones")}>
					{device => <label label={device.description} />}
				</For>
			</box>
		</popover>
	</menubutton>
}

function BatteryWidget() {
	const battery = Battery.get_default()
	if (!battery) return <label label="ERROR" />

	function timeFormat(t: number) {
		if (t <= 0) return "???"
		t /= 60;
		const mins = Math.floor(t % 60);
		const hrs = Math.floor(t / 60);
		t /= 60;

		return `${hrs}:${mins}`
	}

	return <menubutton cssName="Battery"
		iconName={createBinding(battery, "batteryIconName")}
		cssClasses={createBinding(battery, "batteryIconName").as(icon => [icon])}
	>
		<popover>
			<box orientation={Gtk.Orientation.VERTICAL}>
				<box>
					<label
						label={createBinding(battery, "percentage").as(p => Math.round(p * 100) + "%")}
					/>
					<slider widthRequest={100}
						value={createBinding(battery, "percentage")}
						canFocus={false}
						canTarget={false}
					/>
				</box>
				<label
					halign={Gtk.Align.START}
					label={createBinding(battery, "state").as(state => {
						switch (state) {
							case Battery.State.CHARGING:
								return `Charging: ${timeFormat(battery.timeToFull)} to full`;
							case Battery.State.DISCHARGING:
								return `Discharging: ${timeFormat(battery.timeToEmpty)} left`;
							case Battery.State.FULLY_CHARGED:
								return "Fully Charged";
							case Battery.State.PENDING_CHARGE:
								return `Not Charging ${timeFormat(battery.timeToEmpty)}`;
							case Battery.State.PENDING_DISCHARGE:
								return `Not Discharging ${timeFormat(battery.timeToFull)}`;
							default:
								return "State: Unknown"
						}
					})}
					cssName="timeleft"
				/>
			</box>
		</popover>
	</menubutton>
}

function ActiveWindow() {
	const hypr = Hyprland.get_default()

	function replaceName(name: string) {
		if (name.startsWith("kitty"))
			return name.replace("kitty", "terminal-symbolic")
		return name;
	}

	return <box cssName="ActiveWindow">
		<With value={createBinding(hypr, "focusedClient")}>
			{client => client
				? <box>
					<image iconName={createBinding(client, "class").as(c => replaceName(c ?? ""))} />
					<label cssName="name" label={createBinding(client, "title")} />
				</box>
				: <label label="-" />}
		</With>
	</box>
}

export default function Bar(gdkmonitor: Gdk.Monitor) {
	const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

	return <window
		visible
		class="Bar"
		gdkmonitor={gdkmonitor}
		exclusivity={Astal.Exclusivity.EXCLUSIVE}
		anchor={TOP | LEFT | RIGHT}
		application={app}
		$={self => onCleanup(() => self.destroy())}>
		<centerbox cssName="centerbox">
			<box $type="start" cssName="left">
				<Workspaces />
			</box>
			<box $type="center" cssName="middle">
				<ActiveWindow />
			</box>
			<box $type="end" cssName="right">
				<SysTray />
				<BatteryWidget />
				<Wireplumber />
				<menubutton cssName="Calendar"
					halign={Gtk.Align.END}
				>
					<Time />
					<popover cssName="calendar_pop">
						<Gtk.Calendar />
					</popover>
				</menubutton>
			</box>
		</centerbox>
	</window>
}
