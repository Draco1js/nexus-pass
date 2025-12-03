"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  MapPin,
  Image as ImageIcon,
  Ticket,
  Check,
  Plus,
  Trash2,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Skeleton } from "~/components/ui/skeleton";
import { toast } from "sonner";

type Step = "details" | "location" | "tickets" | "review";

interface TicketTypeForm {
  id: string;
  name: string;
  description: string;
  price: number;
  fees: number;
  totalQuantity: number;
  minPerOrder: number;
  maxPerOrder: number;
  section: string;
  tier: "general" | "vip" | "premium" | "standing" | "seated";
  benefits: string[];
}

const steps: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: "details", label: "Event Details", icon: Calendar },
  { id: "location", label: "Location & Time", icon: MapPin },
  { id: "tickets", label: "Tickets", icon: Ticket },
  { id: "review", label: "Review", icon: Check },
];

const tierOptions = [
  { value: "general", label: "General Admission" },
  { value: "vip", label: "VIP" },
  { value: "premium", label: "Premium" },
  { value: "standing", label: "Standing" },
  { value: "seated", label: "Seated" },
];

export default function CreateEventPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("details");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "" as Id<"categories"> | "",
    venueId: "" as Id<"venues"> | "",
    images: [] as string[],
    startTime: "",
    endTime: "",
    doorTime: "",
    onSaleStartTime: "",
    onSaleEndTime: "",
    presaleStartTime: "",
    presaleEndTime: "",
    presaleCode: "",
    ageRestriction: "",
    genre: "",
    subGenre: "",
    refundPolicy: "",
    tags: "",
  });

  const [ticketTypes, setTicketTypes] = useState<TicketTypeForm[]>([
    {
      id: "1",
      name: "General Admission",
      description: "",
      price: 1000,
      fees: 100,
      totalQuantity: 100,
      minPerOrder: 1,
      maxPerOrder: 8,
      section: "",
      tier: "general",
      benefits: [],
    },
  ]);

  // Queries
  const categories = useQuery(api.artists.getCategories);
  const venues = useQuery(api.artists.getVenues);

  // Mutations
  const createEvent = useMutation(api.artists.createEvent);
  const createTicketType = useMutation(api.artists.createTicketType);
  const updateEvent = useMutation(api.artists.updateEvent);

  const isLoading = categories === undefined || venues === undefined;

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTicketTypeChange = (
    id: string,
    field: keyof TicketTypeForm,
    value: string | number | string[]
  ) => {
    setTicketTypes((prev) =>
      prev.map((tt) => (tt.id === id ? { ...tt, [field]: value } : tt))
    );
  };

  const addTicketType = () => {
    setTicketTypes((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: "",
        description: "",
        price: 0,
        fees: 0,
        totalQuantity: 100,
        minPerOrder: 1,
        maxPerOrder: 8,
        section: "",
        tier: "general",
        benefits: [],
      },
    ]);
  };

  const removeTicketType = (id: string) => {
    if (ticketTypes.length > 1) {
      setTicketTypes((prev) => prev.filter((tt) => tt.id !== id));
    }
  };

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case "details":
        if (!formData.title.trim()) {
          toast.error("Please enter an event title");
          return false;
        }
        if (!formData.description.trim()) {
          toast.error("Please enter an event description");
          return false;
        }
        if (!formData.categoryId) {
          toast.error("Please select a category");
          return false;
        }
        return true;

      case "location":
        if (!formData.venueId) {
          toast.error("Please select a venue");
          return false;
        }
        if (!formData.startTime) {
          toast.error("Please set a start time");
          return false;
        }
        if (!formData.onSaleStartTime) {
          toast.error("Please set when tickets go on sale");
          return false;
        }
        return true;

      case "tickets":
        for (const tt of ticketTypes) {
          if (!tt.name.trim()) {
            toast.error("All ticket types must have a name");
            return false;
          }
          if (tt.price < 0) {
            toast.error("Ticket price cannot be negative");
            return false;
          }
          if (tt.totalQuantity < 1) {
            toast.error("Ticket quantity must be at least 1");
            return false;
          }
        }
        return true;

      default:
        return true;
    }
  };

  const goToNextStep = () => {
    if (!validateStep(currentStep)) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep("tickets")) return;

    setIsSubmitting(true);

    try {
      // Create the event
      const { eventId, slug } = await createEvent({
        title: formData.title,
        description: formData.description,
        categoryId: formData.categoryId as Id<"categories">,
        venueId: formData.venueId as Id<"venues">,
        images: formData.images,
        startTime: new Date(formData.startTime).getTime(),
        endTime: formData.endTime ? new Date(formData.endTime).getTime() : undefined,
        doorTime: formData.doorTime ? new Date(formData.doorTime).getTime() : undefined,
        onSaleStartTime: new Date(formData.onSaleStartTime).getTime(),
        onSaleEndTime: formData.onSaleEndTime
          ? new Date(formData.onSaleEndTime).getTime()
          : undefined,
        presaleStartTime: formData.presaleStartTime
          ? new Date(formData.presaleStartTime).getTime()
          : undefined,
        presaleEndTime: formData.presaleEndTime
          ? new Date(formData.presaleEndTime).getTime()
          : undefined,
        presaleCode: formData.presaleCode || undefined,
        ageRestriction: formData.ageRestriction || undefined,
        genre: formData.genre || undefined,
        subGenre: formData.subGenre || undefined,
        refundPolicy: formData.refundPolicy || undefined,
        tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });

      // Create ticket types
      for (const tt of ticketTypes) {
        await createTicketType({
          eventId,
          name: tt.name,
          description: tt.description || undefined,
          price: tt.price,
          fees: tt.fees,
          currency: "PKR",
          totalQuantity: tt.totalQuantity,
          minPerOrder: tt.minPerOrder,
          maxPerOrder: tt.maxPerOrder,
          section: tt.section || undefined,
          tier: tt.tier,
          benefits: tt.benefits,
          salesStartTime: new Date(formData.onSaleStartTime).getTime(),
          salesEndTime: formData.onSaleEndTime
            ? new Date(formData.onSaleEndTime).getTime()
            : undefined,
        });
      }

      // Set event to on_sale
      await updateEvent({
        eventId,
        status: "on_sale",
      });

      toast.success("Event created successfully!");
      router.push(`/artist-dashboard/events`);
    } catch (error: any) {
      console.error("Failed to create event:", error);
      
      // Extract error message from ConvexError
      let errorMessage = "Failed to create event. Please try again.";
      
      if (error?.data || error?.message) {
        // ConvexError has error.data or error.message
        const message = error.data || error.message;
        if (typeof message === "string") {
          errorMessage = message;
        } else if (message?.message) {
          errorMessage = message.message;
        }
      }
      
      // Show user-friendly error message
      if (errorMessage.includes("No artist profile linked")) {
        toast.error("No artist profile linked to this account. Please contact support to set up your artist profile.", {
          duration: 5000,
        });
      } else {
        toast.error(errorMessage, {
          duration: 5000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Event</h1>
          <p className="text-gray-500">Set up your new concert or show</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const isCompleted = index < currentStepIndex;

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => {
                  if (isCompleted) setCurrentStep(step.id);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#0A23F0] text-white"
                    : isCompleted
                    ? "bg-green-100 text-green-700 cursor-pointer"
                    : "bg-gray-100 text-gray-400"
                }`}
                disabled={!isCompleted && !isActive}
              >
                {isCompleted ? (
                  <Check className="size-4" />
                ) : (
                  <Icon className="size-4" />
                )}
                <span className="hidden sm:inline text-sm font-medium">
                  {step.label}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 lg:w-16 h-0.5 mx-2 ${
                    isCompleted ? "bg-green-300" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {/* Step 1: Event Details */}
          {currentStep === "details" && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Summer Concert Tour 2025"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell fans about your event..."
                  rows={4}
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoryId">Category *</Label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="mt-1.5 w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                  >
                    <option value="">Select a category</option>
                    {categories?.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="genre">Genre</Label>
                  <Input
                    id="genre"
                    name="genre"
                    value={formData.genre}
                    onChange={handleInputChange}
                    placeholder="e.g., Rock, Pop, Jazz"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g., live music, outdoor, family-friendly"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="ageRestriction">Age Restriction</Label>
                <Input
                  id="ageRestriction"
                  name="ageRestriction"
                  value={formData.ageRestriction}
                  onChange={handleInputChange}
                  placeholder="e.g., 18+, All Ages"
                  className="mt-1.5"
                />
              </div>
            </div>
          )}

          {/* Step 2: Location & Time */}
          {currentStep === "location" && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="venueId">Venue *</Label>
                <select
                  id="venueId"
                  name="venueId"
                  value={formData.venueId}
                  onChange={handleInputChange}
                  className="mt-1.5 w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                >
                  <option value="">Select a venue</option>
                  {venues?.map((venue) => (
                    <option key={venue._id} value={venue._id}>
                      {venue.name} - {venue.city}
                      {venue.state ? `, ${venue.state}` : ""} (Capacity:{" "}
                      {venue.capacity.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Event Start *</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="endTime">Event End</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="doorTime">Doors Open</Label>
                <Input
                  id="doorTime"
                  name="doorTime"
                  type="datetime-local"
                  value={formData.doorTime}
                  onChange={handleInputChange}
                  className="mt-1.5"
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Ticket Sales</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="onSaleStartTime">On Sale Start *</Label>
                    <Input
                      id="onSaleStartTime"
                      name="onSaleStartTime"
                      type="datetime-local"
                      value={formData.onSaleStartTime}
                      onChange={handleInputChange}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="onSaleEndTime">On Sale End</Label>
                    <Input
                      id="onSaleEndTime"
                      name="onSaleEndTime"
                      type="datetime-local"
                      value={formData.onSaleEndTime}
                      onChange={handleInputChange}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Presale (Optional)</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="presaleStartTime">Presale Start</Label>
                    <Input
                      id="presaleStartTime"
                      name="presaleStartTime"
                      type="datetime-local"
                      value={formData.presaleStartTime}
                      onChange={handleInputChange}
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="presaleEndTime">Presale End</Label>
                    <Input
                      id="presaleEndTime"
                      name="presaleEndTime"
                      type="datetime-local"
                      value={formData.presaleEndTime}
                      onChange={handleInputChange}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="presaleCode">Presale Code</Label>
                  <Input
                    id="presaleCode"
                    name="presaleCode"
                    value={formData.presaleCode}
                    onChange={handleInputChange}
                    placeholder="e.g., EARLYBIRD2025"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <Label htmlFor="refundPolicy">Refund Policy</Label>
                <Textarea
                  id="refundPolicy"
                  name="refundPolicy"
                  value={formData.refundPolicy}
                  onChange={handleInputChange}
                  placeholder="Describe your refund policy..."
                  rows={3}
                  className="mt-1.5"
                />
              </div>
            </div>
          )}

          {/* Step 3: Tickets */}
          {currentStep === "tickets" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Ticket Types</h3>
                  <p className="text-sm text-gray-500">
                    Create different ticket tiers for your event
                  </p>
                </div>
                <Button onClick={addTicketType} variant="outline" className="gap-2">
                  <Plus className="size-4" />
                  Add Ticket Type
                </Button>
              </div>

              <div className="space-y-6">
                {ticketTypes.map((tt, index) => (
                  <Card key={tt.id} className="border-2">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Ticket Type {index + 1}
                        </CardTitle>
                        {ticketTypes.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTicketType(tt.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Name *</Label>
                          <Input
                            value={tt.name}
                            onChange={(e) =>
                              handleTicketTypeChange(tt.id, "name", e.target.value)
                            }
                            placeholder="e.g., General Admission"
                            className="mt-1.5"
                          />
                        </div>

                        <div>
                          <Label>Tier</Label>
                          <select
                            value={tt.tier}
                            onChange={(e) =>
                              handleTicketTypeChange(
                                tt.id,
                                "tier",
                                e.target.value as TicketTypeForm["tier"]
                              )
                            }
                            className="mt-1.5 w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                          >
                            {tierOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={tt.description}
                          onChange={(e) =>
                            handleTicketTypeChange(tt.id, "description", e.target.value)
                          }
                          placeholder="Describe what's included..."
                          rows={2}
                          className="mt-1.5"
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label>Price (PKR) *</Label>
                          <Input
                            type="number"
                            value={tt.price}
                            onChange={(e) =>
                              handleTicketTypeChange(
                                tt.id,
                                "price",
                                parseInt(e.target.value) || 0
                              )
                            }
                            min={0}
                            className="mt-1.5"
                          />
                        </div>

                        <div>
                          <Label>Service Fee</Label>
                          <Input
                            type="number"
                            value={tt.fees}
                            onChange={(e) =>
                              handleTicketTypeChange(
                                tt.id,
                                "fees",
                                parseInt(e.target.value) || 0
                              )
                            }
                            min={0}
                            className="mt-1.5"
                          />
                        </div>

                        <div>
                          <Label>Quantity *</Label>
                          <Input
                            type="number"
                            value={tt.totalQuantity}
                            onChange={(e) =>
                              handleTicketTypeChange(
                                tt.id,
                                "totalQuantity",
                                parseInt(e.target.value) || 1
                              )
                            }
                            min={1}
                            className="mt-1.5"
                          />
                        </div>

                        <div>
                          <Label>Max per Order</Label>
                          <Input
                            type="number"
                            value={tt.maxPerOrder}
                            onChange={(e) =>
                              handleTicketTypeChange(
                                tt.id,
                                "maxPerOrder",
                                parseInt(e.target.value) || 1
                              )
                            }
                            min={1}
                            max={20}
                            className="mt-1.5"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Section (Optional)</Label>
                        <Input
                          value={tt.section}
                          onChange={(e) =>
                            handleTicketTypeChange(tt.id, "section", e.target.value)
                          }
                          placeholder="e.g., Floor, Balcony, VIP Area"
                          className="mt-1.5"
                        />
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-600">
                          Total per ticket:{" "}
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(tt.price + tt.fees)}
                          </span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === "review" && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <Info className="size-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800">
                    Review your event details before publishing. Once published,
                    tickets will go on sale at the specified time.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Event Details</h3>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm text-gray-500">Title</dt>
                      <dd className="font-medium">{formData.title || "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Category</dt>
                      <dd className="font-medium">
                        {categories?.find((c) => c._id === formData.categoryId)?.name ||
                          "-"}
                      </dd>
                    </div>
                    <div className="md:col-span-2">
                      <dt className="text-sm text-gray-500">Description</dt>
                      <dd className="font-medium">{formData.description || "-"}</dd>
                    </div>
                  </dl>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-3">Location & Time</h3>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-sm text-gray-500">Venue</dt>
                      <dd className="font-medium">
                        {venues?.find((v) => v._id === formData.venueId)?.name || "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Event Date</dt>
                      <dd className="font-medium">
                        {formData.startTime
                          ? new Date(formData.startTime).toLocaleString()
                          : "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">On Sale</dt>
                      <dd className="font-medium">
                        {formData.onSaleStartTime
                          ? new Date(formData.onSaleStartTime).toLocaleString()
                          : "-"}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-3">
                    Ticket Types ({ticketTypes.length})
                  </h3>
                  <div className="space-y-3">
                    {ticketTypes.map((tt) => (
                      <div
                        key={tt.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{tt.name || "Unnamed"}</p>
                          <p className="text-sm text-gray-500">
                            {tt.totalQuantity} tickets • {tt.tier}
                          </p>
                        </div>
                        <p className="font-semibold">
                          {formatCurrency(tt.price + tt.fees)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goToPreviousStep}
          disabled={currentStepIndex === 0}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Previous
        </Button>

        {currentStep === "review" ? (
          <Button
            onClick={handleSubmit}
            loading={isSubmitting}
            loadingText="Creating..."
            className="bg-[#0A23F0] hover:bg-[#0A23F0]/90 gap-2"
          >
                <Check className="size-4" />
                Create Event
          </Button>
        ) : (
          <Button onClick={goToNextStep} className="bg-[#0A23F0] hover:bg-[#0A23F0]/90 gap-2">
            Next
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

