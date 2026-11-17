import { execAsync } from "ags/process"

export default function NotificationCenter() {
  const togglePanel = () =>
    execAsync(["swaync-client", "-t"]).catch(console.error)

  return (
    <button class="notifications" onClicked={togglePanel}>
      <image iconName="notifications-symbolic" />
    </button>
  )
}
