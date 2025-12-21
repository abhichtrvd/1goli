import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, Loader2, Search, Star, AlertTriangle, MoreHorizontal, Reply, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminReviews() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [reviewToDelete, setReviewToDelete] = useState<Id<"reviews"> | null>(null);
  const [activeTab, setActiveTab] = useState("pending");
  
  // Reply state
  const [replyReviewId, setReplyReviewId] = useState<Id<"reviews"> | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const reviews = useQuery(api.reviews.getAllReviews, { 
    status: activeTab === "all" ? undefined : activeTab 
  });
  
  const deleteReview = useMutation(api.reviews.deleteReview);
  const dismissReports = useMutation(api.reviews.dismissReports);
  const replyToReview = useMutation(api.reviews.replyToReview);
  const updateStatus = useMutation(api.reviews.updateReviewStatus);

  const filteredReviews = reviews?.filter((review) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (
      review.productName.toLowerCase().includes(searchLower) ||
      review.userName.toLowerCase().includes(searchLower) ||
      review.comment?.toLowerCase().includes(searchLower) ||
      review.title?.toLowerCase().includes(searchLower)
    );

    // Status filter is now handled by the query/tabs mostly, but we keep this for extra filtering if needed
    const matchesStatus = statusFilter === "all" 
      ? true 
      : statusFilter === "reported" 
        ? review.reportCount > 0 
        : review.reportCount === 0;

    const matchesRating = ratingFilter === "all"
      ? true
      : review.rating === parseInt(ratingFilter);

    return matchesSearch && matchesStatus && matchesRating;
  });

  const handleStatusUpdate = async (reviewId: Id<"reviews">, newStatus: "approved" | "rejected" | "pending") => {
    try {
      await updateStatus({ reviewId, status: newStatus });
      toast.success(`Review ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!reviewToDelete) return;
    try {
      await deleteReview({ reviewId: reviewToDelete });
      toast.success("Review deleted");
    } catch (error) {
      toast.error("Failed to delete review");
    } finally {
      setReviewToDelete(null);
    }
  };

  const handleDismissReports = async (reviewId: Id<"reviews">) => {
    try {
      await dismissReports({ reviewId });
      toast.success("Reports dismissed");
    } catch (error) {
      toast.error("Failed to dismiss reports");
    }
  };

  const handleReply = async () => {
    if (!replyReviewId || !replyText.trim()) return;
    
    setIsSubmittingReply(true);
    try {
      await replyToReview({ reviewId: replyReviewId, reply: replyText });
      toast.success("Reply posted successfully");
      setReplyReviewId(null);
      setReplyText("");
    } catch (error) {
      toast.error("Failed to post reply");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const openReplyDialog = (review: any) => {
    setReplyReviewId(review._id);
    setReplyText(review.adminReply || "");
  };

  if (reviews === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reviews & Moderation</h1>
          <p className="text-muted-foreground">Manage product reviews and handle reports.</p>
        </div>
      </div>

      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Pending
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" /> Rejected
          </TabsTrigger>
          <TabsTrigger value="all">All Reviews</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reviews..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select value={ratingFilter} onValueChange={setRatingFilter}>
            <SelectTrigger className="w-[150px]">
              <Star className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="w-[400px]">Review</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReviews?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  No reviews found.
                </TableCell>
              </TableRow>
            ) : (
              filteredReviews?.map((review) => (
                <TableRow key={review._id}>
                  <TableCell className="font-medium">{review.productName}</TableCell>
                  <TableCell>{review.userName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {review.rating} <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{review.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{review.comment}</p>
                      {review.adminReply && (
                        <div className="mt-2 p-2 bg-secondary/50 rounded text-xs border-l-2 border-primary">
                          <span className="font-semibold text-primary">Admin Reply:</span> {review.adminReply}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {review.status === "pending" && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 w-fit">Pending</Badge>
                      )}
                      {review.status === "approved" && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 w-fit">Approved</Badge>
                      )}
                      {review.status === "rejected" && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 w-fit">Rejected</Badge>
                      )}
                      {(!review.status) && (
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 w-fit">Legacy</Badge>
                      )}
                      
                      {review.reportCount > 0 && (
                        <Badge variant="destructive" className="gap-1 w-fit">
                          <AlertTriangle className="h-3 w-3" /> {review.reportCount} Reports
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(review._creationTime).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {review.status !== "approved" && (
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleStatusUpdate(review._id, "approved")} title="Approve">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {review.status !== "rejected" && (
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleStatusUpdate(review._id, "rejected")} title="Reject">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openReplyDialog(review)}>
                            <Reply className="mr-2 h-4 w-4" /> {review.adminReply ? "Edit Reply" : "Reply"}
                          </DropdownMenuItem>
                          {review.reportCount > 0 && (
                            <DropdownMenuItem onClick={() => handleDismissReports(review._id)}>
                              <ShieldCheck className="mr-2 h-4 w-4" /> Dismiss Reports
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => setReviewToDelete(review._id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Review
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!reviewToDelete} onOpenChange={(open) => !open && setReviewToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reply Dialog */}
      <Dialog open={!!replyReviewId} onOpenChange={(open) => !open && setReplyReviewId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Review</DialogTitle>
            <DialogDescription>
              Your reply will be visible publicly on the product page.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Write your reply here..." 
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyReviewId(null)}>Cancel</Button>
            <Button onClick={handleReply} disabled={isSubmittingReply || !replyText.trim()}>
              {isSubmittingReply && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}