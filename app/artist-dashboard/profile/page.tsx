"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "~/convex/_generated/api";
import {
  User,
  Globe,
  Instagram,
  Twitter,
  Music,
  Plus,
  Trash2,
  Save,
  Image as ImageIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Skeleton } from "~/components/ui/skeleton";
import { toast } from "sonner";

interface FAQ {
  question: string;
  answer: string;
}

interface VIPPackage {
  name: string;
  image?: string;
  description: string[];
}

export default function ArtistProfilePage() {
  const profile = useQuery(api.artists.getArtistProfile);
  const updateProfile = useMutation(api.artists.updateArtistProfile);
  const createProfile = useMutation(api.artists.createArtistProfile);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    image: "",
    genre: "",
    website: "",
    socialLinks: {
      facebook: "",
      twitter: "",
      instagram: "",
      spotify: "",
    },
  });

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [vipPackages, setVipPackages] = useState<VIPPackage[]>([]);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        bio: profile.bio || "",
        image: profile.image || "",
        genre: profile.genre || "",
        website: profile.website || "",
        socialLinks: {
          facebook: profile.socialLinks?.facebook || "",
          twitter: profile.socialLinks?.twitter || "",
          instagram: profile.socialLinks?.instagram || "",
          spotify: profile.socialLinks?.spotify || "",
        },
      });
      setFaqs(profile.faqs || []);
      setVipPackages(
        profile.vipPackages?.map((pkg) => ({
          ...pkg,
          description: pkg.description || [],
        })) || []
      );
    }
  }, [profile]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value },
    }));
  };

  const addFaq = () => {
    setFaqs((prev) => [...prev, { question: "", answer: "" }]);
  };

  const updateFaq = (index: number, field: keyof FAQ, value: string) => {
    setFaqs((prev) =>
      prev.map((faq, i) => (i === index ? { ...faq, [field]: value } : faq))
    );
  };

  const removeFaq = (index: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  };

  const addVipPackage = () => {
    setVipPackages((prev) => [...prev, { name: "", description: [] }]);
  };

  const updateVipPackage = (
    index: number,
    field: keyof VIPPackage,
    value: string | string[]
  ) => {
    setVipPackages((prev) =>
      prev.map((pkg, i) => (i === index ? { ...pkg, [field]: value } : pkg))
    );
  };

  const removeVipPackage = (index: number) => {
    setVipPackages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        name: formData.name,
        bio: formData.bio,
        image: formData.image || undefined,
        genre: formData.genre || undefined,
        website: formData.website || undefined,
        socialLinks: {
          facebook: formData.socialLinks.facebook || undefined,
          twitter: formData.socialLinks.twitter || undefined,
          instagram: formData.socialLinks.instagram || undefined,
          spotify: formData.socialLinks.spotify || undefined,
        },
        faqs: faqs.filter((f) => f.question && f.answer),
        vipPackages: vipPackages
          .filter((p) => p.name)
          .map((p) => ({
            name: p.name,
            image: p.image,
            description: p.description,
          })),
      });
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      
      // Extract error message from ConvexError
      let errorMessage = "Failed to update profile. Please try again.";
      
      if (error?.data || error?.message) {
        const message = error.data || error.message;
        if (typeof message === "string") {
          errorMessage = message;
        } else if (message?.message) {
          errorMessage = message.message;
        }
      }
      
      toast.error(errorMessage, {
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (profile === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter an artist name");
      return;
    }
    setIsCreating(true);
    try {
      await createProfile({
        name: formData.name,
        bio: formData.bio || undefined,
        image: formData.image || undefined,
        genre: formData.genre || undefined,
        website: formData.website || undefined,
        socialLinks: {
          facebook: formData.socialLinks.facebook || undefined,
          twitter: formData.socialLinks.twitter || undefined,
          instagram: formData.socialLinks.instagram || undefined,
          spotify: formData.socialLinks.spotify || undefined,
        },
      });
      toast.success("Artist profile created successfully!");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Failed to create profile:", error);
      toast.error(
        error?.data || error?.message || "Failed to create profile. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  };

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Artist Profile</h1>
          <p className="text-gray-500">Set up your artist profile to start creating events</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Artist Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1.5"
                placeholder="Enter your artist name"
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="mt-1.5"
                rows={4}
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="genre">Genre</Label>
                <Input
                  id="genre"
                  name="genre"
                  value={formData.genre}
                  onChange={handleInputChange}
                  className="mt-1.5"
                  placeholder="e.g., Rock, Pop, Jazz"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="mt-1.5"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="image">Profile Image URL</Label>
              <Input
                id="image"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                className="mt-1.5"
                placeholder="https://..."
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleCreate}
                disabled={isCreating || !formData.name.trim()}
                className="bg-[#0A23F0] hover:bg-[#0A23F0]/90"
              >
                {isCreating ? "Creating..." : "Create Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Artist Profile</h1>
          <p className="text-gray-500">Manage your public profile information</p>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#0A23F0] hover:bg-[#0A23F0]/90 gap-2"
            >
              {isSaving ? (
                <>
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            Edit Profile
          </Button>
        )}
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-6">
            {/* Profile Image */}
            <div className="shrink-0">
              <div className="size-24 rounded-xl bg-linear-to-br from-tm-blue to-purple-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt={formData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  formData.name.charAt(0)
                )}
              </div>
              {isEditing && (
                <div className="mt-2">
                  <Input
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    placeholder="Image URL"
                    className="text-xs"
                  />
                </div>
              )}
            </div>

            {/* Name and Genre */}
            <div className="flex-1 space-y-4">
              <div>
                <Label>Artist Name</Label>
                {isEditing ? (
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1.5"
                  />
                ) : (
                  <p className="text-lg font-semibold mt-1">{formData.name}</p>
                )}
              </div>

              <div>
                <Label>Genre</Label>
                {isEditing ? (
                  <Input
                    name="genre"
                    value={formData.genre}
                    onChange={handleInputChange}
                    placeholder="e.g., Rock, Pop, Jazz"
                    className="mt-1.5"
                  />
                ) : (
                  <p className="text-gray-600 mt-1">{formData.genre || "-"}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label>Bio</Label>
            {isEditing ? (
              <Textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell fans about yourself..."
                rows={4}
                className="mt-1.5"
              />
            ) : (
              <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                {formData.bio || "No bio added yet."}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-5" />
            Social Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Website</Label>
            {isEditing ? (
              <Input
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://yourwebsite.com"
                className="mt-1.5"
              />
            ) : (
              <p className="text-gray-600 mt-1">
                {formData.website ? (
                  <a
                    href={formData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0A23F0] hover:underline"
                  >
                    {formData.website}
                  </a>
                ) : (
                  "-"
                )}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <Instagram className="size-4" />
                Instagram
              </Label>
              {isEditing ? (
                <Input
                  value={formData.socialLinks.instagram}
                  onChange={(e) =>
                    handleSocialLinkChange("instagram", e.target.value)
                  }
                  placeholder="@username"
                  className="mt-1.5"
                />
              ) : (
                <p className="text-gray-600 mt-1">
                  {formData.socialLinks.instagram || "-"}
                </p>
              )}
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Twitter className="size-4" />
                Twitter
              </Label>
              {isEditing ? (
                <Input
                  value={formData.socialLinks.twitter}
                  onChange={(e) =>
                    handleSocialLinkChange("twitter", e.target.value)
                  }
                  placeholder="@username"
                  className="mt-1.5"
                />
              ) : (
                <p className="text-gray-600 mt-1">
                  {formData.socialLinks.twitter || "-"}
                </p>
              )}
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Music className="size-4" />
                Spotify
              </Label>
              {isEditing ? (
                <Input
                  value={formData.socialLinks.spotify}
                  onChange={(e) =>
                    handleSocialLinkChange("spotify", e.target.value)
                  }
                  placeholder="Spotify artist URL"
                  className="mt-1.5"
                />
              ) : (
                <p className="text-gray-600 mt-1">
                  {formData.socialLinks.spotify || "-"}
                </p>
              )}
            </div>

            <div>
              <Label>Facebook</Label>
              {isEditing ? (
                <Input
                  value={formData.socialLinks.facebook}
                  onChange={(e) =>
                    handleSocialLinkChange("facebook", e.target.value)
                  }
                  placeholder="Facebook page URL"
                  className="mt-1.5"
                />
              ) : (
                <p className="text-gray-600 mt-1">
                  {formData.socialLinks.facebook || "-"}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>FAQs</CardTitle>
          {isEditing && (
            <Button onClick={addFaq} variant="outline" size="sm" className="gap-2">
              <Plus className="size-4" />
              Add FAQ
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {faqs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No FAQs added yet.
              {isEditing && " Click 'Add FAQ' to create one."}
            </p>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg space-y-3"
                >
                  {isEditing ? (
                    <>
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <Label>Question</Label>
                          <Input
                            value={faq.question}
                            onChange={(e) =>
                              updateFaq(index, "question", e.target.value)
                            }
                            placeholder="Enter question"
                            className="mt-1.5"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFaq(index)}
                          className="text-red-500 hover:text-red-700 mt-6"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      <div>
                        <Label>Answer</Label>
                        <Textarea
                          value={faq.answer}
                          onChange={(e) =>
                            updateFaq(index, "answer", e.target.value)
                          }
                          placeholder="Enter answer"
                          rows={2}
                          className="mt-1.5"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-gray-900">{faq.question}</p>
                      <p className="text-gray-600">{faq.answer}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* VIP Packages */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>VIP Packages</CardTitle>
          {isEditing && (
            <Button
              onClick={addVipPackage}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Plus className="size-4" />
              Add Package
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {vipPackages.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No VIP packages added yet.
              {isEditing && " Click 'Add Package' to create one."}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vipPackages.map((pkg, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg space-y-3"
                >
                  {isEditing ? (
                    <>
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <Label>Package Name</Label>
                          <Input
                            value={pkg.name}
                            onChange={(e) =>
                              updateVipPackage(index, "name", e.target.value)
                            }
                            placeholder="e.g., Meet & Greet"
                            className="mt-1.5"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVipPackage(index)}
                          className="text-red-500 hover:text-red-700 mt-6"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      <div>
                        <Label>Description (one per line)</Label>
                        <Textarea
                          value={pkg.description.join("\n")}
                          onChange={(e) =>
                            updateVipPackage(
                              index,
                              "description",
                              e.target.value.split("\n")
                            )
                          }
                          placeholder="Enter benefits, one per line"
                          rows={3}
                          className="mt-1.5"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <h4 className="font-semibold text-gray-900">{pkg.name}</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {pkg.description.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-[#0A23F0]">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

