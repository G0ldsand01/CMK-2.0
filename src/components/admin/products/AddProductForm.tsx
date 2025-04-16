import { actions } from 'astro:actions';
import { Button } from '@/components/ui/button';
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { productCategoryTable } from '@/db/schema';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type Category = typeof productCategoryTable.$inferSelect;

interface AddProductFormProps {
	categories: { id: number; name: string }[];
	types: string[];
	onProductAdded?: () => void;
}

export default function AddProductForm({
	categories,
	types,
	onProductAdded,
}: AddProductFormProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedType, setSelectedType] = useState<string>(types[0] || '');
	const [selectedCategory, setSelectedCategory] = useState<Category>(
		categories[0] || { id: 0, name: '' },
	);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		try {
			const form = event.currentTarget;
			const formData = new FormData(form);

			// Get the image file
			const imageFile = formData.get('image') as File;

			if (!imageFile || imageFile.size === 0) {
				toast.error('Please select an image file');
				return;
			}

			// Show loading toast
			const loadingToast = toast.loading('Uploading image...');

			// Convert the image to base64
			let imageBase64 = '';
			if (imageFile) {
				const reader = new FileReader();
				imageBase64 = await new Promise((resolve) => {
					reader.onload = (e) => resolve(e.target?.result as string);
					reader.readAsDataURL(imageFile);
				});
			}

			// Hide loading toast
			toast.dismiss(loadingToast);

			// Show uploading toast
			const uploadingToast = toast.loading('Adding product...');

			const result = await actions.admin.products.addProduct({
				name: (formData.get('name') as string) || '',
				price: Number(formData.get('price')) || 0,
				description: (formData.get('description') as string) || '',
				image: imageBase64,
				type: selectedType,
				category: selectedCategory.id,
				stock: 0,
			});

			// Hide uploading toast
			toast.dismiss(uploadingToast);

			if (result.error) {
				console.error('Error details:', result.error);

				// Handle specific error cases
				if (result.error.message.includes('duplicate key value')) {
					toast.error(
						'A product with this ID already exists. Please try again.',
					);
				} else {
					toast.error(`Error adding product: ${result.error.message}`);
				}
			} else {
				toast.success('Product added successfully');
				setIsOpen(false);
				if (onProductAdded) {
					onProductAdded();
				}
			}
		} catch (error) {
			console.error('Unexpected error:', error);
			toast.error('An unexpected error occurred. Please try again.');
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					Add Product
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Add New Product</DialogTitle>
					<DialogDescription>
						Fill in the details to add a new product to your store.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Product Name</Label>
						<Input
							id="name"
							name="name"
							placeholder="Enter product name"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="price">Price</Label>
						<Input
							id="price"
							name="price"
							type="number"
							step="0.01"
							placeholder="Enter price"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							name="description"
							placeholder="Enter product description"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="image">Image</Label>
						<Input
							id="image"
							name="image"
							type="file"
							accept="image/*"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="type">Type</Label>
						<Select value={selectedType} onValueChange={setSelectedType}>
							<SelectTrigger>
								<SelectValue placeholder="Select type" />
							</SelectTrigger>
							<SelectContent>
								{types.map((type) => (
									<SelectItem key={type} value={type}>
										{type}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="category">Category</Label>
						<Select
							value={selectedCategory.name}
							onValueChange={(value) => {
								const category = categories.find((c) => c.name === value);
								if (category) {
									setSelectedCategory(category);
								}
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select category" />
							</SelectTrigger>
							<SelectContent>
								{categories.map((category) => (
									<SelectItem key={category.id} value={category.name}>
										{category.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex justify-end space-x-2">
						<Button type="submit">Add Product</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
