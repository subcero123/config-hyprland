import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { createPoll } from "ags/time"
import { createBinding, createComputed, For } from "ags"
import GLib from "gi://GLib"
import AstalTray from "gi://AstalTray"
import AstalHyprland from "gi://AstalHyprland"
import PowerMenu from "./PowerMenu"
import AudioOutput from "./Volume"
import NotificationCenter from "./Notifications"

const hyprland = AstalHyprland.get_default()

const WORKSPACE_KANJI = [
  "一", "二", "三", "四", "五",
  "六", "七", "八", "九", "十",
]

function Workspaces() {
  const workspaces = createBinding(hyprland, "workspaces")
  const focused = createBinding(hyprland, "focusedWorkspace")

  const dispatch = (ws: number) =>
    hyprland.dispatch(`hl.dsp.focus({ workspace = ${ws} })`, "")

  const scroll = new Gtk.EventControllerScroll({
    flags: Gtk.EventControllerScrollFlags.VERTICAL,
  })
  scroll.connect("scroll", (_self, _dx, dy) => {
    const workspace = dy < 0 ? "e+1" : "e-1"
    hyprland.dispatch(`hl.dsp.focus({ workspace = "${workspace}" })`, "")
    return true
  })

  return (
    <box
      class="workspaces"
      $={(self: Gtk.Box) => self.add_controller(scroll)}
    >
      {Array.from({ length: 10 }, (_, i) => i + 1).map((i) => (
        <button
          label={WORKSPACE_KANJI[i - 1]}
          visible={workspaces.as((list) =>
            list.some((ws) => ws.id === i)
          )}
          class={createComputed(
            [focused, workspaces],
            (ws, list) => {
              const lastWorkspaceId = list
                .map((workspace) => workspace.id)
                .filter((id) => id >= 1 && id <= 10)
                .sort((a, b) => a - b)
                .at(-1)

              const state = ws?.id === i ? "workspace active" : "workspace"
              return lastWorkspaceId === i ? `${state} last` : state
            },
          )}
          onClicked={() => dispatch(i)}
        />
      ))}
    </box>
  )
}

function FocusedTitle() {
  const title = createBinding(hyprland, "focusedClient", "title")
  const visible = createBinding(hyprland, "focusedClient").as(
    (client) => client !== null,
  )

  return (
    <label
      class="focused-title"
      label={title.as((t) => t ?? "")}
      visible={visible}
    />
  )
}

function Tray() {
  const tray = AstalTray.get_default()
  const items = createBinding(tray, "items")

  const init = (btn: Gtk.MenuButton, item: AstalTray.TrayItem) => {
    btn.menuModel = item.menuModel
    btn.insert_action_group("dbusmenu", item.actionGroup)
    item.connect("notify::action-group", () => {
      btn.insert_action_group("dbusmenu", item.actionGroup)
    })
  }

  return (
    <box>
      <For each={items}>
        {(item: AstalTray.TrayItem) => (
          <menubutton $={(self: Gtk.MenuButton) => init(self, item)}>
            <image gicon={createBinding(item, "gicon")} />
          </menubutton>
        )}
      </For>
    </box>
  )
}

function PanelSeparator() {
  return <box class="panel-separator" />
}

function PanelIcon({ iconName, className }: { iconName: string; className?: string }) {
  return (
    <button class={className}>
      <image iconName={iconName} />
    </button>
  )
}

function Clock() {
  const now = createPoll(GLib.DateTime.new_now_local(), 1000, () =>
    GLib.DateTime.new_now_local()
  )

  const weekday = new Intl.DateTimeFormat("ja-JP", { weekday: "short" })

  const date = now.as((t) =>
    `${t.format("%Y年%m月%d日")}`
  )
  const time = now.as((t) => t.format("%H:%M:%S")!)

  return (
    <menubutton>
      <box orientation={Gtk.Orientation.VERTICAL} spacing={2}>
        <label class="clock-date" halign={Gtk.Align.CENTER} label={date} />
        <label class="clock-time" halign={Gtk.Align.CENTER} label={time} />
      </box>
      <popover>
        <Gtk.Calendar />
      </popover>
    </menubutton>
  )
}

export default function Bar(gdkmonitor: Gdk.Monitor) {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor
  const sideWidth = Math.round(gdkmonitor.get_geometry().width * 0.15)

  return (
    <window
      visible
      name="bar"
      class="Bar"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={app}
    >
      <box orientation={Gtk.Orientation.VERTICAL}>
        <box class="bar-strip" />
        <centerbox class="bar-panels">
          <box
            $type="start"
            class="bar-left-wrap"
            halign={Gtk.Align.START}
          >
            <box
              class="bar-left-tab bar-content bar-content-left"
              widthRequest={sideWidth}
            >
              <box halign={Gtk.Align.START} valign={Gtk.Align.CENTER}>
                <Workspaces />
              </box>
            </box>
          </box>
          <box $type="center" class="bar-tab-wrap" halign={Gtk.Align.CENTER}>
            <box class="bar-tab">
              <Clock />
              {/* <FocusedTitle /> */}
            </box>
          </box>
          <box $type="end" class="bar-right-wrap" halign={Gtk.Align.END}>
            <box
              class="bar-right-tab bar-content bar-content-right"
              widthRequest={sideWidth}
            >
              <box hexpand />
              <box valign={Gtk.Align.CENTER}>
                <PanelIcon
                  iconName="pan-down-symbolic"
                  className="panel-dropdown"
                />
                <Tray />
                <PanelSeparator />

                <AudioOutput />
                <NotificationCenter />
                <PanelSeparator />

                <PowerMenu />
              </box>
            </box>
          </box>
        </centerbox>
      </box>
    </window>
  )
}
