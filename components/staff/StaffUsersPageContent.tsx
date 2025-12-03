"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "~/convex/_generated/api";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { Id } from "~/convex/_generated/dataModel";
import {
  Users,
  Search,
  Shield,
  User,
  Music,
  Mail,
  CheckCircle,
  XCircle,
  Ticket,
  Ban,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { toast } from "sonner";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";

type UsersQuery = typeof api.staff.getUsers;

interface StaffUsersPageContentProps {
  preloadedUsers: Preloaded<UsersQuery>;
}

const roleIcons = {
  customer: User,
  artist: Music,
  staff: Shield,
};

const roleColors = {
  customer: "bg-blue-100 text-blue-700",
  artist: "bg-purple-100 text-purple-700",
  staff: "bg-orange-100 text-orange-700",
};

export function StaffUsersPageContent({
  preloadedUsers,
}: StaffUsersPageContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState("");

  const users = usePreloadedQuery(preloadedUsers);
  const updateUserRole = useMutation(api.staff.updateUserRole);
  const revokeTicket = useMutation(api.staff.revokeTicket);
  const userTickets = useQuery(
    api.staff.getUserTicketsForStaff,
    selectedUser ? { userId: selectedUser as Id<"users"> } : "skip"
  );

  const filteredUsers = users?.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedUserData = filteredUsers?.find((u) => u._id === selectedUser);

  const handleRoleUpdate = async (
    userId: Id<"users">,
    role: "customer" | "artist" | "staff"
  ) => {
    try {
      await updateUserRole({ userId, role });
      toast.success("User role updated");
    } catch (error) {
      toast.error("Failed to update user role");
    }
  };

  const handleRevokeTicket = async () => {
    if (!revokeReason.trim()) {
      toast.error("Please provide a reason for revocation");
      return;
    }
    if (!selectedTicketId) return;

    try {
      await revokeTicket({
        ticketId: selectedTicketId as Id<"tickets">,
        reason: revokeReason,
      });
      toast.success("Ticket revoked successfully");
      setRevokeReason("");
      setSelectedTicketId(null);
      setShowRevokeDialog(false);
    } catch (error) {
      toast.error("Failed to revoke ticket");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: currency || "PKR",
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500">Manage user accounts and roles</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          <Button
            variant={roleFilter === undefined ? "default" : "outline"}
            onClick={() => setRoleFilter(undefined)}
            size="sm"
            className={
              roleFilter === undefined ? "bg-orange-500 hover:bg-orange-600" : ""
            }
          >
            All
          </Button>
          {(["customer", "artist", "staff"] as const).map((role) => {
            const Icon = roleIcons[role];
            return (
              <Button
                key={role}
                variant={roleFilter === role ? "default" : "outline"}
                onClick={() => setRoleFilter(role)}
                size="sm"
                className={
                  roleFilter === role ? "bg-orange-500 hover:bg-orange-600" : ""
                }
              >
                <Icon className="size-4 mr-1" />
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Users List */}
      {filteredUsers?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="size-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No users found
            </h3>
            <p className="text-gray-500">
              {searchQuery || roleFilter
                ? "Try adjusting your filters"
                : "No users have been registered yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers?.map((user) => {
            const RoleIcon = roleIcons[user.role as keyof typeof roleIcons];
            return (
              <Card
                key={user._id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedUser(user._id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {user.name}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="size-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                        roleColors[user.role as keyof typeof roleColors] ||
                        roleColors.customer
                      }`}
                    >
                      <RoleIcon className="size-3" />
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                    {user.emailVerified ? (
                      <CheckCircle className="size-4 text-green-500" />
                    ) : (
                      <XCircle className="size-4 text-gray-400" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User</DialogTitle>
          </DialogHeader>

          {selectedUserData && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedUserData.name}
                </h2>
                <p className="text-gray-500">{selectedUserData.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["customer", "artist", "staff"] as const).map((role) => {
                    const RoleIcon = roleIcons[role];
                    return (
                      <Button
                        key={role}
                        variant={
                          selectedUserData.role === role ? "default" : "outline"
                        }
                        onClick={() =>
                          handleRoleUpdate(
                            selectedUserData._id as Id<"users">,
                            role
                          )
                        }
                        className={
                          selectedUserData.role === role
                            ? "bg-orange-500 hover:bg-orange-600"
                            : ""
                        }
                        size="sm"
                      >
                        <RoleIcon className="size-4 mr-1" />
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* User Tickets */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Tickets ({userTickets?.length || 0})
                </label>
                {userTickets === undefined ? (
                  <div className="text-sm text-gray-500">Loading tickets...</div>
                ) : userTickets.length === 0 ? (
                  <div className="text-sm text-gray-500">No tickets found</div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                    {userTickets.map((ticket: any) => (
                      <div
                        key={ticket._id}
                        className="flex items-start justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Ticket className="size-4 text-gray-400" />
                            <span className="text-sm font-medium">
                              #{ticket.ticketNumber}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                ticket.status === "valid"
                                  ? "bg-green-100 text-green-700"
                                  : ticket.status === "revoked"
                                  ? "bg-red-100 text-red-700"
                                  : ticket.status === "used"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {ticket.status}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 truncate">
                            {ticket.event?.title || "Unknown event"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {ticket.venue?.name} • {formatDate(ticket.event?.startTime || 0)}
                          </p>
                          {ticket.price && (
                            <p className="text-xs font-medium text-gray-700 mt-1">
                              {formatCurrency(ticket.price, ticket.order?.currency || "PKR")}
                            </p>
                          )}
                          {ticket.revocationReason && (
                            <p className="text-xs text-red-600 mt-1">
                              Revoked: {ticket.revocationReason}
                            </p>
                          )}
                        </div>
                        {ticket.status === "valid" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTicketId(ticket._id);
                              setShowRevokeDialog(true);
                            }}
                            className="text-red-600 hover:bg-red-50 ml-2"
                          >
                            <Ban className="size-3 mr-1" />
                            Revoke
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedUser(null);
                    setSelectedTicketId(null);
                  }}
                >
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Ticket Dialog */}
      <Dialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="revokeReason">Reason *</Label>
              <Textarea
                id="revokeReason"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Enter the reason for revoking this ticket..."
                rows={4}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRevokeDialog(false);
                setRevokeReason("");
                setSelectedTicketId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRevokeTicket}
              className="bg-red-600 hover:bg-red-700"
              disabled={!revokeReason.trim()}
            >
              Revoke Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

