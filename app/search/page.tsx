"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";
import Link from "next/link";
import {
  Search,
  Calendar,
  MapPin,
  X,
  SlidersHorizontal,
  Grid,
  List,
} from "lucide-react";
import { Header } from "~/components/home/Header";
import { Footer } from "~/components/home/Footer";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { Slider } from "~/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

// Types for search results
interface SearchEvent {
  _id: string;
  title: string;
  slug: string;
  description: string;
  images: string[];
  startTime: number;
  minPrice: number;
  maxPrice: number;
  currency: string;
  status: string;
  genre: string | null;
  venue: {
    _id: string;
    name: string;
    city: string;
    state: string | null;
  };
  artist: {
    _id: string;
    name: string;
    slug: string;
    image: string | null;
  } | null;
  category: {
    _id: string;
    name: string;
    slug: string;
  } | null;
}

interface SearchFilters {
  categories: { _id: string; name: string; slug: string }[];
  cities: string[];
  genres: string[];
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState<Id<"categories"> | null>(
    (searchParams.get("category") as Id<"categories">) || null
  );
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "");
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get("genre") || "");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Queries - cast to proper types
  const filters = useQuery(api.search.getSearchFilters) as SearchFilters | undefined;
  const events = useQuery(api.search.searchEvents, {
    query: searchQuery || undefined,
    categoryId: selectedCategory || undefined,
    city: selectedCity || undefined,
    genre: selectedGenre || undefined,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 50000 ? priceRange[1] : undefined,
    limit: 50,
  }) as SearchEvent[] | undefined;

  const isLoading = events === undefined;

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedCity) params.set("city", selectedCity);
    if (selectedGenre) params.set("genre", selectedGenre);

    const newUrl = params.toString() ? `/search?${params.toString()}` : "/search";
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, selectedCategory, selectedCity, selectedGenre, router]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedCity("");
    setSelectedGenre("");
    setPriceRange([0, 50000]);
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCategory ||
    selectedCity ||
    selectedGenre ||
    priceRange[0] > 0 ||
    priceRange[1] < 50000;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header hideSearch />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Find Events</h1>

          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events, artists, or venues..."
                className="pl-12 h-12 text-lg"
              />
            </div>
            <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-12 gap-2 px-6"
                >
                  <SlidersHorizontal className="size-5" />
                  Filters
                  {hasActiveFilters && (
                    <span className="size-2 bg-[#026cdf] rounded-full" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Filters</h3>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-red-500 hover:text-red-700"
                      >
                        Clear all
                      </Button>
                    )}
                  </div>

                  {/* Category Filter */}
                  <div>
                    <Label>Category</Label>
                    <select
                      value={selectedCategory || ""}
                      onChange={(e) =>
                        setSelectedCategory(
                          e.target.value ? (e.target.value as Id<"categories">) : null
                        )
                      }
                      className="mt-1.5 w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                    >
                      <option value="">All Categories</option>
                      {filters?.categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* City Filter */}
                  <div>
                    <Label>City</Label>
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="mt-1.5 w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                    >
                      <option value="">All Cities</option>
                      {filters?.cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Genre Filter */}
                  <div>
                    <Label>Genre</Label>
                    <select
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                      className="mt-1.5 w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                    >
                      <option value="">All Genres</option>
                      {filters?.genres.map((genre) => (
                        <option key={genre} value={genre}>
                          {genre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <Label>Price Range</Label>
                    <div className="mt-4 px-2">
                      <Slider
                        value={priceRange}
                        onValueChange={(value) =>
                          setPriceRange(value as [number, number])
                        }
                        min={0}
                        max={50000}
                        step={500}
                      />
                      <div className="flex justify-between mt-2 text-sm text-gray-600">
                        <span>{formatCurrency(priceRange[0])}</span>
                        <span>{formatCurrency(priceRange[1])}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setFiltersOpen(false)}
                    className="w-full bg-[#026cdf] hover:bg-[#026cdf]/90"
                  >
                    Apply Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-6">
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#026cdf]/10 text-[#026cdf] rounded-full text-sm">
                &quot;{searchQuery}&quot;
                <button onClick={() => setSearchQuery("")}>
                  <X className="size-3.5" />
                </button>
              </span>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#026cdf]/10 text-[#026cdf] rounded-full text-sm">
                {filters?.categories.find((c) => c._id === selectedCategory)?.name}
                <button onClick={() => setSelectedCategory(null)}>
                  <X className="size-3.5" />
                </button>
              </span>
            )}
            {selectedCity && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#026cdf]/10 text-[#026cdf] rounded-full text-sm">
                {selectedCity}
                <button onClick={() => setSelectedCity("")}>
                  <X className="size-3.5" />
                </button>
              </span>
            )}
            {selectedGenre && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#026cdf]/10 text-[#026cdf] rounded-full text-sm">
                {selectedGenre}
                <button onClick={() => setSelectedGenre("")}>
                  <X className="size-3.5" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {isLoading
              ? "Searching..."
              : `${events?.length || 0} events found`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-[#026cdf]" : ""}
            >
              <Grid className="size-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-[#026cdf]" : ""}
            >
              <List className="size-4" />
            </Button>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-0">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="size-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No events found
              </h3>
              <p className="text-gray-500 mb-6">
                Try adjusting your search or filters
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events?.map((event) => (
              <Link key={event._id} href={`/event/${event.slug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="p-0">
                    <div className="relative h-48 bg-linear-to-br from-[#026cdf] to-[#0052cc]">
                      {event.images?.[0] && (
                        <img
                          src={event.images[0]}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-4">
                        <p className="text-white text-sm font-medium">
                          {formatDate(event.startTime)}
                        </p>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">
                        {event.title}
                      </h3>
                      {event.artist && (
                        <p className="text-sm text-gray-600 mt-1">
                          {event.artist.name}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                        <MapPin className="size-3.5" />
                        {event.venue.name}, {event.venue.city}
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm">
                          <span className="text-gray-500">From </span>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(event.minPrice)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {events?.map((event) => (
              <Link key={event._id} href={`/event/${event.slug}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="w-48 h-32 bg-linear-to-br from-[#026cdf] to-[#0052cc] shrink-0">
                        {event.images?.[0] && (
                          <img
                            src={event.images[0]}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {event.title}
                            </h3>
                            {event.artist && (
                              <p className="text-sm text-gray-600">
                                {event.artist.name}
                              </p>
                            )}
                          </div>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(event.minPrice)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3.5" />
                            {formatDate(event.startTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3.5" />
                            {event.venue.name}, {event.venue.city}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchContent />
    </Suspense>
  );
}

function SearchPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header hideSearch />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-12 w-full mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
