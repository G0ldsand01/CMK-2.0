import { actions } from 'astro:actions';
import { Button } from '@/components/ui/button';
import type { reviewsTable } from '@/db/schema';
import { productReviewsAtom } from '@/store';
import { useStore } from '@nanostores/react';
import { Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ManageReviewProps {
	review?: typeof reviewsTable.$inferSelect;
	productId?: number;
}

function ManageReview({ review: initialReview, productId }: ManageReviewProps) {
	if (!productId) {
		toast.error('An error occurred');
		return null;
	}

	const [review, setReview] = useState(initialReview);
	const [rating, setRating] = useState(initialReview?.rating || 0);
	const [hoveredRating, setHoveredRating] = useState(0);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const $reviews = useStore(productReviewsAtom);

	const handleSubmit = async () => {
		if (!rating) {
			toast.error('Please select a rating');
			return;
		}

		setIsSubmitting(true);
		try {
			if (review) {
				const { data, error } = await actions.reviews.update({
					productId,
					rating,
				});

				if (error) {
					toast.error('An error occurred');
					throw new Error('Failed to update rating');
				}

				setRating(data.review.rating);
				setReview(data.review);
				productReviewsAtom.setKey(productId.toString(), data.allReviews);

				toast.success('Rating updated successfully');
			} else {
				const { data, error } = await actions.reviews.create({
					productId,
					rating,
				});

				if (error) {
					toast.error('An error occurred');
					throw new Error('Failed to save rating');
				}

				setRating(data.review.rating);
				setReview(data.review);
				productReviewsAtom.setKey(productId.toString(), data.allReviews);

				toast.success('Rating added successfully');
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
			const { data, error } = await actions.reviews.delete({
				productId: productId,
			});

			if (error) {
				toast.error('An error occurred');
				throw new Error('Failed to delete rating');
			}

			setReview(undefined);
			setRating(0);
			productReviewsAtom.setKey(productId.toString(), data.allReviews);

			toast.success('Rating deleted successfully');
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
