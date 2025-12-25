import { actions } from 'astro:actions';
import { Package, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import type { productCategoryTable } from '@/db/schema';
import { AddCategoryForm } from './AddCategoryForm';
import { EditCategoryForm } from './EditCategoryForm';

type Category = typeof productCategoryTable.$inferSelect;

interface CategoriesTableProps {
	initialCategories: Category[];
}

export function CategoriesTable({ initialCategories }: CategoriesTableProps) {
	const [categories, setCategories] = useState<Category[]>(initialCategories);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
		null,
	);

	const handleDeleteClick = (category: Category) => {
		setCategoryToDelete(category);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!categoryToDelete) return;

		setIsLoading(true);
		try {
			const { error } = await actions.admin.category.deleteCategory({
				categoryId: categoryToDelete.id,
			});

			if (!error) {
				toast.success('Category deleted successfully');
				setDeleteDialogOpen(false);
				setCategoryToDelete(null);
				// Refresh categories
				await handleCategoryUpdated();
			} else {
				toast.error(error.message || 'Failed to delete category');
			}
		} catch (error) {
			console.error('Error deleting category:', error);
			toast.error('An error occurred while deleting the category');
		} finally {
			setIsLoading(false);
		}
	};

	const handleCategoryUpdated = async () => {
		const { data, error } = await actions.admin.category.getCategories();
		if (!error) {
			setCategories(data);
		}
	};

	// Filter categories based on search
	const filteredCategories = categories.filter((category) => {
		const query = searchQuery.toLowerCase();
		return (
			category.name.toLowerCase().includes(query) ||
			category.id.toString().includes(query)
		);
	});

	if (error) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-16">
					<p className="text-destructive mb-4">{error}</p>
					<Button variant="outline" onClick={() => setError(null)}>
						Retry
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			{/* Statistics Card */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">
									Total Categories
								</p>
								<p className="text-2xl font-bold">{categories.length}</p>
							</div>
							<Package className="size-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Showing</p>
								<p className="text-2xl font-bold">
									{filteredCategories.length}
								</p>
							</div>
							<Package className="size-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Search and Add Button */}
			<Card>
				<CardContent className="p-4">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
							<Input
								placeholder="Search categories by name or ID..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>
						<AddCategoryForm onCategoryAdded={handleCategoryUpdated} />
					</div>
				</CardContent>
			</Card>

			{/* Categories Table */}
			{filteredCategories.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-16">
						<Package className="size-16 text-muted-foreground mb-4" />
						<h3 className="text-lg font-semibold mb-2">
							{searchQuery ? 'No categories found' : 'No categories yet'}
						</h3>
						<p className="text-muted-foreground text-center">
							{searchQuery
								? 'Try adjusting your search criteria'
								: 'Create your first category to organize your products'}
						</p>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader>
						<CardTitle>Categories</CardTitle>
						<CardDescription>
							Showing {filteredCategories.length} of {categories.length}{' '}
							categories
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-[100px]">ID</TableHead>
									<TableHead>Name</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{isLoading ? (
									<TableRow>
										<TableCell colSpan={3} className="text-center py-8">
											<div className="flex items-center justify-center">
												<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
												<span className="ml-2 text-muted-foreground">
													Loading...
												</span>
											</div>
										</TableCell>
									</TableRow>
								) : (
									filteredCategories.map((category) => (
										<TableRow key={category.id} className="hover:bg-muted/50">
											<TableCell className="font-medium">
												{category.id}
											</TableCell>
											<TableCell>
												<Badge
													variant="secondary"
													className="text-base px-3 py-1">
													{category.name}
												</Badge>
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-2">
													<EditCategoryForm
														category={category}
														onCategoryUpdated={handleCategoryUpdated}
													/>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => handleDeleteClick(category)}
														className="text-destructive hover:text-destructive hover:bg-destructive/10">
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Category</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete "{categoryToDelete?.name}"? This
							action cannot be undone. If this category is used by any products,
							you will need to reassign or delete those products first.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setDeleteDialogOpen(false);
								setCategoryToDelete(null);
							}}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteConfirm}
							disabled={isLoading}>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
