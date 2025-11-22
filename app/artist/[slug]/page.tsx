"use client";

import { useQuery } from "convex/react";
import { api } from "~/convex/_generated/api";
import { Header } from "~/components/home/Header";
import { Footer } from "~/components/home/Footer";
import { ArtistHero } from "~/components/artist/ArtistHero";
import { ArtistNavigation } from "~/components/artist/ArtistNavigation";
import { ConcertsList } from "~/components/artist/ConcertsList";
import { ExperienceSection } from "~/components/artist/ExperienceSection";
import { AboutSection } from "~/components/artist/AboutSection";
import { ReviewsSection } from "~/components/artist/ReviewsSection";
import { FansAlsoViewed } from "~/components/artist/FansAlsoViewed";
import { FAQSection } from "~/components/artist/FAQSection";
import { NewsSection } from "~/components/artist/NewsSection";
import { useParams } from "next/navigation";
import { Skeleton } from "~/components/ui/skeleton";

export default function ArtistPage() {
	const params = useParams();
	const slug = params.slug as string;
	const data = useQuery(api.events.getArtistBySlug, { slug });
	const isLoading = data === undefined;

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50">
				<Header />
				<div className="min-h-[400px] bg-gray-200">
					<Skeleton className="w-full h-full" />
				</div>
				<div className="px-6 py-8">
					<Skeleton className="h-96 w-full" />
				</div>
				<Footer />
			</div>
		);
	}

	if (!data) {
		return (
			<div className="min-h-screen bg-gray-50">
				<Header />
				<div className="px-6 py-12 text-center">
					<h1 className="text-2xl font-bold mb-4">Artist not found</h1>
					<p className="text-gray-600">The artist you&apos;re looking for doesn&apos;t exist.</p>
				</div>
				<Footer />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<Header />
			<ArtistHero artist={data} />
			<ArtistNavigation
				hasSetlists={false}
				hasNews={!!data.news && data.news.length > 0}
				hasFaqs={!!data.faqs && data.faqs.length > 0}
			/>
			<main id="main-content">
				<div id="concerts">
					<ConcertsList events={data.events} />
				</div>
				<div id="experience">
					<ExperienceSection vipPackages={data.vipPackages} />
				</div>
				<div id="about">
					<AboutSection artist={data} />
				</div>
				<div id="setlists">
					{/* Setlists section - placeholder for now */}
				</div>
				<div id="news">
					<NewsSection news={data.news} />
				</div>
				<div id="faqs">
					<FAQSection faqs={data.faqs} />
				</div>
				<div id="reviews">
					<ReviewsSection artistId={data._id} />
				</div>
				<div id="fans-also-viewed">
					<FansAlsoViewed currentArtistId={data._id} />
				</div>
			</main>
			<Footer />
		</div>
	);
}

