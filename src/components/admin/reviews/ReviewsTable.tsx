import { actions } from 'astro:actions';
import { Trash2, Star, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

type Review = {
	id: number;
	productId: number;
	userId: string;
	rating: number;
	createdAt: Date;
	product: {
		id: number;
		name: string;
	} | null;
	user: {
		id: string;
		name: string;
		email: string;
	} | null;
};

interface ReviewsTableProps {
	initialReviews: Review[];
	totalReviews: number;
}

export default function ReviewsTable({
	initialReviews,
	totalReviews: initialTotalReviews,
}: ReviewsTableProps) {
	const [reviews, setReviews] = useState<Review[]>(initialReviews);
	const [isLoading, setIsLoading] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
	const [sortBy, setSortBy] = useState<'createdAt' | 'rating' | 'productId'>(
		'createdAt',
	);
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
	const [currentPage, setCurrentPage] = useState(1);
	const [totalReviews, setTotalReviews] = useState(initialTotalReviews);

	const itemsPerPage = 20;
	const totalPages = Math.ceil(totalReviews / itemsPerPage);

	const fetchReviews = async (
		page: number,
		sort: typeof sortBy,
		order: typeof sortOrder,
	) => {
		setIsLoading(true);
		try {
			const { data, error } = await actions.admin.reviews.getReviews({
				limit: itemsPerPage,
				offset: (page - 1) * itemsPerPage,
				sortBy: sort,
				sortOrder: order,
			});

			if (!error && data) {
				setReviews(data.data || []);
				setTotalReviews(data.total || 0);
			}
		} catch (error) {
			console.error('Error fetching reviews:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSort = (field: typeof sortBy) => {
		const newOrder = sortBy === field && sortOrder === 'desc' ? 'asc' : 'desc';
		setSortBy(field);
		setSortOrder(newOrder);
		setCurrentPage(1);
		fetchReviews(1, field, newOrder);
	};

	const handlePageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= totalPages) {
			setCurrentPage(newPage);
			fetchReviews(newPage, sortBy, sortOrder);
		}
	};

	const handleDeleteReview = async () => {
		if (!reviewToDelete) return;

		setIsLoading(true);
		try {
			const { error } = await actions.admin.reviews.deleteReview({
				reviewId: reviewToDelete.id,
			});

			if (!error) {
				setDeleteDialogOpen(false);
				setReviewToDelete(null);
				await fetchReviews(currentPage, sortBy, sortOrder);
			} else {
				alert(error.message || 'Failed to delete review');
			}
		} catch (error) {
			alert('An error occurred while deleting the review');
		} finally {
			setIsLoading(false);
		}
	};

	const getSortIcon = (field: typeof sortBy) => {
		if (sortBy !== field) {
			return <ArrowUpDown className="size-3.5 text-muted-foreground" />;
		}
		return sortOrder === 'asc' ? (
			<ArrowUp className="size-3.5 text-primary" />
		) : (
			<ArrowDown className="size-3.5 text-primary" />
		);
	};

	const renderStars = (rating: number) => {
		return (
			<div className="flex items-center gap-1">
				{[1, 2, 3, 4, 5].map((star) => (
					<Star
						key={star}
						className={`size-4 ${
							star <= rating
								? 'fill-yellow-400 text-yellow-400'
								: 'text-muted-foreground'
						}`}
					/>
				))}
				<span className="ml-1 text-sm text-muted-foreground">({rating})</span>
			</div>
		);
	};

	return (
		<div className="space-y-4">
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 gap-2"
									onClick={() => handleSort('productId')}>
									Product
									{getSortIcon('productId')}
								</Button>
							</TableHead>
							<TableHead>User</TableHead>
							<TableHead>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 gap-2"
									onClick={() => handleSort('rating')}>
									Rating
									{getSortIcon('rating')}
								</Button>
							</TableHead>
							<TableHead>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 gap-2"
									onClick={() => handleSort('createdAt')}>
									Created
									{getSortIcon('createdAt')}
								</Button>
							</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center">
									Loading...
								</TableCell>
							</TableRow>
						) : reviews.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="text-center">
									No reviews found
								</TableCell>
							</TableRow>
						) : (
							reviews.map((review) => (
								<TableRow key={review.id}>
									<TableCell>
										{review.product ? (
											<span className="font-medium">{review.product.name}</span>
										) : (
											<span className="text-muted-foreground">
												Product #{review.productId} (deleted)
											</span>
										)}
									</TableCell>
									<TableCell>
										{review.user ? (
											<div className="flex flex-col">
												<span className="font-medium">{review.user.name}</span>
												<span className="text-xs text-muted-foreground">
													{review.user.email}
												</span>
											</div>
										) : (
											<span className="text-muted-foreground">
												User (deleted)
											</span>
										)}
									</TableCell>
									<TableCell>{renderStars(review.rating)}</TableCell>
									<TableCell>
										{new Date(review.createdAt).toLocaleDateString()}
									</TableCell>
									<TableCell className="text-right">
										<Button
											variant="ghost"
											size="sm"
											type="button"
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												setReviewToDelete(review);
												setDeleteDialogOpen(true);
											}}
											title="Delete Review">
											<Trash2 className="size-4 text-destructive" />
										</Button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex items-center justify-between">
					<div className="text-sm text-muted-foreground">
						Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
						{Math.min(currentPage * itemsPerPage, totalReviews)} of{' '}
						{totalReviews} reviews
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => handlePageChange(currentPage - 1)}
							disabled={currentPage === 1 || isLoading}>
							Previous
						</Button>
						<div className="text-sm">
							Page {currentPage} of {totalPages}
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => handlePageChange(currentPage + 1)}
							disabled={currentPage === totalPages || isLoading}>
							Next
						</Button>
					</div>
				</div>
			)}

			{/* Delete Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Review</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this review? This action cannot be
							undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteReview}
							disabled={isLoading}>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
