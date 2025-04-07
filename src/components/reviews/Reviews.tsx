import { useStore } from '@nanostores/react';
import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { reviewsTable } from '@/db/schema';
import { productReviewsAtom } from '../../store';

type Review = typeof reviewsTable.$inferSelect;

function Reviews({
	productId,
	reviews,
}: {
	productId: number;
	reviews: Review[];
}) {
	const [isFirstLoad, setIsFirstLoad] = useState(true);
	const $productReviews = useStore(productReviewsAtom);
	const [allReviews, setAllReviews] = useState<Review[]>([]);

	if (isFirstLoad) {
		productReviewsAtom.setKey(productId.toString(), reviews);
		setAllReviews(reviews);
		setIsFirstLoad(false);
	}

	useEffect(() => {
		setAllReviews($productReviews[productId]);
	}, [$productReviews, productId]);

	const avgRating =
		allReviews.length > 0
			? allReviews.reduce((acc, review) => acc + review.rating, 0) /
				allReviews.length
			: 0;

	const ratingCounts = {
		1: 0,
		2: 0,
		3: 0,
		4: 0,
		5: 0,
	};
	allReviews.forEach((review) => {
		ratingCounts[review.rating as keyof typeof ratingCounts]++;
	});

	return (
		<div className="space-y-4">
			{/* Average Rating */}
			<div className="flex items-center gap-4">
				<div className="text-4xl font-bold">{avgRating.toFixed(1)}</div>
				<div className="flex items-center">
					{Array.from({ length: 5 }).map((_, i) => (
						<Star
							className={
								i < Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-300'
							}
							size={20}
						/>
					))}
				</div>
				<div className="text-sm text-gray-600">
					{allReviews.length}
					{allReviews.length === 1 ? 'rating' : 'ratings'}
				</div>
			</div>

			{/* Rating Distribution */}
			<div className="space-y-2">
				{[5, 4, 3, 2, 1].map((stars) => (
					<div className="flex items-center gap-2">
						<div className="w-12 text-sm text-gray-600">{stars} stars</div>
						<div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
							<div
								className="h-full bg-yellow-400 rounded-full"
								style={{
									width: `${
										allReviews.length
											? (
													ratingCounts[stars as keyof typeof ratingCounts] /
														allReviews.length
												) * 100
											: 0
									}%`,
								}}
							/>
						</div>
						<div className="w-12 text-sm text-gray-600 text-right">
							{ratingCounts[stars as keyof typeof ratingCounts]}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export default Reviews;
