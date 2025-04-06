import { actions } from 'astro:actions';
import { Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { reviewsTable } from '@/db/schema';

interface ManageReviewProps {
	review?: typeof reviewsTable.$inferSelect;
	productId?: number;
}

function ManageReview({ review: initialReview, productId }: ManageReviewProps) {
	const [review, setReview] = useState(initialReview);
	const [rating, setRating] = useState(initialReview?.rating || 0);
	const [hoveredRating, setHoveredRating] = useState(0);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async () => {
		if (!productId) {
			toast.error('An error occurred');
			return;
		}

		if (!rating) {
			toast.error('Please select a rating');
			return;
		}

		setIsSubmitting(true);
		try {
			if (review) {
				const { data, error } = await actions.reviews.update({
					rating,
				});

				if (error) {
					toast.error('An error occurred');
					throw new Error('Failed to update rating');
				}

				setRating(data.rating);
				setReview(data);

				toast.success('Rating updated successfully');
				window.location.reload();
			} else {
				const { data, error } = await actions.reviews.create({
					productId,
					rating,
				});

				if (error) {
					toast.error('An error occurred');
					throw new Error('Failed to save rating');
				}

				setRating(data.rating);
				setReview(data);

				toast.success('Rating added successfully');
				window.location.reload();
			}
		} catch (error) {
			toast.error('Failed to save rating');
			console.error(error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!review) return;

		try {
			const { error } = await actions.reviews.delete();

			if (error) {
				toast.error('An error occurred');
				throw new Error('Failed to delete rating');
			}

			setReview(undefined);
			setRating(0);

			toast.success('Rating deleted successfully');
			window.location.reload();
		} catch (error) {
			toast.error('Failed to delete rating');
			console.error(error);
		}
	};

	return (
		<div className="space-y-4">
			<h3 className="font-medium text-lg">
				{review ? 'Update Your Rating' : 'Rate This Product'}
			</h3>

			{/* Star Rating */}
			<div className="flex items-center gap-1">
				{[1, 2, 3, 4, 5].map((value) => (
					<button
						key={value}
						type="button"
						onClick={() => setRating(value)}
						onMouseEnter={() => setHoveredRating(value)}
						onMouseLeave={() => setHoveredRating(0)}
						className="p-1 transition-colors"
					>
						<Star
							size={24}
							className={
								value <= (hoveredRating || rating)
									? 'fill-yellow-400 text-yellow-400'
									: 'fill-none text-gray-300'
							}
						/>
					</button>
				))}
				<span className="ml-2 text-sm text-gray-600">
					{rating ? `${rating} out of 5` : 'Select rating'}
				</span>
			</div>

			{/* Action Buttons */}
			<div className="flex gap-2">
				<Button
					onClick={handleSubmit}
					disabled={isSubmitting || !rating}
					className="flex-1"
				>
					{isSubmitting
						? 'Saving...'
						: review
							? 'Update Rating'
							: 'Submit Rating'}
				</Button>
				{review && (
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={isSubmitting}
					>
						Delete
					</Button>
				)}
			</div>
		</div>
	);
}

export default ManageReview;
