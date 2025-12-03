"use client";

import { useState } from "react";
import { Star, ChevronDown, Trash2, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";
import { format } from "date-fns";
import { authClient } from "~/lib/auth-client";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";

interface ReviewsSectionProps {
	artistId: Id<"artists">;
}

export function ReviewsSection({ artistId }: ReviewsSectionProps) {
	const { data: session } = authClient.useSession();
	const reviewsData = useQuery(api.events.getArtistReviews, { artistId });
	const createReview = useMutation(api.reviews.createReview);
	const deleteReview = useMutation(api.reviews.deleteReview);

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [rating, setRating] = useState(5);
	const [title, setTitle] = useState("");
	const [comment, setComment] = useState("");
	const [venueName, setVenueName] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isRedirecting, setIsRedirecting] = useState(false);
	const [deletingId, setDeletingId] = useState<Id<"reviews"> | null>(null);

	const handleSubmitReview = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!session?.user || !comment.trim()) return;

		setIsSubmitting(true);
		try {
			await createReview({
				artistId,
				rating,
				title: title.trim() || undefined,
				comment: comment.trim(),
				venueName: venueName.trim() || undefined,
			});
			setIsDialogOpen(false);
			setTitle("");
			setComment("");
			setVenueName("");
			setRating(5);
		} catch (error) {
			console.error("Failed to submit review:", error);
			toast("Failed to submit review. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDeleteReview = async (reviewId: Id<"reviews">) => {
		if (!confirm("Are you sure you want to delete this review?")) return;

		setDeletingId(reviewId);
		try {
			await deleteReview({ reviewId });
		} catch (error) {
			console.error("Failed to delete review:", error);
			toast("Failed to delete review. Please try again.");
		} finally {
			setDeletingId(null);
		}
	};

	if (!reviewsData) {
		return null;
	}

	const { reviews, averageRating, totalReviews } = reviewsData;
	const isLoggedIn = !!session?.user;

	return (
		<div className="bg-white py-8 md:py-12">
			<div className="max-w-7xl mx-auto px-6">
				<div className="flex items-center justify-between mb-6 md:mb-8">
					<div className="flex items-center gap-4">
						<h2 className="text-2xl md:text-3xl font-bold">
							Reviews<span className="ml-2 text-lg md:text-xl font-normal text-gray-600">{totalReviews}</span>
						</h2>
						<div className="flex items-center gap-2">
							<Star className="size-5 fill-yellow-400 text-yellow-400" />
							<span className="text-lg font-semibold">{averageRating.toFixed(1)}</span>
							<span className="text-sm text-gray-600">({totalReviews} reviews)</span>
						</div>
					</div>
					{isLoggedIn ? (
						<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
							<DialogTrigger asChild>
								<Button variant="outline" className="hidden md:flex">
									Write a review
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-2xl">
								<DialogHeader>
									<DialogTitle>Write a Review</DialogTitle>
								</DialogHeader>
								<form onSubmit={handleSubmitReview} className="space-y-4">
									<div>
										<Label>Rating</Label>
										<div className="flex items-center gap-2 mt-2">
											{Array.from({ length: 5 }).map((_, i) => (
												<button
													key={i}
													type="button"
													onClick={() => setRating(i + 1)}
													className="focus:outline-none"
												>
													<Star
														className={`size-8 cursor-pointer transition-colors ${
															i < rating
																? "fill-yellow-400 text-yellow-400"
																: "fill-gray-200 text-gray-200"
														}`}
													/>
												</button>
											))}
										</div>
									</div>
									<div>
										<Label htmlFor="title">Title (optional)</Label>
										<Input
											id="title"
											value={title}
											onChange={(e) => setTitle(e.target.value)}
											placeholder="Give your review a title"
											className="mt-2"
										/>
									</div>
									<div>
										<Label htmlFor="comment">Review</Label>
										<Textarea
											id="comment"
											value={comment}
											onChange={(e) => setComment(e.target.value)}
											placeholder="Share your experience..."
											className="mt-2 min-h-[120px]"
											required
										/>
									</div>
									<div>
										<Label htmlFor="venue">Venue (optional)</Label>
										<Input
											id="venue"
											value={venueName}
											onChange={(e) => setVenueName(e.target.value)}
											placeholder="e.g., Arts Council - Karachi"
											className="mt-2"
										/>
									</div>
									<div className="flex justify-end gap-2">
										<Button
											type="button"
											variant="outline"
											onClick={() => setIsDialogOpen(false)}
										>
											Cancel
										</Button>
										<Button 
											type="submit" 
											disabled={!comment.trim()}
											loading={isSubmitting}
											loadingText="Submitting..."
										>
											Submit Review
										</Button>
									</div>
								</form>
							</DialogContent>
						</Dialog>
					) : (
						<Button
							variant="outline"
							className="hidden md:flex"
							loading={isRedirecting}
							loadingText="Redirecting..."
							onClick={() => {
								setIsRedirecting(true);
								window.location.href = "/login";
							}}
						>
							Write a review
						</Button>
					)}
				</div>

				{reviews.length > 0 ? (
					<>
						<ul className="space-y-6">
							{reviews.slice(0, 10).map((review) => (
								<li key={review._id} className="border-b border-gray-200 pb-6 last:border-b-0">
									<div className="flex items-start justify-between gap-4">
										<div className="flex-1">
											<div className="flex items-start gap-2 mb-2">
												{Array.from({ length: 5 }).map((_, i) => (
													<Star
														key={i}
														className={`size-4 ${
															i < review.rating
																? "fill-yellow-400 text-yellow-400"
																: "fill-gray-200 text-gray-200"
														}`}
													/>
												))}
											</div>
											{review.title && (
												<h3 className="text-lg md:text-xl font-bold mb-2">{review.title}</h3>
											)}
											<p className="text-sm text-gray-600 mb-3">
												by <span className="font-semibold">{review.userName || "Anonymous"}</span> on{" "}
												<span>{format(new Date(review.createdAt), "MM/dd/yy")}</span>
												{review.venueName && <span className="ml-2">{review.venueName}</span>}
											</p>
											<p className="text-gray-700">{review.comment}</p>
										</div>
										{review.canDelete && (
											<button
												onClick={() => handleDeleteReview(review._id)}
												disabled={deletingId === review._id}
												className="text-gray-400 hover:text-red-600 transition-colors p-1 shrink-0"
												aria-label="Delete review"
											>
												<Trash2 className="size-4" />
											</button>
										)}
									</div>
								</li>
							))}
						</ul>

						{reviews.length > 10 && (
							<div className="mt-8 text-center">
								<Button variant="outline" size="lg">
									More Reviews
									<ChevronDown className="size-4 ml-2" />
								</Button>
							</div>
						)}
					</>
				) : (
					<div className="text-center py-8">
						<p className="text-gray-600 mb-4">No reviews yet. Be the first to write one!</p>
					</div>
				)}
			</div>
		</div>
	);
}
