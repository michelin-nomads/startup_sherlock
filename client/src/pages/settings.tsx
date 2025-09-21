import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Settings as SettingsIcon, Bell, Shield, User, Palette } from "lucide-react"

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [autoAnalysis, setAutoAnalysis] = useState(false)
  const [riskAlerts, setRiskAlerts] = useState(true)
  const [userName, setUserName] = useState("Alex Johnson")
  const [email, setEmail] = useState("alex@investment-firm.com")
  const [analysisPrefs, setAnalysisPrefs] = useState("")

  const handleSaveSettings = () => {
    console.log('Saving settings...')
    console.log({
      notifications,
      autoAnalysis,
      riskAlerts,
      userName,
      email,
      analysisPrefs
    })
  }

  return (
    <div className="space-y-6" data-testid="settings-page-main">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and analysis configuration
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Full Name</Label>
              <Input
                id="user-name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                data-testid="input-user-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="analysis-prefs">Analysis Preferences</Label>
              <Textarea
                id="analysis-prefs"
                placeholder="Describe your investment focus areas, risk tolerance, etc."
                value={analysisPrefs}
                onChange={(e) => setAnalysisPrefs(e.target.value)}
                data-testid="textarea-analysis-prefs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark mode
                </p>
              </div>
              <ThemeToggle />
            </div>
            <div className="pt-4 border-t">
              <Label className="text-sm font-medium">Current Theme</Label>
              <div className="mt-2 flex gap-2">
                <Badge variant="secondary">Professional</Badge>
                <Badge variant="outline">Data-Focused</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates about analysis completion
                </p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
                data-testid="switch-notifications"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Risk Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about high-risk findings
                </p>
              </div>
              <Switch
                checked={riskAlerts}
                onCheckedChange={setRiskAlerts}
                data-testid="switch-risk-alerts"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Analysis</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically analyze uploaded documents
                </p>
              </div>
              <Switch
                checked={autoAnalysis}
                onCheckedChange={setAutoAnalysis}
                data-testid="switch-auto-analysis"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button variant="outline" className="w-full" data-testid="button-change-password">
                Change Password
              </Button>
              <Button variant="outline" className="w-full" data-testid="button-2fa">
                Enable Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full" data-testid="button-api-keys">
                Manage API Keys
              </Button>
            </div>
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Data Retention</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Analysis data is encrypted and stored securely
              </p>
              <Badge variant="secondary">
                <Shield className="h-3 w-3 mr-1" />
                Enterprise Security
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} data-testid="button-save-settings">
          <SettingsIcon className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}