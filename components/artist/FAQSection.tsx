"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQ {
	question: string;
	answer: string;
}

interface FAQSectionProps {
	faqs?: FAQ[];
}

export function FAQSection({ faqs }: FAQSectionProps) {
	const [openIndex, setOpenIndex] = useState<number | null>(null);

	if (!faqs || faqs.length === 0) {
		return null;
	}

	return (
		<div className="bg-white py-8 md:py-12">
			<div className="max-w-7xl mx-auto px-6">
				<h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">FAQS</h2>
				<div className="space-y-2">
					{faqs.map((faq, index) => (
						<div key={index} className="border-b border-gray-200">
							<button
								onClick={() => setOpenIndex(openIndex === index ? null : index)}
								className="w-full flex items-center justify-between py-4 text-left font-semibold hover:text-[#0A23F0] transition-colors"
							>
								<span>{faq.question}</span>
								<ChevronDown
									className={`size-5 text-gray-400 transition-transform ${
										openIndex === index ? "rotate-180" : ""
									}`}
								/>
							</button>
							{openIndex === index && (
								<div className="pb-4 text-gray-700">{faq.answer}</div>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
