import { preloadQuery } from "convex/nextjs";
import { api } from "~/convex/_generated/api";
import { ArtistPageContent } from "~/components/artist/ArtistPageContent";
import { Suspense } from "react";
import { Header } from "~/components/home/Header";
import { Footer } from "~/components/home/Footer";
import { Skeleton } from "~/components/ui/skeleton";

function ArtistPageSkeleton() {
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

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Preload artist data on the server
  const preloaded = await preloadQuery(api.events.getArtistBySlug, { slug });

	return (
    <Suspense fallback={<ArtistPageSkeleton />}>
      <ArtistPageContent preloaded={preloaded} />
    </Suspense>
	);
}

