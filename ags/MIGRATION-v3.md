# AGS / Astal update prep — v2 → v3

Prepared 2026-09-07. This is a plan, nothing has been changed yet.

## 1. Where you are now

| Thing | Installed | Latest (AUR) |
|---|---|---|
| `aylurs-gtk-shell-git` | `2.3.0.r1.g3ed9737-1` (built **2025-05-12**) | `3.1.2.r0.gbbee2f1-2` |
| `libastal-git` (+ `-io`, `-4`, sub-libs) | `r772.07583de` / `r851.6976fab` (io/apps/etc. `r786`–`r895`) | see `yay -Qua` |
| `libastal-meta` | `1-8` | `1-9` (deps renamed, see §5) |
| ags CLI runtime | Astal v2 gjs lib at `/usr/share/astal/gjs` (`libastal-gjs-git`) | ags v3 bundles its own runtime at `/usr/share/ags/js` (gnim) |

Your config (`~/.config/ags`, tracked in the `~/.config` git repo) is **pure Astal v2 API**:
`import { App } from "astal/gtk4"`, `Variable`, `bind`, `.poll`, `.as`, `astalify`-style JSX.

**AGS v3 is a rewrite.** The JSX runtime was pulled out into a separate project (**gnim**), `Variable`
is gone (replaced by `createState` / accessors), `bind` → `createBinding`, dynamic children need
`<For>` / `<With>`, imports move from `astal/*` to `ags/*`. The `libastal-*` C libraries
(`AstalHyprland`, `AstalBattery`, …) are **mostly unchanged** — same `gi://Astal*` imports, same
properties — so most of the breakage is the JSX/state layer, not the services.

## 2. The trap on a rolling release

`yay -Syu` will **automatically** rebuild `aylurs-gtk-shell-git` from 2.3.0 → 3.1.2 (it's a `-git`
package, upstream moved). The moment that happens your bar stops loading. So do the package update
and the config rewrite **together**, in one sitting, from a TTY or nested session — not as a
surprise mid-`-Syu`.

Recommended: switch from the `-git` packages to the **stable** `aylurs-gtk-shell` (3.1.2) so it
stops tracking `main` and only moves on tagged releases. (`libastal` has no stable AUR package yet —
only `-git`.)

## 3. Backup / safety net

```bash
cd ~/.config
git add -A ags/ && git commit -m "ags: snapshot working v2 config before v3 migration"
git branch ags-v2-backup            # anchor you can always return to
git switch -c ags-v3-migration      # do the work here

# snapshot the exact package versions in case you need to downgrade
pacman -Q | grep -Ei 'astal|aylurs-gtk-shell' > ~/.config/ags/packages-v2.txt

# keep a copy of the built v2 bundle — it will keep running even after the lib updates,
# as long as /usr/share/astal/gjs is still present
cp /run/user/1000/ags.js ~/.config/ags/ags-v2-bundle.js.bak
```

Downgrade path if it goes badly: `git switch ags-v2-backup`, then rebuild the old packages from
cache (`/var/cache/pacman/pkg` or `~/.cache/yay/*/`), or `yay -S aylurs-gtk-shell-git` pinned to an
old commit.

## 4. Package update steps

```bash
# build deps you don't have yet (yay pulls them, can drop after):
#   go, meson   -> makedepends
# runtime optdeps you DO want: dart-sass (scss), blueprint-compiler (already installed),
#   gtk4-layer-shell (already installed)

yay -S aylurs-gtk-shell            # stable; replaces aylurs-gtk-shell-git (provides/conflicts it)
yay -Syu                           # picks up libastal-* rebuilds + libastal-meta 1-9

# after v3 works, this is no longer used by ags and nothing else needs it:
#   sudo pacman -Rns libastal-gjs-git   (optional cleanup — verify with `pactree -r libastal-gjs`)
```

`aylurs-gtk-shell` v3 depends on `gjs gtk4-layer-shell gobject-introspection libastal libastal-4 npm`.
Its `npm install` at build time fetches **gnim** from the npm registry (needs network during build).

## 5. `libastal-meta` renames (review the yay transaction)

`libastal-meta` 1-9 lists deps with new names / new members:
`libastal-power-profiles` (was `libastal-powerprofiles-git`), `libastal-greet` (was
`libastal-greetd-git`), plus new `libastal-brightness`, `libastal-idle-notify`, `libastal-wl`,
`libastal-workspace`. Expect yay to want to install a handful of renamed/new packages and possibly
replace old ones. Read the transaction list before hitting enter. If you don't use the meta package's
extras, you only actually need: `libastal`, `libastal-4`, `libastal-io`, `libastal-hyprland`,
`libastal-battery`, `libastal-wireplumber`, `libastal-tray`, `libastal-network`, `libastal-mpris`
(the ones your `Bar.tsx` imports).

## 6. Config migration

