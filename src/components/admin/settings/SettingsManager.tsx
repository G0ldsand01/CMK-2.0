import { actions } from 'astro:actions';
import { Loader2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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

type SettingsData = {
	siteName: string;
	siteUrl: string;
	maintenanceMode: boolean;
	allowRegistrations: boolean;
	emailNotifications: boolean;
};

export default function SettingsManager() {
	const [settings, setSettings] = useState<SettingsData>({
		siteName: 'CMK',
		siteUrl: 'https://cmk.com',
		maintenanceMode: false,
		allowRegistrations: true,
		emailNotifications: true,
	});
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		const loadSettings = async () => {
			try {
				const { error, data } = await actions.admin.settings.getSettings();

				if (!error && data?.settings) {
					setSettings(data.settings);
				} else {
					toast.error('Failed to load settings');
				}
			} catch (error) {
				console.error('Error loading settings:', error);
				toast.error('An error occurred while loading settings');
			} finally {
				setIsLoading(false);
			}
		};

		loadSettings();
	}, []);

	const handleSave = async () => {
		setIsSaving(true);

		try {
			const { error } = await actions.admin.settings.updateSettings(settings);

			if (!error) {
				toast.success('Settings saved successfully!');
			} else {
				toast.error(error.message || 'Failed to save settings');
			}
		} catch (error) {
			console.error('Error saving settings:', error);
			toast.error('An error occurred while saving settings');
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			<Card>
				<CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
					<CardTitle className="text-lg sm:text-xl">General Settings</CardTitle>
					<CardDescription className="text-xs sm:text-sm">
						Configure general site settings
					</CardDescription>
				</CardHeader>
				<CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
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
				<CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
					<CardTitle className="text-lg sm:text-xl">System Settings</CardTitle>
					<CardDescription className="text-xs sm:text-sm">
						Configure system behavior
					</CardDescription>
				</CardHeader>
				<CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
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

			<div className="flex justify-end pt-4">
				<Button
					onClick={handleSave}
					disabled={isSaving}
					className="w-full sm:w-auto">
					{isSaving ? (
						<>
							<Loader2 className="size-4 mr-2 animate-spin" />
							Saving...
						</>
					) : (
						<>
							<Save className="size-4 mr-2" />
							Save Settings
						</>
					)}
				</Button>
			</div>
		</div>
	);
}
