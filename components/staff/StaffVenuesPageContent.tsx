"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "~/convex/_generated/api";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { Id } from "~/convex/_generated/dataModel";
import {
  MapPin,
  Search,
  CheckCircle,
  XCircle,
  ExternalLink,
  Phone,
  Mail,
  Users,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { toast } from "sonner";

type VenuesQuery = typeof api.staff.getVenues;
type CitiesQuery = typeof api.events.getCities;

interface StaffVenuesPageContentProps {
  preloadedVenues: Preloaded<VenuesQuery>;
  preloadedCities: Preloaded<CitiesQuery>;
  initialVenueId?: string;
}

export function StaffVenuesPageContent({
  preloadedVenues,
  preloadedCities,
  initialVenueId,
}: StaffVenuesPageContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVerified, setFilterVerified] = useState<boolean | undefined>(
    undefined
  );
  const [selectedVenue, setSelectedVenue] = useState<string | null>(initialVenueId || null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const venues = usePreloadedQuery(preloadedVenues);
  const cities = usePreloadedQuery(preloadedCities) || [];
  const verifyVenue = useMutation(api.staff.verifyVenue);
  const createVenue = useMutation(api.staff.createVenue);

  // Check URL params for venue ID and open modal
  useEffect(() => {
    const venueId = searchParams.get("id") || initialVenueId;
    if (venueId && venues) {
      const venue = venues.find((v) => v._id === venueId);
      if (venue) {
        setSelectedVenue(venueId);
      }
    }
  }, [searchParams, venues, initialVenueId]);

  const filteredVenues = venues?.filter(
    (venue) =>
      venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedVenueData = filteredVenues?.find((v) => v._id === selectedVenue);

  const handleVenueSelect = (venueId: string) => {
    setSelectedVenue(venueId);
    router.replace("/staff/venues?id=" + venueId, { scroll: false });
  };

  const handleVenueClose = () => {
    setSelectedVenue(null);
    router.replace("/staff/venues", { scroll: false });
  };

  const handleVerify = async (venueId: Id<"venues">, verified: boolean) => {
    try {
      await verifyVenue({ venueId, verified });
      toast.success(verified ? "Venue verified successfully" : "Venue unverified");
      handleVenueClose();
    } catch (error) {
      toast.error("Failed to update venue status");
    }
  };

  const handleCreateVenue = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);

    const formData = new FormData(e.currentTarget);
    try {
      await createVenue({
        name: formData.get("name") as string,
        address: formData.get("address") as string,
        city: formData.get("city") as string,
        country: "Pakistan", // Fixed country
        postalCode: formData.get("postalCode") as string || undefined,
        capacity: parseInt(formData.get("capacity") as string),
        venueType: (formData.get("venueType") as any) || undefined,
        phone: formData.get("phone") as string || undefined,
        website: formData.get("website") as string || undefined,
        contactEmail: formData.get("contactEmail") as string || undefined,
        description: formData.get("description") as string || undefined,
        parkingInfo: formData.get("parkingInfo") as string || undefined,
        accessibilityInfo: formData.get("accessibilityInfo") as string || undefined,
        images: [], // Can be enhanced later
        coordinates: undefined,
      });
      toast.success("Venue created successfully");
      setShowCreateDialog(false);
      e.currentTarget.reset();
    } catch (error) {
      toast.error("Failed to create venue");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Venue Management</h1>
          <p className="text-gray-500">Review and verify venue listings</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="size-4 mr-2" />
          Add Venue
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterVerified === undefined ? "default" : "outline"}
            onClick={() => setFilterVerified(undefined)}
            className={
              filterVerified === undefined ? "bg-orange-500 hover:bg-orange-600" : ""
            }
          >
            All
          </Button>
          <Button
            variant={filterVerified === false ? "default" : "outline"}
            onClick={() => setFilterVerified(false)}
            className={
              filterVerified === false ? "bg-orange-500 hover:bg-orange-600" : ""
            }
          >
            Pending
          </Button>
          <Button
            variant={filterVerified === true ? "default" : "outline"}
            onClick={() => setFilterVerified(true)}
            className={
              filterVerified === true ? "bg-orange-500 hover:bg-orange-600" : ""
            }
          >
            Verified
          </Button>
        </div>
      </div>

      {/* Venues List */}
      {filteredVenues?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="size-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No venues found
            </h3>
            <p className="text-gray-500">
              {searchQuery || filterVerified !== undefined
                ? "Try adjusting your filters"
                : "No venues have been added yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVenues?.map((venue) => (
            <Card
              key={venue._id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleVenueSelect(venue._id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{venue.name}</h3>
                    <p className="text-sm text-gray-500">
                      {venue.city}
                      {venue.state ? `, ${venue.state}` : ""}
                    </p>
                  </div>
                  {venue.isVerified ? (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                      <CheckCircle className="size-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                      <XCircle className="size-3" />
                      Pending
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <Users className="size-4" />
                    Capacity: {venue.capacity.toLocaleString()}
                  </p>
                  {venue.venueType && (
                    <p className="capitalize">Type: {venue.venueType}</p>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVenueSelect(venue._id);
                  }}
                >
                  Review Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Venue Detail Dialog */}
      <Dialog open={!!selectedVenue} onOpenChange={handleVenueClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Venue Details</DialogTitle>
          </DialogHeader>

          {selectedVenueData && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedVenueData.name}
                  </h2>
                  <p className="text-gray-500">{selectedVenueData.address}</p>
                  <p className="text-gray-500">{selectedVenueData.city}</p>
                </div>
                {selectedVenueData.isVerified ? (
                  <span className="flex items-center gap-1 text-sm px-3 py-1.5 bg-green-100 text-green-700 rounded-full">
                    <CheckCircle className="size-4" />
                    Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full">
                    <XCircle className="size-4" />
                    Pending Review
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Capacity</p>
                  <p className="text-lg font-semibold">
                    {selectedVenueData.capacity.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="text-lg font-semibold capitalize">
                    {selectedVenueData.venueType || "Not specified"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {selectedVenueData.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="size-4 text-gray-400" />
                    <span>{selectedVenueData.phone}</span>
                  </div>
                )}
                {selectedVenueData.contactEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="size-4 text-gray-400" />
                    <span>{selectedVenueData.contactEmail}</span>
                  </div>
                )}
                {selectedVenueData.website && (
                  <div className="flex items-center gap-3">
                    <ExternalLink className="size-4 text-gray-400" />
                    <a
                      href={selectedVenueData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:underline"
                    >
                      {selectedVenueData.website}
                    </a>
                  </div>
                )}
              </div>

                      <DialogFooter className="gap-2">
                        {selectedVenueData.isVerified ? (
                          <Button
                            variant="outline"
                            onClick={() =>
                              handleVerify(selectedVenueData._id as Id<"venues">, false)
                            }
                            className="text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="size-4 mr-2" />
                            Remove Verification
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              onClick={handleVenueClose}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() =>
                                handleVerify(selectedVenueData._id as Id<"venues">, true)
                              }
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="size-4 mr-2" />
                              Verify Venue
                            </Button>
                          </>
                        )}
                      </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Venue Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Venue</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateVenue} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Venue Name *</Label>
                <Input id="name" name="name" required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="capacity">Capacity *</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  required
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Input id="address" name="address" required className="mt-1.5" />
            </div>

            <div>
              <Label htmlFor="city">City *</Label>
              <select
                id="city"
                name="city"
                required
                className="mt-1.5 w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
              >
                <option value="">Select a city</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="venueType">Venue Type</Label>
              <select
                id="venueType"
                name="venueType"
                className="mt-1.5 w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
              >
                <option value="">Select type</option>
                <option value="theatre">Theatre</option>
                <option value="fan">Fan/Club</option>
                <option value="stadium">Stadium</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" type="url" className="mt-1.5" />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                className="mt-1.5"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parkingInfo">Parking Info</Label>
                <Textarea
                  id="parkingInfo"
                  name="parkingInfo"
                  className="mt-1.5"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="accessibilityInfo">Accessibility Info</Label>
                <Textarea
                  id="accessibilityInfo"
                  name="accessibilityInfo"
                  className="mt-1.5"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Venue"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

