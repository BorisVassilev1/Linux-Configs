import {App, Astal, Gtk, Gdk} from "astal/gtk4"
import {GLib, Variable, bind} from "astal"
import Hyprland from "gi://AstalHyprland"
import Mpris from "gi://AstalMpris"
import Battery from "gi://AstalBattery"
import Wp from "gi://AstalWp"
import Network from "gi://AstalNetwork"
import Tray from "gi://AstalTray"

function Time({format = "%a %H:%M"}) {
	const time = Variable<string>("").poll(1000, () =>
		GLib.DateTime.new_now_local().format(format)!)

	return <label
		cssName="time"
		onDestroy={() => time.drop()}
		label={time()}
	/>
}

function Workspaces() {
	const hypr = Hyprland.get_default()

	const focusedWorkspace = Variable<Hyprland.Workspace | null>(null).poll(100, () => {
		const fw = hypr.focused_workspace
		focusedWorkspace.set(fw)
		return fw
	})

	const workspaces = [1, 2, 3, 4]
		.map(i => hypr.get_workspace(i) ?? {id: i})

	return <box cssName="Workspaces">
		{
			workspaces.map(ws => (
				<button
					halign={Gtk.Align.END}
					cssClasses={bind(focusedWorkspace).as(fw => fw ==
						ws ?
						["_" + ws.id.toString(), "focused"]
						: ["_" + ws.id.toString()])}
					onClicked={() => ws.focus()}>
				</button>
			))
		}
	</box>
}

function Wireplumber() {
	const wp = Wp.get_default()

	if (!wp) return <label>ERROR</label>

	const volume = Variable<number>(0).poll(100, () => {
		const vol = wp.audio.default_speaker.volume
		volume.set(vol)
		return vol
	})
	const speaker = wp.audio.default_speaker;
	const mic = wp.audio.default_microphone;

	return <menubutton cssName="Wireplumber"
		halign={Gtk.Align.END}
		iconName={bind(speaker, "volume-icon").as(icon => icon)}
	>
		<popover>
			<box orientation={1}>
				<box>
					<button
						cssName="mute"
						iconName={bind(speaker, "volume-icon").as(icon => icon)}
						onClicked={() => {
							speaker.mute = !speaker.mute
						}}
					/>
					<label
						cssName="volume"
						label={bind(speaker, "volume").as(v => Math.round(v * 100) + "%")}
					/>
					<slider widthRequest={100}
						value={bind(speaker, "volume")}
						setup={self => {self.set_value(speaker.volume)}}
						onChangeValue={self => speaker.set_volume(self.value)}
						sensitive={bind(speaker, "mute").as(m => !m)}
					/>
				</box>
				<box>
					<button
						cssName="mute"
						iconName={bind(mic, "volume-icon").as(icon => icon)}
						onClicked={() => {
							mic.mute = !mic.mute
						}}
					/>
					<label
						cssName="volume"
						label={bind(mic, "volume").as(v => Math.round(v * 100) + "%")}
					/>
					<slider widthRequest={100}
						value={bind(mic, "volume")}
						setup={self => {self.set_value(mic.volume)}}
						onChangeValue={self => mic.set_volume(self.value)}
						sensitive={bind(mic, "mute").as(m => !m)}
					/>
				</box>
				<label cssName="devices" label="Audio Devices" halign={Gtk.Align.START} />
				{bind(wp.audio, "devices").as(ds => ds.map(device =>
					<label>{device.description}</label>
				))}
				<label cssName="mics" label="Input Devices" halign={Gtk.Align.START} />
				{bind(wp.audio, "microphones").as(ds => ds.map(device =>
					<label>{device.description}</label>
				))}
			</box>
		</popover>
	</menubutton>
}

function BatteryWidget() {
	const battery = Battery.get_default()
	if (!battery) return <label>ERROR</label>

	const state = Variable<Battery.State>(Battery.State.UNKNOWN).poll(5000, () => {
		return battery.state;
	})

	function timeFormat(t: number) {
		if (t <= 0) return "???"
		t /= 60;
		const mins = Math.floor(t % 60);
		const hrs = Math.floor(t / 60);
		t /= 60;

		return `${hrs}:${mins}`
	}

	return <menubutton cssName="Battery"
		iconName={bind(battery, "battery_icon_name").as(icon => icon)}
		cssClasses={bind(battery, "battery_icon_name").as(icon => {return [icon]})}
	>
		<popover>
			<box orientation={1}>
				<box>
					<label
						label={bind(battery, "percentage").as(p => Math.round(p * 100) + "%")}
					/>
					<slider widthRequest={100}
						value={bind(battery, "percentage")}
						setup={self => {self.set_value(battery.percentage)}}
						canFocus={false}
						canTarget={false}
					/>
				</box>
				<label
					halign={Gtk.Align.START}
					label={bind(state).as(() => {
						let state = battery.state;
						switch (state) {
							case Battery.State.CHARGING:
								return `Charging: ${timeFormat(battery.time_to_full)} to full`;
							case Battery.State.DISCHARGING:
								return `Discharging: ${timeFormat(battery.time_to_empty)} left`;
							case Battery.State.FULLY_CHARGED:
								return "Fully Charged";
							case Battery.State.PENDING_CHARGE:
								return `Not Charging ${timeFormat(battery.time_to_empty)}`;
							case Battery.State.PENDING_DISCHARGE:
								return `Not Discharging ${timeFormat(battery.time_to_full)}`;
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
		if(name.startsWith("kitty")) 
			return name.replace("kitty", "terminal-symbolic")
		return name;
	}

	if (!hypr) return <label>ERROR</label>
	return <box cssName="ActiveWindow">
		{bind(hypr, "focusedClient").as(client => {
			if (!client) return "-"
			const name = bind(client, "title")
			const app = bind(client, "class")
			return <box>
				<image iconName={app.as(a => replaceName(a)) ?? ""} />
				<label cssName="name">{name}</label>
			</box>
		})}
	</box>
}

export default function Bar(gdkmonitor: Gdk.Monitor) {
	const {TOP, LEFT, RIGHT} = Astal.WindowAnchor

	return <window
		visible
		cssClasses={["Bar"]}
		gdkmonitor={gdkmonitor}
		exclusivity={Astal.Exclusivity.EXCLUSIVE}
		anchor={TOP | LEFT | RIGHT}
		application={App}>
		<centerbox cssName="centerbox">
			<box cssName="left">
				<Workspaces />
			</box>
			<box cssName="middle">
				<ActiveWindow />
			</box>
			<box cssName="right">
				<BatteryWidget />
				<Wireplumber />
				<menubutton cssName="Calendar"
					halign={Gtk.Align.END}
				>
					<Time />
					<popover>
						<Gtk.Calendar />
					</popover>
				</menubutton>
			</box>
		</centerbox>
	</window>
}
