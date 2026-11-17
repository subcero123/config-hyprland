import { Gtk } from "ags/gtk4"
import { createBinding, For } from "ags"
import AstalWp from "gi://AstalWp"

function DeviceList({
  iconName,
  title,
  devices,
  className,
}: {
  iconName: string
  title: string
  devices: any
  className?: string
}) {
  return (
    <box class={`device-selector ${className ?? ""}`} orientation={Gtk.Orientation.VERTICAL} spacing={4}>
      <box class="device-selector-header" spacing={6}>
        <image iconName={iconName} />
        <label class="device-selector-title" label={title} halign={Gtk.Align.START} />
      </box>
      <box class="device-list" orientation={Gtk.Orientation.VERTICAL} spacing={2}>
        <For each={devices}>
          {(device: any) => (
            <button
              class={createBinding(device, "isDefault").as((d) =>
                d ? "device-item active" : "device-item",
              )}
              onClicked={() => device.set_is_default(true)}
            >
              <box spacing={8}>
                <image
                  iconName={createBinding(device, "isDefault").as((d) =>
                    d ? "object-select-symbolic" : "audio-card-symbolic",
                  )}
                />
                <label
                  halign={Gtk.Align.START}
                  hexpand
                  xalign={0}
                  ellipsize={3}
                  label={createBinding(device, "description").as(
                    (d) => d || device.name || "Dispositivo",
                  )}
                />
              </box>
            </button>
          )}
        </For>
      </box>
    </box>
  )
}

function VolumeSliderRow({
  iconName,
  endpoint,
}: {
  iconName: any
  endpoint: any
}) {
  return (
    <box class="volume-slider-row" spacing={8} valign={Gtk.Align.CENTER}>
      <image iconName={iconName} />
      <slider
        hexpand
        onChangeValue={({ value }) => endpoint.set_volume(value)}
        value={createBinding(endpoint, "volume")}
      />
      <label
        class="volume-percent"
        widthChars={4}
        xalign={1}
        label={createBinding(endpoint, "volume").as(
          (v) => `${Math.round(v * 100)}%`,
        )}
      />
    </box>
  )
}

export default function AudioOutput() {
  const wp = AstalWp.get_default() as any
  if (!wp) return <box />

  const audio = wp.audio ?? wp
  const speaker = audio.defaultSpeaker ?? wp.defaultSpeaker
  const microphone = audio.defaultMicrophone ?? wp.defaultMicrophone
  const speakers = createBinding(audio, "speakers")
  const microphones = createBinding(audio, "microphones")

  if (!speaker) return <box />

  return (
    <menubutton class="volume">
      <image iconName={createBinding(speaker, "volumeIcon")} />
      <popover>
        <box class="volume-popover" orientation={Gtk.Orientation.VERTICAL} spacing={10}>
          <box class="volume-section" orientation={Gtk.Orientation.VERTICAL} spacing={6}>
            <box class="device-selector-header" spacing={6}>
              <image iconName={createBinding(speaker, "volumeIcon")} />
              <label class="device-selector-title" label="Audio" halign={Gtk.Align.START} />
            </box>
            <VolumeSliderRow
              iconName="audio-headphones-symbolic"
              endpoint={speaker}
            />
            {microphone && (
              <VolumeSliderRow
                iconName={createBinding(microphone, "volumeIcon").as(
                  (i) => i || "audio-input-microphone-symbolic",
                )}
                endpoint={microphone}
              />
            )}
          </box>

          <box class="device-section-sep" />

          <DeviceList
            iconName="audio-headphones-symbolic"
            title="Salida"
            devices={speakers}
            className="sink-selector"
          />

          <box class="device-section-sep" />

          <DeviceList
            iconName="audio-input-microphone-symbolic"
            title="Entrada"
            devices={microphones}
            className="source-selector"
          />
        </box>
      </popover>
    </menubutton>
  )
}
