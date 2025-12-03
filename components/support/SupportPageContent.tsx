"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "~/convex/_generated/api";
import Link from "next/link";
import {
  MessageSquare,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Header } from "~/components/home/Header";
import { Footer } from "~/components/home/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Skeleton } from "~/components/ui/skeleton";
import { toast } from "sonner";
import type { FunctionReturnType } from "convex/server";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

const statusColors: Record<TicketStatus, string> = {
  open: "bg-red-100 text-red-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
};

const statusLabels: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

const categoryOptions = [
  { value: "order", label: "Order Issue" },
  { value: "technical", label: "Technical Problem" },
  { value: "refund", label: "Refund Request" },
  { value: "transfer", label: "Ticket Transfer" },
  { value: "other", label: "Other" },
];

interface SupportPageContentProps {
  tickets: FunctionReturnType<typeof api.support.getUserTickets> | undefined;
}

export function SupportPageContent({ tickets }: SupportPageContentProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    category: "other" as "order" | "technical" | "refund" | "transfer" | "other",
    priority: "medium" as "low" | "medium" | "high",
  });

  const createTicket = useMutation(api.support.createTicket);
  const isLoading = tickets === undefined;

  const handleSubmit = async () => {
    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTicket(formData);
      toast.success("Support ticket created successfully");
      setIsCreateOpen(false);
      setFormData({
        subject: "",
        message: "",
        category: "other",
        priority: "medium",
      });
    } catch (error) {
      toast.error("Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support Center</h1>
            <p className="text-gray-500">Get help with your orders and account</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-tm-blue hover:bg-tm-blue-dark gap-2">
                <Plus className="size-4" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Support Ticket</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, subject: e.target.value }))
                    }
                    placeholder="Brief description of your issue"
                    className="mt-1.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: e.target.value as typeof formData.category,
                        }))
                      }
                      className="mt-1.5 w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                    >
                      {categoryOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          priority: e.target.value as typeof formData.priority,
                        }))
                      }
                      className="mt-1.5 w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, message: e.target.value }))
                    }
                    placeholder="Please describe your issue in detail..."
                    rows={5}
                    className="mt-1.5"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    loading={isSubmitting}
                    loadingText="Creating..."
                    className="bg-tm-blue hover:bg-tm-blue-dark"
                  >
                    Create Ticket
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tickets List */}
        {tickets?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="size-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No support tickets
              </h3>
              <p className="text-gray-500 mb-6">
                Need help? Create a support ticket and we&apos;ll get back to you.
              </p>
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="bg-tm-blue hover:bg-tm-blue-dark"
              >
                <Plus className="size-4 mr-2" />
                Create Your First Ticket
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tickets?.map((ticket) => (
              <Link key={ticket._id} href={`/support/${ticket._id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`size-10 rounded-full flex items-center justify-center ${
                          ticket.status === "open"
                            ? "bg-red-100"
                            : ticket.status === "in_progress"
                            ? "bg-yellow-100"
                            : ticket.status === "resolved"
                            ? "bg-green-100"
                            : "bg-gray-100"
                        }`}
                      >
                        {ticket.status === "open" ? (
                          <AlertCircle className="size-5 text-red-600" />
                        ) : ticket.status === "in_progress" ? (
                          <Clock className="size-5 text-yellow-600" />
                        ) : (
                          <CheckCircle className="size-5 text-green-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 truncate">
                            {ticket.subject}
                          </h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              statusColors[ticket.status as TicketStatus]
                            }`}
                          >
                            {statusLabels[ticket.status as TicketStatus]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          <span className="capitalize">{ticket.category}</span> •{" "}
                          {formatDate(ticket.createdAt)}
                        </p>
                      </div>

                      <ChevronRight className="size-5 text-gray-400" />
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
