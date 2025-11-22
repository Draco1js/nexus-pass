"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import Image from "next/image";

interface VIPPackage {
	name: string;
	image?: string;
	description: string[];
}

interface ExperienceSectionProps {
	vipPackages?: VIPPackage[];
}

export function ExperienceSection({ vipPackages }: ExperienceSectionProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

	if (!vipPackages || vipPackages.length === 0) {
		return null;
	}

	const next = () => {
		setCurrentIndex((prev) => (prev + 1) % vipPackages.length);
	};

	const prev = () => {
		setCurrentIndex((prev) => (prev - 1 + vipPackages.length) % vipPackages.length);
	};

	return (
		<div className="bg-white py-8 md:py-12">
			<div className="max-w-7xl mx-auto px-6">
				<h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Experience</h2>

				<div className="relative">
					{/* Carousel */}
					<div className="overflow-hidden">
						<div
							className="flex transition-transform duration-300 ease-in-out"
							style={{ transform: `translateX(-${currentIndex * 100}%)` }}
						>
							{vipPackages.map((pkg, index) => (
								<div key={index} className="min-w-full px-2">
									<div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
										{pkg.image && (
											<div className="relative h-[200px] md:h-[225px] bg-gray-200">
												<Image
													src={pkg.image}
													alt={pkg.name}
													fill
													className="object-cover"
													sizes="(max-width: 768px) 100vw, 400px"
												/>
											</div>
										)}
										<div className="p-4 md:p-6">
											<h3 className="text-xl md:text-2xl font-bold mb-4">{pkg.name}</h3>
											<div className="space-y-2 mb-4">
												{expandedIndex === index
													? pkg.description.map((item, i) => (
															<p key={i} className="text-sm md:text-base text-gray-700">
																{item}
															</p>
													  ))
													: pkg.description.slice(0, 3).map((item, i) => (
															<p key={i} className="text-sm md:text-base text-gray-700">
																{item}
															</p>
													  ))}
											</div>
											<button
												onClick={() =>
													setExpandedIndex(expandedIndex === index ? null : index)
												}
												className="text-[#0A23F0] hover:text-[#0819c7] font-semibold text-sm"
											>
												{expandedIndex === index ? "Show less" : "Read More"}
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Navigation Buttons */}
					{vipPackages.length > 1 && (
						<>
							<Button
								variant="outline"
								size="icon"
								className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white border-2 border-gray-300 hover:border-[#0A23F0] rounded-full size-10 md:size-12 shadow-lg"
								onClick={prev}
								aria-label="Previous experience"
							>
								<ChevronLeft className="size-5 md:size-6" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white border-2 border-gray-300 hover:border-[#0A23F0] rounded-full size-10 md:size-12 shadow-lg"
								onClick={next}
								aria-label="Next experience"
							>
								<ChevronRight className="size-5 md:size-6" />
							</Button>
						</>
					)}

					{/* Dots Indicator */}
					{vipPackages.length > 1 && (
						<div className="flex justify-center gap-2 mt-6">
							{vipPackages.map((_, index) => (
								<button
									key={index}
									onClick={() => setCurrentIndex(index)}
									className={`size-2 rounded-full transition-colors ${
										currentIndex === index ? "bg-[#0A23F0]" : "bg-gray-300"
									}`}
									aria-label={`Go to experience ${index + 1}`}
								/>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

