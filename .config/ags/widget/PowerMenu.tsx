import { Gtk } from "ags/gtk4"
import { execAsync } from "ags/process"
import AstalHyprland from "gi://AstalHyprland"

const hyprland = AstalHyprland.get_default()

export default function PowerMenu() {
  let popover: Gtk.Popover | undefined

  const run = (action: () => void) => {
    popover?.popdown()
    action()
  }

  const shutdown = () =>
    run(() => execAsync(["systemctl", "poweroff"]).catch(console.error))

  const reboot = () =>
    run(() => execAsync(["systemctl", "reboot"]).catch(console.error))

  const logout = () => run(() => hyprland.dispatch("hl.dsp.exit()", ""))

  return (
    <menubutton class="power-menu">
      <image iconName="system-shutdown-symbolic" />
      <popover $={(self: Gtk.Popover) => (popover = self)}>
        <box orientation={Gtk.Orientation.VERTICAL} spacing={4}>
          <button class="power-item" onClicked={shutdown}>
            <box spacing={8}>
              <image iconName="system-shutdown-symbolic" />
              <label label="Apagar" />
            </box>
          </button>

          <button class="power-item" onClicked={reboot}>
            <box spacing={8}>
              <image iconName="system-reboot-symbolic" />
              <label label="Reiniciar" />
            </box>
          </button>

          <button class="power-item" onClicked={logout}>
            <box spacing={8}>
              <image iconName="system-log-out-symbolic" />
              <label label="Cerrar Sesión" />
            </box>
          </button>
        </box>
      </popover>
    </menubutton>
  )
}
