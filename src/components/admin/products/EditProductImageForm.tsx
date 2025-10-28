import { actions } from 'astro:actions';
import { CDN_URL } from 'astro:env/client';
import { Image, Trash2, Upload } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Product } from '@/store';

export default function EditProductImageForm({
	product,
}: {
	product: Product;
}) {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [images, setImages] = useState<
		{
			image: {
				id: number;
				image: string;
			};
			product_image: {
				id: number;
				productId: number;
				priority: number;
				image: number;
			};
		}[]
	>([]);

	const fetchImages = useCallback(async () => {
		const images = await actions.admin.products.getProductImages({
			productId: product.id,
		});
		if (!images.error) {
			setImages(images.data);
		}
	}, [product.id]);

	useEffect(() => {
		fetchImages();
	}, [fetchImages]);

	const handleAddImage = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = e.currentTarget;
		const formData = new FormData(form);

		const imageFile = formData.get('image') as File;

		if (!imageFile || imageFile.size === 0) {
			toast.error('Please select an image file');
			return;
		}

		setIsLoading(true);
		const loadingToast = toast.loading('Uploading image...');

		let imageBase64 = '';
		if (imageFile) {
			const reader = new FileReader();
			imageBase64 = await new Promise((resolve) => {
				reader.onload = (e) => resolve(e.target?.result as string);
				reader.readAsDataURL(imageFile);
			});
		}

		toast.dismiss(loadingToast);

		const result = await actions.admin.products.addProductImage({
			productId: product.id,
			image: imageBase64,
			priority: Number(formData.get('priority')),
		});

		if (result.error) {
			toast.error(result.error.message);
		} else {
			toast.success('Image added successfully');
			setOpen(false);
			fetchImages();
			setPreviewUrl(null);
			form.reset();
		}
		setIsLoading(false);
	};

	const handleDeleteImage = async (imageId: number) => {
		if (!confirm('Are you sure you want to delete this image?')) return;

		setIsLoading(true);
		const result = await actions.admin.products.deleteProductImage({
			imageId,
		});

		if (result.error) {
			toast.error(result.error.message);
		} else {
			toast.success('Image deleted successfully');
			fetchImages();
		}
		setIsLoading(false);
	};

	const handleUpdatePriority = async (imageId: number, newPriority: number) => {
		setIsLoading(true);
		const result = await actions.admin.products.updateProductImage({
			imageId,
			priority: newPriority,
		});

		if (result.error) {
			toast.error(result.error.message);
		} else {
			toast.success('Priority updated successfully');
			fetchImages();
		}
		setIsLoading(false);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				setPreviewUrl(e.target?.result as string);
			};
			reader.readAsDataURL(file);
		} else {
			setPreviewUrl(null);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="ghost" size="icon">
					<Image className="h-4 w-4" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Edit Product Images</DialogTitle>
					<DialogDescription>
						Manage product images and their display order.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-6">
					<Card>
						<CardHeader>
							<CardTitle>Add New Image</CardTitle>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleAddImage} className="space-y-4">
								<div className="grid gap-4">
									<div className="grid gap-2">
										<Label htmlFor="image">Image File</Label>
										<Input
											id="image"
											type="file"
											name="image"
											accept="image/*"
											onChange={handleFileChange}
											className="cursor-pointer"
										/>
									</div>

									{previewUrl && (
										<div className="relative aspect-video w-full overflow-hidden rounded-lg border">
											<img
												src={previewUrl}
												alt="Preview"
												className="object-contain w-full h-full"
											/>
										</div>
									)}

									<div className="grid gap-2">
										<Label htmlFor="priority">Display Priority</Label>
										<Input
											id="priority"
											type="number"
											name="priority"
											defaultValue={0}
											min={0}
											className="w-32"
										/>
										<p className="text-sm text-muted-foreground">
											Lower numbers will be displayed first
										</p>
									</div>
								</div>

								<Button type="submit" disabled={isLoading} className="w-full">
									{isLoading ? (
										<span className="flex items-center gap-2">
											<Upload className="h-4 w-4 animate-spin" />
											Uploading...
										</span>
									) : (
										<span className="flex items-center gap-2">
											<Upload className="h-4 w-4" />
											Upload Image
										</span>
									)}
								</Button>
							</form>
						</CardContent>
					</Card>

					<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
						{images.map((image) => (
							<Card
								key={image.product_image.id}
								className="relative group w-full"
							>
								<div className="aspect-square relative overflow-hidden rounded-t-lg">
									<img
										src={`${CDN_URL}/${image.image.image}`}
										alt={image.image.image}
										className="object-cover w-full h-full"
									/>
									<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
										<Button
											variant="destructive"
											size="icon"
											onClick={() => handleDeleteImage(image.product_image.id)}
											disabled={isLoading}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
								<div className="p-3 border-t">
									<form
										onSubmit={(e) => {
											e.preventDefault();
											const form = e.currentTarget;
											const priority = Number(form.priority.value);
											handleUpdatePriority(image.product_image.id, priority);
										}}
										className="space-y-2"
									>
										<div className="flex items-center gap-2">
											<Label
												htmlFor={`priority-${image.product_image.id}`}
												className="text-sm font-medium text-muted-foreground shrink-0"
											>
												Priority
											</Label>
											<Input
												id={`priority-${image.product_image.id}`}
												name="priority"
												type="number"
												defaultValue={image.product_image.priority}
												min={0}
												className="w-16 h-8 text-center shrink-0"
												disabled={isLoading}
											/>
										</div>
										<Button
											type="submit"
											size="sm"
											variant="secondary"
											disabled={isLoading}
											className="w-full h-8"
										>
											Save
										</Button>
									</form>
								</div>
							</Card>
						))}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
