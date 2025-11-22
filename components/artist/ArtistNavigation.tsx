"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "~/components/ui/button";

interface ArtistNavigationProps {
	hasSetlists?: boolean;
	hasNews?: boolean;
	hasFaqs?: boolean;
}

const allSections = [
	{ id: "concerts", label: "Concerts" },
	{ id: "experience", label: "Experience" },
	{ id: "about", label: "About" },
	{ id: "setlists", label: "Setlists" },
	{ id: "news", label: "News" },
	{ id: "faqs", label: "FAQS" },
	{ id: "reviews", label: "Reviews" },
	{ id: "fans-also-viewed", label: "Fans Also Viewed" },
];

export function ArtistNavigation({ hasSetlists = false, hasNews = false, hasFaqs = false }: ArtistNavigationProps) {
	const sections = useMemo(() => {
		return allSections.filter((section) => {
			if (section.id === "setlists" && !hasSetlists) return false;
			if (section.id === "news" && !hasNews) return false;
			if (section.id === "faqs" && !hasFaqs) return false;
			return true;
		});
	}, [hasSetlists, hasNews, hasFaqs]);
	const [activeSection, setActiveSection] = useState("concerts");

	useEffect(() => {
		const handleScroll = () => {
			const scrollPosition = window.scrollY + 200;

			for (let i = sections.length - 1; i >= 0; i--) {
				const section = document.getElementById(sections[i].id);
				if (section && section.offsetTop <= scrollPosition) {
					setActiveSection(sections[i].id);
					break;
				}
			}
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const scrollToSection = (id: string) => {
		const element = document.getElementById(id);
		if (element) {
			const offset = 100;
			const elementPosition = element.getBoundingClientRect().top;
			const offsetPosition = elementPosition + window.pageYOffset - offset;

			window.scrollTo({
				top: offsetPosition,
				behavior: "smooth",
			});
		}
	};

	return (
		<nav
			aria-label="Artist content navigation"
			className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm"
		>
			<div className="max-w-7xl mx-auto px-6">
				<div className="flex items-center overflow-x-auto scrollbar-hide">
					<ul className="flex items-center gap-1 md:gap-4">
						{sections.map((section) => (
							<li key={section.id}>
								<button
									onClick={() => scrollToSection(section.id)}
									className={`px-3 md:px-4 py-4 text-sm md:text-base font-semibold transition-colors border-b-2 ${
										activeSection === section.id
											? "border-[#0A23F0] text-[#0A23F0]"
											: "border-transparent text-gray-600 hover:text-gray-900"
									}`}
								>
									{section.label}
								</button>
							</li>
						))}
					</ul>
					<button
						className="ml-auto p-2 text-gray-400 hover:text-gray-600 md:hidden"
						aria-label="Scroll to next navigation item"
					>
						<ChevronDown className="size-5 rotate-90" />
					</button>
				</div>
			</div>
		</nav>
	);
}

