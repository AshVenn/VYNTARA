import SettingsFormClient from "@/components/admin/settings-form-client"
import { getStoreSettings } from "@/app/actions/store-settings"

export default async function AdminSettings() {
  const settings = await getStoreSettings()
  return <SettingsFormClient settings={settings} />
}
