import { actions } from 'astro:actions';
import { Button } from '@/components/ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import type { productCategoryTable } from '@/db/schema';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
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

	const handleDelete = async (categoryId: number) => {
		// Implement delete functionality
		console.log('Delete category:', categoryId);
	};

	const handleCategoryUpdated = async () => {
		const { data, error } = await actions.admin.category.getCategories();
		if (!error) {
			setCategories(data);
		}
	};

	if (error) {
		return (
			<div className="text-center text-red-500 p-4">
				<p>{error}</p>
				<Button
					variant="outline"
					onClick={() => setError(null)}
					className="mt-4"
				>
					Retry
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<AddCategoryForm onCategoryAdded={handleCategoryUpdated} />
			</div>
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
							<TableCell colSpan={3} className="text-center">
								Loading...
							</TableCell>
						</TableRow>
					) : categories.length === 0 ? (
						<TableRow>
							<TableCell colSpan={3} className="text-center">
								No categories found
							</TableCell>
						</TableRow>
					) : (
						categories.map((category) => (
							<TableRow key={category.id}>
								<TableCell className="font-medium">{category.id}</TableCell>
								<TableCell>{category.name}</TableCell>
								<TableCell className="text-right">
									<div className="flex justify-end gap-2">
										<EditCategoryForm
											category={category}
											onCategoryUpdated={handleCategoryUpdated}
										/>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleDelete(category.id)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
}
