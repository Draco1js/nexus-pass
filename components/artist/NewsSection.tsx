"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "~/components/ui/button";
import Image from "next/image";
import Link from "next/link";

interface NewsItem {
	title: string;
	image?: string;
	excerpt: string;
	link?: string;
}

interface NewsSectionProps {
	news?: NewsItem[];
}

export function NewsSection({ news }: NewsSectionProps) {
	const [currentIndex, setCurrentIndex] = useState(0);

	if (!news || news.length === 0) {
		return null;
	}

	const next = () => {
		setCurrentIndex((prev) => (prev + 1) % news.length);
	};

	const prev = () => {
		setCurrentIndex((prev) => (prev - 1 + news.length) % news.length);
	};

	return (
		<div className="bg-white py-8 md:py-12">
			<div className="max-w-7xl mx-auto px-6">
				<h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">News</h2>
				<div className="relative">
					{/* Carousel */}
					<div className="overflow-hidden">
						<div
							className="flex transition-transform duration-300 ease-in-out"
							style={{ transform: `translateX(-${currentIndex * 100}%)` }}
						>
							{news.map((item, index) => (
								<div key={index} className="min-w-full px-2">
									<div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
										{item.image && (
											<div className="relative h-[200px] md:h-[225px] bg-gray-200">
												<Image
													src={item.image}
													alt={item.title}
													fill
													className="object-cover"
													sizes="(max-width: 768px) 100vw, 400px"
												/>
											</div>
										)}
										<div className="p-4 md:p-6">
											<h3 className="text-xl md:text-2xl font-bold mb-2">{item.title}</h3>
											<p className="text-gray-700 mb-4">{item.excerpt}</p>
											{item.link && (
												<Link
													href={item.link}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center gap-2 text-[#0A23F0] hover:text-[#0819c7] font-semibold"
												>
													Read More
													<ExternalLink className="size-4" />
												</Link>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Navigation Buttons */}
					{news.length > 1 && (
						<>
							<Button
								variant="outline"
								size="icon"
								className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white border-2 border-gray-300 hover:border-[#0A23F0] rounded-full size-10 md:size-12 shadow-lg"
								onClick={prev}
								aria-label="Previous news"
							>
								<ChevronLeft className="size-5 md:size-6" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white border-2 border-gray-300 hover:border-[#0A23F0] rounded-full size-10 md:size-12 shadow-lg"
								onClick={next}
								aria-label="Next news"
							>
								<ChevronRight className="size-5 md:size-6" />
							</Button>
						</>
					)}

					{/* Dots Indicator */}
					{news.length > 1 && (
						<div className="flex justify-center gap-2 mt-6">
							{news.map((_, index) => (
								<button
									key={index}
									onClick={() => setCurrentIndex(index)}
									className={`size-2 rounded-full transition-colors ${
										currentIndex === index ? "bg-[#0A23F0]" : "bg-gray-300"
									}`}
									aria-label={`Go to news ${index + 1}`}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

