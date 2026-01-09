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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Search,
  Star,
  AlertTriangle,
  MoreHorizontal,
  Reply,
  ShieldCheck,
  Trash2,
  Download,
  Copy,
  Filter,
  TrendingUp,
  Shield,
  FileWarning
} from "lucide-react";
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
import ReviewMetricsDashboard from "./components/ReviewMetricsDashboard";

export default function AdminReviews() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");
  const [suspiciousFilter, setSuspiciousFilter] = useState("all");
  const [duplicateFilter, setDuplicateFilter] = useState("all");
  const [reviewToDelete, setReviewToDelete] = useState<Id<"reviews"> | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [showDashboard, setShowDashboard] = useState(false);

  // Bulk selection state
  const [selectedReviews, setSelectedReviews] = useState<Set<Id<"reviews">>>(new Set());
  const [bulkActionDialog, setBulkActionDialog] = useState<"approve" | "reject" | "delete" | null>(null);

  // Reply state
  const [replyReviewId, setReplyReviewId] = useState<Id<"reviews"> | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const reviews = useQuery(api.reviews.getAllReviewsWithFilters, {
    status: activeTab === "all" ? undefined : activeTab,
    sentiment: sentimentFilter === "all" ? undefined : sentimentFilter,
    verifiedOnly: verifiedFilter === "verified" ? true : undefined,
    suspiciousOnly: suspiciousFilter === "suspicious" ? true : undefined,
    duplicatesOnly: duplicateFilter === "duplicates" ? true : undefined,
  });

  const deleteReview = useMutation(api.reviews.deleteReview);
  const dismissReports = useMutation(api.reviews.dismissReports);
  const replyToReview = useMutation(api.reviews.replyToReview);
  const updateStatus = useMutation(api.reviews.updateReviewStatus);
  const bulkApprove = useMutation(api.reviews.bulkApproveReviews);
  const bulkReject = useMutation(api.reviews.bulkRejectReviews);
  const bulkDelete = useMutation(api.reviews.bulkDeleteReviews);
  const markAsDuplicate = useMutation(api.reviews.markAsDuplicate);

  const filteredReviews = reviews?.filter((review) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (
      review.productName.toLowerCase().includes(searchLower) ||
      review.userName.toLowerCase().includes(searchLower) ||
      review.comment?.toLowerCase().includes(searchLower) ||
      review.title?.toLowerCase().includes(searchLower)
    );

    const matchesRating = ratingFilter === "all"
      ? true
      : review.rating === parseInt(ratingFilter);

    return matchesSearch && matchesRating;
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

  // Bulk selection handlers
  const toggleReviewSelection = (reviewId: Id<"reviews">) => {
    const newSelected = new Set(selectedReviews);
    if (newSelected.has(reviewId)) {
      newSelected.delete(reviewId);
    } else {
      newSelected.add(reviewId);
    }
    setSelectedReviews(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedReviews.size === filteredReviews?.length) {
      setSelectedReviews(new Set());
    } else {
      setSelectedReviews(new Set(filteredReviews?.map(r => r._id) || []));
    }
  };

  const handleBulkAction = async (action: "approve" | "reject" | "delete") => {
    const reviewIds = Array.from(selectedReviews);
    if (reviewIds.length === 0) return;

    try {
      if (action === "approve") {
        await bulkApprove({ reviewIds });
        toast.success(`${reviewIds.length} reviews approved`);
      } else if (action === "reject") {
        await bulkReject({ reviewIds });
        toast.success(`${reviewIds.length} reviews rejected`);
      } else if (action === "delete") {
        await bulkDelete({ reviewIds });
        toast.success(`${reviewIds.length} reviews deleted`);
      }
      setSelectedReviews(new Set());
    } catch (error) {
      toast.error(`Failed to ${action} reviews`);
    } finally {
      setBulkActionDialog(null);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!filteredReviews || filteredReviews.length === 0) {
      toast.error("No reviews to export");
      return;
    }

    const headers = [
      "Product",
      "User",
      "Rating",
      "Title",
      "Comment",
      "Status",
      "Sentiment",
      "Verified Purchase",
      "Suspicious Score",
      "Spam Flags",
      "Is Duplicate",
      "Date"
    ];

    const rows = filteredReviews.map(review => [
      review.productName,
      review.userName,
      review.rating,
      review.title || "",
      review.comment || "",
      review.status || "legacy",
      review.sentiment || "unknown",
      review.verifiedPurchase ? "Yes" : "No",
      review.suspiciousScore || 0,
      (review.spamFlags || []).join("; "),
      review.isDuplicate ? "Yes" : "No",
      new Date(review._creationTime).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().split("T")[0];
    link.href = URL.createObjectURL(blob);
    link.download = `reviews_export_${timestamp}.csv`;
    link.click();

    toast.success("CSV exported successfully");
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowDashboard(!showDashboard)}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            {showDashboard ? "Hide" : "Show"} Analytics
          </Button>
          <Button onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      {showDashboard && (
        <div className="border rounded-lg p-6 bg-card">
          <ReviewMetricsDashboard />
        </div>
      )}

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Reviews</TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Pending
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" /> Rejected
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-col gap-4">
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

          <div className="flex items-center gap-2 flex-wrap">
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-[140px]">
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

            <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Sentiment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiments</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>

            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger className="w-[160px]">
                <ShieldCheck className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Verified" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="verified">Verified Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={suspiciousFilter} onValueChange={setSuspiciousFilter}>
              <SelectTrigger className="w-[160px]">
                <Shield className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Spam" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="suspicious">Suspicious Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={duplicateFilter} onValueChange={setDuplicateFilter}>
              <SelectTrigger className="w-[160px]">
                <FileWarning className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Duplicates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reviews</SelectItem>
                <SelectItem value="duplicates">Duplicates Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedReviews.size > 0 && (
          <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
            <span className="text-sm font-medium">
              {selectedReviews.size} review(s) selected
            </span>
            <div className="flex gap-2 ml-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkActionDialog("approve")}
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkActionDialog("reject")}
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkActionDialog("delete")}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedReviews(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedReviews.size === filteredReviews?.length && filteredReviews?.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
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
                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                  No reviews found.
                </TableCell>
              </TableRow>
            ) : (
              filteredReviews?.map((review) => (
                <TableRow key={review._id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedReviews.has(review._id)}
                      onCheckedChange={() => toggleReviewSelection(review._id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{review.productName}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{review.userName}</span>
                      {review.verifiedPurchase && (
                        <Badge variant="outline" className="w-fit text-xs bg-blue-50 text-blue-700 border-blue-200">
                          <ShieldCheck className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {review.rating} <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{review.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{review.comment}</p>

                      {/* Sentiment Badge */}
                      {review.sentiment && (
                        <Badge
                          variant="outline"
                          className={`w-fit text-xs ${
                            review.sentiment === "positive"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : review.sentiment === "negative"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-gray-50 text-gray-700 border-gray-200"
                          }`}
                        >
                          {review.sentiment.charAt(0).toUpperCase() + review.sentiment.slice(1)}
                        </Badge>
                      )}

                      {/* Spam Warning */}
                      {(review.suspiciousScore || 0) > 50 && (
                        <Badge variant="destructive" className="gap-1 w-fit text-xs">
                          <Shield className="h-3 w-3" />
                          Suspicious ({review.suspiciousScore})
                        </Badge>
                      )}

                      {/* Duplicate Warning */}
                      {review.isDuplicate && (
                        <Badge variant="outline" className="gap-1 w-fit text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                          <Copy className="h-3 w-3" />
                          Duplicate
                        </Badge>
                      )}

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
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleStatusUpdate(review._id, "approved")}
                          title="Approve"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {review.status !== "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleStatusUpdate(review._id, "rejected")}
                          title="Reject"
                        >
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
                          {review.isDuplicate && (
                            <DropdownMenuItem disabled>
                              <Copy className="mr-2 h-4 w-4" /> Marked as Duplicate
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

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={!!bulkActionDialog} onOpenChange={(open) => !open && setBulkActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {bulkActionDialog} {selectedReviews.size} review(s)?
              {bulkActionDialog === "delete" && " This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkActionDialog && handleBulkAction(bulkActionDialog)}
              className={bulkActionDialog === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              Confirm
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
