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
import { Loader2, MoreHorizontal, Search, Star, Trash2, ShieldCheck, AlertTriangle, Filter } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminReviews() {
  const reviews = useQuery(api.reviews.getAllReviews);
  const deleteReview = useMutation(api.reviews.deleteReview);
  const dismissReports = useMutation(api.reviews.dismissReports);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [reviewToDelete, setReviewToDelete] = useState<Id<"reviews"> | null>(null);

  const filteredReviews = reviews?.filter((review) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (
      review.productName.toLowerCase().includes(searchLower) ||
      review.userName.toLowerCase().includes(searchLower) ||
      review.comment?.toLowerCase().includes(searchLower) ||
      review.title?.toLowerCase().includes(searchLower)
    );

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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="reported">Reported</SelectItem>
            </SelectContent>
          </Select>

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
                    </div>
                  </TableCell>
                  <TableCell>
                    {review.reportCount > 0 ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" /> {review.reportCount} Reports
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-600/20 bg-green-50">
                        Published
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(review._creationTime).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
    </div>
  );
}