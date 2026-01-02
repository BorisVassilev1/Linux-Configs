//import { isMiddleClick, isPrimaryClick, isSecondaryClick, Notify } from '../../../../lib/utils';
//import options from '../../../../options';
import AstalTray from 'gi://AstalTray';
import { bind, Gio, Variable } from 'astal';
import { Gdk, Gtk } from 'astal/gtk4';
//import { BarBoxChild } from 'src/lib/types/bar.types';

function SysTray() {
    const tray = AstalTray.get_default()

    return <box cssName="SysTray">
        {bind(tray, "items").as(items => items.map(item => (
            <menubutton
                //tooltipMarkup={bind(item, "tooltipMarkup")}
				tooltipText={bind(item, "title").as(t => t)}
				popover={
					bind(item, "menu_model").as(menuModel => {
						const menu = Gtk.PopoverMenu.new_from_model(menuModel);
						menu.set_css_classes(["systray-menu"]);
						menu.insert_action_group("dbusmenu", item.action_group);
						print(menu.child);
						return menu;
					})
				}
			>
                <image iconName={bind(item, "icon_name")} />
            </menubutton>
        )))}
    </box>
}

export { SysTray };
