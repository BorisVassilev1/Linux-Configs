import AstalTray from "gi://AstalTray"
import { createBinding, For, onCleanup } from "ags"
import { Gtk } from "ags/gtk4"

function TrayItem(item: AstalTray.TrayItem) {
	return <menubutton
		tooltipText={createBinding(item, "title")}
		$={self => {
			const menu = Gtk.PopoverMenu.new_from_model(item.menuModel)
			menu.set_css_classes(["systray-menu"])
			self.set_popover(menu)

			const sync = () => {
				menu.set_menu_model(item.menuModel)
				menu.insert_action_group("dbusmenu", item.actionGroup)
			}
			sync()

			const ids = [
				item.connect("notify::menu-model", sync),
				item.connect("notify::action-group", sync),
			]
			onCleanup(() => ids.forEach(id => item.disconnect(id)))
		}}
	>
		<image gicon={createBinding(item, "gicon")} />
	</menubutton>
}

function SysTray() {
	const tray = AstalTray.get_default()

	return <box cssName="SysTray">
		<For each={createBinding(tray, "items")}>
			{item => TrayItem(item)}
		</For>
	</box>
}

export { SysTray }