### 6a. Project scaffolding

Easiest: regenerate the scaffold, then re-apply your widgets.

```bash
cd ~/.config
mv ags ags.v2
ags init --gtk 4 -d ~/.config/ags      # writes package.json, tsconfig.json, env.d.ts,
                                       # style.scss, app.ts, widget/Bar.tsx, node_modules symlinks, @girs
# then copy your real files back in and port them (below)
cp ags.v2/style.scss ags/style.scss
cp ags.v2/run.sh ags/run.sh
# widget/*.tsx: port by hand per §6d
```

What `ags init` changes vs your current files:

**package.json**
```json
{ "dependencies": { "astal": "/usr/share/astal/gjs" } }
```
→
```json
{ "dependencies": { "ags": "*", "gnim": "*" }, "prettier": { "semi": false, "tabWidth": 2 } }
```
plus `node_modules/ags -> /usr/share/ags/js` and `node_modules/gnim -> /usr/share/ags/js/node_modules/gnim`.

**tsconfig.json**
```jsonc
{
  "compilerOptions": {
    "experimentalDecorators": false,      // was true — only matters if you add @register/@property later
    "strict": true,
    "module": "ES2022",
    "target": "ES2020",                   // was ES2022
    "lib": ["ES2023"],                    // new
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "ags/gtk4"          // was "astal/gtk4"
  }
}
```

**env.d.ts** — unchanged, keep yours.

**run.sh** — `ags run --gtk4` is no longer a valid flag. Use `ags run` (gtk4 is inferred from the
`ags/gtk4/app` import) or `ags run -g 4`. v3 still has **no built-in watch** (`// TODO: watch and
restart` in the source), so your `inotifywait` loop is still the right approach. Updated:
```bash
CONFIG_FILES="$HOME/.config/ags/ $HOME/.config/ags/widget/"
trap "ags quit" EXIT
while true; do
    ags run &                 # was: ags run --gtk4
    inotifywait -e create,modify $CONFIG_FILES
    ags quit
done
```

### 6b. `app.ts`

```ts
// v2
import { App } from "astal/gtk4"
import Bar from "./widget/Bar"
App.start({ css: style, main() { App.get_monitors().map(Bar) } })
```
```ts
// v3
import app from "ags/gtk4/app"
import style from "./style.scss"
import Bar from "./widget/Bar"
app.start({
  css: style,
  main() { app.get_monitors().map(Bar) },   // still fine; for hotplug use a reactive <For> (see simple-bar example)
})
```

### 6c. Import / API cheat-sheet for your code

| v2 | v3 |
|---|---|
| `import { App, Astal, Gtk, Gdk } from "astal/gtk4"` | `import app from "ags/gtk4/app"` + `import { Astal, Gtk, Gdk } from "ags/gtk4"` |
| `import { GLib, Variable, bind } from "astal"` | `import GLib from "gi://GLib"` + `import { createState, createBinding, createComputed, With, For, onCleanup } from "ags"` |
| `import Hyprland from "gi://AstalHyprland"` | unchanged |
| `Variable("")` | `const [v, setV] = createState("")` |
| `Variable(x).poll(ms, fn)` | `createPoll(x, ms, fn)` — `import { createPoll } from "ags/time"` |
| `Variable(x).watch(cmd)` | `createSubprocess` (`ags/process`) |
| `.derive([a,b], fn)` / `Variable.derive` | `createComputed([a, b], fn)` |
| `bind(obj, "prop")` | `createBinding(obj, "prop")` |
| `binding.as(fn)` | `binding(fn)` — call the accessor with the transform |
| `<label label={v()} />` | `<label label={v} />` — pass the accessor, don't call it |
| `time.drop()` / `onDestroy` for Variables | gone — cleanup is automatic; use `onCleanup(() => …)` for manual resources |
| `{binding.as(list => list.map(x => <w/>))}` in children | `<For each={binding}>{x => <w/>}</For>` |
| `{binding.as(x => x ? <A/> : <B/>)}` in children | `<With value={binding}>{x => x ? <A/> : <B/>}</With>` |
| `setup={self => …}` | `$={self => …}` |
| `className="x"` | `class="x"` |
| `cssName="x"` | `cssName="x"` — **unchanged**, still works in gtk4 JSX |
| `cssClasses={binding.as(…)}` | `class={accessor}` (string) or keep `cssClasses={accessor}` (array) |
| `onDestroy` | `$={self => onCleanup(() => …)}` |

**CSS:** `style.scss` is basically fine — GTK4 selectors are unchanged and it already targets
`cssName` node names (`Calendar`, `Wireplumber`, `Battery`, `Workspaces`, `ActiveWindow`,
`calendar_pop`, `.systray-menu`, `window.Bar > centerbox`, …). Keep every `cssName=` prop on the
ported widgets or those rules stop matching. `app.start({ css })` still injects it the same way.

