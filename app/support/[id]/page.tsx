"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "~/convex/_generated/api";
import { Id } from "~/convex/_generated/dataModel";
import { ArrowLeft, Send, AlertCircle } from "lucide-react";
import { Header } from "~/components/home/Header";
import { Footer } from "~/components/home/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Skeleton } from "~/components/ui/skeleton";
import { toast } from "sonner";

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

export default function UserTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as Id<"supportTickets">;

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const ticket = useQuery(api.support.getTicket, { ticketId });
  const sendMessage = useMutation(api.support.sendMessage);

  const isLoading = ticket === undefined;

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setIsSending(true);
    try {
      await sendMessage({ ticketId, content: message });
      setMessage("");
      toast.success("Message sent");
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-[400px] w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8 text-center">
          <AlertCircle className="size-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ticket Not Found</h2>
          <p className="text-gray-500 mb-4">
            This support ticket doesn&apos;t exist or you don&apos;t have access.
          </p>
          <Button variant="outline" onClick={() => router.push("/support")}>
            Back to Support
          </Button>
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
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/support")}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
            <p className="text-sm text-gray-500">
              Created {formatDate(ticket.createdAt)}
            </p>
          </div>
          <span
            className={`px-3 py-1.5 text-sm font-medium rounded-full ${
              statusColors[ticket.status as TicketStatus]
            }`}
          >
            {statusLabels[ticket.status as TicketStatus]}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Original Message */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Request</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
              </CardContent>
            </Card>

            {/* Messages Thread */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Conversation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticket.messages.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    Our support team will respond shortly.
                  </p>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {ticket.messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`flex gap-3 ${
                          !msg.isStaffMessage ? "flex-row-reverse" : ""
                        }`}
                      >
                        <div
                          className={`size-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            msg.isStaffMessage
                              ? "bg-[#0A23F0] text-white"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {msg.isStaffMessage ? "S" : "Y"}
                        </div>
                        <div
                          className={`flex-1 max-w-[80%] ${
                            !msg.isStaffMessage ? "text-right" : ""
                          }`}
                        >
                          <div
                            className={`inline-block p-3 rounded-lg ${
                              msg.isStaffMessage
                                ? "bg-[#0A23F0]/10 text-gray-900"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {msg.senderName} • {formatDate(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Box */}
                {ticket.status !== "closed" && (
                  <div className="pt-4 border-t">
                    <Textarea
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="mb-3"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || isSending}
                        className="bg-[#0A23F0] hover:bg-[#0A23F0]/90 gap-2"
                      >
                        {isSending ? (
                          <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send className="size-4" />
                        )}
                        Send Message
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {ticket.category}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <p
                    className={`font-medium capitalize ${
                      ticket.priority === "high"
                        ? "text-red-600"
                        : ticket.priority === "medium"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }`}
                  >
                    {ticket.priority}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(ticket.updatedAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

