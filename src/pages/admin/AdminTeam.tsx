import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Mail, UserX, UserCheck, RefreshCw, X, Copy, Send } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";

export default function AdminTeam() {
  const teamMembers = useQuery(api.team.getTeamMembers);
  const invitations = useQuery(api.team.getTeamInvitations);
  const roles = useQuery(api.roles.getAllRoles);
  const inviteTeamMember = useMutation(api.team.inviteTeamMember);
  const updateTeamMemberRole = useMutation(api.team.updateTeamMemberRole);
  const deactivateTeamMember = useMutation(api.team.deactivateTeamMember);
  const activateTeamMember = useMutation(api.team.activateTeamMember);
  const removeTeamMember = useMutation(api.team.removeTeamMember);
  const cancelInvitation = useMutation(api.team.cancelInvitation);
  const resendInvitation = useMutation(api.team.resendInvitation);

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  const [inviteForm, setInviteForm] = useState({
    email: "",
    roleId: "" as Id<"roles"> | "",
  });

  const [newRoleId, setNewRoleId] = useState<Id<"roles"> | "">("");

  const handleInvite = async () => {
    if (!inviteForm.email || !inviteForm.roleId) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const result = await inviteTeamMember({
        email: inviteForm.email,
        roleId: inviteForm.roleId as Id<"roles">,
      });

      // Copy invitation URL to clipboard
      navigator.clipboard.writeText(result.invitationUrl);

      toast.success("Invitation sent! URL copied to clipboard");
      setIsInviteDialogOpen(false);
      setInviteForm({ email: "", roleId: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation");
    }
  };

  const handleChangeRole = async () => {
    if (!selectedMember || !newRoleId) return;

    try {
      await updateTeamMemberRole({
        userId: selectedMember._id,
        roleId: newRoleId as Id<"roles">,
      });
      toast.success("Role updated successfully");
      setIsChangeRoleDialogOpen(false);
      setSelectedMember(null);
      setNewRoleId("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  const handleDeactivate = async (member: any) => {
    try {
      await deactivateTeamMember({
        userId: member._id,
        reason: "Deactivated by admin",
      });
      toast.success("Team member deactivated");
    } catch (error: any) {
      toast.error(error.message || "Failed to deactivate member");
    }
  };

  const handleActivate = async (member: any) => {
    try {
      await activateTeamMember({ userId: member._id });
      toast.success("Team member activated");
    } catch (error: any) {
      toast.error(error.message || "Failed to activate member");
    }
  };

  const handleRemove = async () => {
    if (!selectedMember) return;

    try {
      await removeTeamMember({ userId: selectedMember._id });
      toast.success("Team member removed");
      setIsRemoveDialogOpen(false);
      setSelectedMember(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to remove member");
    }
  };

  const handleCancelInvitation = async (invitationId: Id<"teamInvitations">) => {
    try {
      await cancelInvitation({ invitationId });
      toast.success("Invitation cancelled");
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel invitation");
    }
  };

  const handleResendInvitation = async (invitationId: Id<"teamInvitations">) => {
    try {
      const result = await resendInvitation({ invitationId });
      navigator.clipboard.writeText(result.invitationUrl);
      toast.success("Invitation resent! URL copied to clipboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend invitation");
    }
  };

  const openChangeRoleDialog = (member: any) => {
    setSelectedMember(member);
    setNewRoleId(member.roleId || "");
    setIsChangeRoleDialogOpen(true);
  };

  const openRemoveDialog = (member: any) => {
    setSelectedMember(member);
    setIsRemoveDialogOpen(true);
  };

  if (!teamMembers || !invitations || !roles) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingInvitations = invitations.filter((inv) => inv.status === "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">
            Manage team members and invitations
          </p>
        </div>
        <Button onClick={() => setIsInviteDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Invite Team Member
        </Button>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {teamMembers.length} active team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member._id}>
                  <TableCell className="font-medium">
                    {member.name || "No name"}
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {member.roleInfo?.name || member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {member.roleInfo?.permissions.length || 0} permissions
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member.suspended ? (
                      <Badge variant="destructive">Deactivated</Badge>
                    ) : (
                      <Badge variant="default">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openChangeRoleDialog(member)}
                      >
                        Change Role
                      </Button>
                      {member.suspended ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleActivate(member)}
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeactivate(member)}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openRemoveDialog(member)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              {pendingInvitations.length} pending invitation(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((invitation) => (
                  <TableRow key={invitation._id}>
                    <TableCell className="font-medium">
                      {invitation.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{invitation.roleName}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(invitation.invitedAt, {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(invitation.expiresAt, {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleResendInvitation(invitation._id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancelInvitation(invitation._id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Invite Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, email: e.target.value })
                }
                placeholder="team@example.com"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={inviteForm.roleId}
                onValueChange={(value) =>
                  setInviteForm({ ...inviteForm, roleId: value as Id<"roles"> })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role._id} value={role._id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsInviteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleInvite}>
              <Mail className="mr-2 h-4 w-4" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog
        open={isChangeRoleDialogOpen}
        onOpenChange={setIsChangeRoleDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedMember?.name || selectedMember?.email}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="new-role">New Role</Label>
            <Select
              value={newRoleId}
              onValueChange={(value) => setNewRoleId(value as Id<"roles">)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role._id} value={role._id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsChangeRoleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleChangeRole}>Update Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              {selectedMember?.name || selectedMember?.email} from the team? They
              will be converted to a regular customer account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