### 6d. Widget-by-widget notes (`widget/Bar.tsx`, `widget/tray.tsx`)

- **`Time()`** — replace the self-referential `Variable("").poll(...)` with
  `const time = createPoll("", 1000, () => GLib.DateTime.new_now_local().format(format)!)`.
  Drop `onDestroy={() => time.drop()}`. `label={time}` (not `time()`).

- **`Workspaces()`** — the `Variable(null).poll(100, () => { focusedWorkspace.set(fw); return fw })`
  self-set pattern is an anti-pattern. Use `const focused = createBinding(hypr, "focusedWorkspace")`.
  Then `cssClasses={focused(fw => fw?.id === ws.id ? ["_"+ws.id, "focused"] : ["_"+ws.id])}`.
  `hypr.get_workspace(i)` still exists.

- **`Wireplumber()`** — `Variable(0).poll(100, …)` on volume → `createBinding(speaker, "volume")`.
  `bind(speaker, "volume-icon")` → `createBinding(speaker, "volumeIcon")` (camelCase; kebab still
  works but camel is idiomatic). The two `{bind(wp.audio, "devices").as(ds => ds.map(…))}` /
  `"microphones"` blocks → `<For each={createBinding(wp.audio, "devices")}>{d => <label label={d.description}/>}</For>`.
  `orientation={1}` → `orientation={Gtk.Orientation.VERTICAL}`. `setup=` on the sliders → `$=`.

- **`BatteryWidget()`** — self-polled `state` Variable → `createBinding(battery, "state")`.
  `bind(battery, "battery_icon_name")` → `createBinding(battery, "batteryIconName")`.
  `Battery.State.*` enum unchanged. The `bind(state).as(() => { switch(battery.state) … })` becomes
  `createBinding(battery, "state")(state => { switch(state) … })`.

- **`ActiveWindow()`** — `{bind(hypr, "focusedClient").as(client => { … nested bind(client,"title") … })}`
  must become `<With value={createBinding(hypr, "focusedClient")}>{client => client ? <box>…
  <label label={createBinding(client, "title")}/></box> : <label label="-"/>}</With>`.

- **`tray.tsx` `SysTray()`** — `{bind(tray, "items").as(items => items.map(item => …))}` →
  `<For each={createBinding(tray, "items")}>{item => …}</For>`. Prefer the v3 tray pattern
  (from `examples/gtk4/simple-bar/Bar.tsx`): a `menubutton` with
  `$={self => { self.menuModel = item.menuModel; self.insert_action_group("dbusmenu", item.actionGroup);
  item.connect("notify::action-group", () => self.insert_action_group("dbusmenu", item.actionGroup)) }}`
  and `<image gicon={createBinding(item, "gicon")} />`. Note `menu_model`/`action_group` →
  `menuModel`/`actionGroup`, and `icon_name` → prefer `gicon`.

- **`Bar()` window** — `cssClasses={["Bar"]}` → `class="Bar"`. `$type="start|center|end"` is how you
  slot children into `<centerbox>` in v3 (your `<box cssName="left/middle/right">` still works too,
  keep the `cssName`s for CSS). `application={App}` → `application={app}`. Consider
  `$={self => onCleanup(() => self.destroy())}` since v3 does not auto-destroy root windows.

### 6e. Regenerate types

```bash
cd ~/.config/ags
ags types -a        # rewrites @girs/ for the new libs; run after every libastal update
```

## 7. Reference

- Migration guide: https://aylur.github.io/ags/guide/migration-guide.html
- v3 gtk4 examples (ported patterns): https://github.com/Aylur/ags/tree/main/examples/gtk4
  (`simple-bar` covers tray, wifi, battery, mpris, wireplumber — almost your exact widget set)
- gnim (the new JSX/state runtime): https://github.com/Aylur/gnim
- Astal library docs: https://aylur.github.io/astal/
- AUR: https://aur.archlinux.org/packages/aylurs-gtk-shell

## 8. Suggested order

1. `git commit` + `git branch ags-v2-backup` + `git switch -c ags-v3-migration` (§3)
2. Save `packages-v2.txt` and `ags-v2-bundle.js.bak` (§3)
3. `yay -S aylurs-gtk-shell` then `yay -Syu`, reviewing the transaction (§4, §5)
4. `mv ags ags.v2 && ags init --gtk 4 -d ~/.config/ags`, restore `style.scss` / `run.sh` (§6a)
5. Port `app.ts`, then `widget/tray.tsx`, then `widget/Bar.tsx` (§6b–6d)
6. `ags types -a`, then `ags run` from a terminal and fix errors iteratively
7. Update `run.sh` (§6a), test the Hyprland `exec-once` path, then commit + merge to `master`
8. Once stable: `pacman -Rns libastal-gjs-git`, drop `ags.v2/`, drop `go`/`meson` if you don't want them
