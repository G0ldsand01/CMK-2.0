import { Settings, Save } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

export default function SettingsManager() {
	const [settings, setSettings] = useState({
		siteName: 'CMK',
		siteUrl: 'https://cmk.com',
		maintenanceMode: false,
		allowRegistrations: true,
		emailNotifications: true,
	});

	const handleSave = () => {
		// TODO: Implement save functionality
		alert('Settings saved! (This is a placeholder)');
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>General Settings</CardTitle>
					<CardDescription>Configure general site settings</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="siteName">Site Name</Label>
						<Input
							id="siteName"
							value={settings.siteName}
							onChange={(e) =>
								setSettings({ ...settings, siteName: e.target.value })
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="siteUrl">Site URL</Label>
						<Input
							id="siteUrl"
							value={settings.siteUrl}
							onChange={(e) =>
								setSettings({ ...settings, siteUrl: e.target.value })
							}
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>System Settings</CardTitle>
					<CardDescription>Configure system behavior</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>Maintenance Mode</Label>
							<p className="text-sm text-muted-foreground">
								Enable maintenance mode to restrict site access
							</p>
						</div>
						<Switch
							checked={settings.maintenanceMode}
							onCheckedChange={(checked) =>
								setSettings({ ...settings, maintenanceMode: checked })
							}
						/>
					</div>
					<Separator />
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>Allow Registrations</Label>
							<p className="text-sm text-muted-foreground">
								Allow new users to register accounts
							</p>
						</div>
						<Switch
							checked={settings.allowRegistrations}
							onCheckedChange={(checked) =>
								setSettings({ ...settings, allowRegistrations: checked })
							}
						/>
					</div>
					<Separator />
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>Email Notifications</Label>
							<p className="text-sm text-muted-foreground">
								Send email notifications for important events
							</p>
						</div>
						<Switch
							checked={settings.emailNotifications}
							onCheckedChange={(checked) =>
								setSettings({ ...settings, emailNotifications: checked })
							}
						/>
					</div>
				</CardContent>
			</Card>

			<div className="flex justify-end">
				<Button onClick={handleSave}>
					<Save className="size-4 mr-2" />
					Save Settings
				</Button>
			</div>
		</div>
	);
}
