import { actions } from 'astro:actions';
import { Mail, Plus, Edit, Trash2, Save, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type EmailTemplate = {
	id: number;
	name: string;
	subject: string;
	body: string;
	type: 'order_confirmation' | 'password_reset' | 'welcome' | 'custom';
	createdAt: Date;
	updatedAt: Date;
};

export default function EmailTemplatesManager() {
	const [templates, setTemplates] = useState<EmailTemplate[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
		null,
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [templateToDelete, setTemplateToDelete] =
		useState<EmailTemplate | null>(null);

	const fetchTemplates = async () => {
		setIsLoading(true);
		try {
			const { data, error } = await actions.admin.emailTemplates.getTemplates(
				{},
			);

			if (!error && data) {
				setTemplates(data.data || []);
			}
		} catch (error) {
			console.error('Error fetching templates:', error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchTemplates();
	}, []);

	const handleEdit = (template: EmailTemplate) => {
		setEditingTemplate({ ...template });
		setIsDialogOpen(true);
	};

	const handleSave = async () => {
		if (!editingTemplate) return;

		setIsLoading(true);
		try {
			if (editingTemplate.id) {
				// Update existing template
				const { error } = await actions.admin.emailTemplates.updateTemplate({
					id: editingTemplate.id,
					name: editingTemplate.name,
					subject: editingTemplate.subject,
					body: editingTemplate.body,
					type: editingTemplate.type,
				});

				if (error) {
					alert(error.message || 'Failed to update template');
					return;
				}
			} else {
				// Create new template
				const { error } = await actions.admin.emailTemplates.createTemplate({
					name: editingTemplate.name,
					subject: editingTemplate.subject,
					body: editingTemplate.body,
					type: editingTemplate.type,
				});

				if (error) {
					alert(error.message || 'Failed to create template');
					return;
				}
			}

			setIsDialogOpen(false);
			setEditingTemplate(null);
			await fetchTemplates();
		} catch (error) {
			alert('An error occurred while saving the template');
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async () => {
		if (!templateToDelete) return;

		setIsLoading(true);
		try {
			const { error } = await actions.admin.emailTemplates.deleteTemplate({
				id: templateToDelete.id,
			});

			if (error) {
				alert(error.message || 'Failed to delete template');
			} else {
				setDeleteDialogOpen(false);
				setTemplateToDelete(null);
				await fetchTemplates();
			}
		} catch (error) {
			alert('An error occurred while deleting the template');
		} finally {
			setIsLoading(false);
		}
	};

	const getTypeBadge = (type: string) => {
		switch (type) {
			case 'order_confirmation':
				return (
					<Badge variant="outline" className="border-blue-500 text-blue-500">
						Order Confirmation
					</Badge>
				);
			case 'password_reset':
				return (
					<Badge
						variant="outline"
						className="border-yellow-500 text-yellow-500">
						Password Reset
					</Badge>
				);
			case 'welcome':
				return (
					<Badge variant="outline" className="border-primary text-primary">
						Welcome
					</Badge>
				);
			default:
				return <Badge variant="outline">Custom</Badge>;
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Email Templates</h2>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						onClick={fetchTemplates}
						disabled={isLoading}>
						<RefreshCw
							className={`size-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
						/>
						Refresh
					</Button>
					<Button
						onClick={() => {
							setEditingTemplate({
								id: 0,
								name: '',
								subject: '',
								body: '',
								type: 'custom',
								createdAt: new Date(),
								updatedAt: new Date(),
							});
							setIsDialogOpen(true);
						}}>
						<Plus className="size-4 mr-2" />
						Create Template
					</Button>
				</div>
			</div>

			{isLoading && templates.length === 0 ? (
				<div className="text-center py-8 text-muted-foreground">
					Loading templates...
				</div>
			) : templates.length === 0 ? (
				<Card>
					<CardContent className="py-8 text-center text-muted-foreground">
						No templates found. Create your first template to get started.
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{templates.map((template) => (
						<Card key={template.id}>
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<CardTitle className="text-lg">{template.name}</CardTitle>
										<CardDescription className="mt-1">
											{template.subject}
										</CardDescription>
									</div>
									{getTypeBadge(template.type)}
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="text-sm text-muted-foreground line-clamp-3">
									{template.body}
								</div>
								<div className="text-xs text-muted-foreground">
									Updated: {new Date(template.updatedAt).toLocaleDateString()}
								</div>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleEdit(template)}
										className="flex-1">
										<Edit className="size-4 mr-2" />
										Edit
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => {
											setTemplateToDelete(template);
											setDeleteDialogOpen(true);
										}}>
										<Trash2 className="size-4 text-destructive" />
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Edit/Create Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>
							{editingTemplate?.id
								? 'Edit Email Template'
								: 'Create Email Template'}
						</DialogTitle>
						<DialogDescription>
							{editingTemplate?.id
								? 'Edit the email template. Use {{variable}} for dynamic content.'
								: 'Create a new email template. Use {{variable}} for dynamic content.'}
						</DialogDescription>
					</DialogHeader>
					{editingTemplate && (
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="name">Template Name *</Label>
								<Input
									id="name"
									value={editingTemplate.name}
									onChange={(e) =>
										setEditingTemplate({
											...editingTemplate,
											name: e.target.value,
										})
									}
									placeholder="e.g., Order Confirmation"
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="type">Template Type *</Label>
								<Select
									value={editingTemplate.type}
									onValueChange={(
										value:
											| 'order_confirmation'
											| 'password_reset'
											| 'welcome'
											| 'custom',
									) => setEditingTemplate({ ...editingTemplate, type: value })}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="order_confirmation">
											Order Confirmation
										</SelectItem>
										<SelectItem value="password_reset">
											Password Reset
										</SelectItem>
										<SelectItem value="welcome">Welcome</SelectItem>
										<SelectItem value="custom">Custom</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="subject">Subject *</Label>
								<Input
									id="subject"
									value={editingTemplate.subject}
									onChange={(e) =>
										setEditingTemplate({
											...editingTemplate,
											subject: e.target.value,
										})
									}
									placeholder="e.g., Your order has been confirmed"
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="body">Body *</Label>
								<Textarea
									id="body"
									value={editingTemplate.body}
									onChange={(e) =>
										setEditingTemplate({
											...editingTemplate,
											body: e.target.value,
										})
									}
									rows={10}
									placeholder="e.g., Thank you for your order! Your order #{{orderId}} has been confirmed."
									required
								/>
								<p className="text-xs text-muted-foreground">
									Use double curly braces for variables: {'{{variableName}}'}
								</p>
							</div>
						</div>
					)}
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsDialogOpen(false)}
							disabled={isLoading}>
							Cancel
						</Button>
						<Button onClick={handleSave} disabled={isLoading}>
							<Save className="size-4 mr-2" />
							{isLoading ? 'Saving...' : 'Save'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Email Template</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete "{templateToDelete?.name}"? This
							action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteDialogOpen(false)}
							disabled={isLoading}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={isLoading}>
							{isLoading ? 'Deleting...' : 'Delete'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
