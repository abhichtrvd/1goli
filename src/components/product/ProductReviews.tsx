import { Button } from "@/components/ui/button";
import { Star, CheckCircle2, Loader2, ThumbsUp, Flag, MoreVertical, Pencil } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ProductReviewsProps {
  productId: Id<"products">;
  averageRating: number;
  ratingCount: number;
}

export function ProductReviews({ productId, averageRating, ratingCount }: ProductReviewsProps) {
  const reviews = useQuery(api.reviews.getReviews, { productId });
  const submitReview = useMutation(api.reviews.submitReview);
  const editReview = useMutation(api.reviews.editReview);
  const markHelpful = useMutation(api.reviews.markHelpful);
  const reportReview = useMutation(api.reviews.reportReview);
  const { isAuthenticated } = useAuth();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  
  // Editing state
  const [editingReviewId, setEditingReviewId] = useState<Id<"reviews"> | null>(null);

  const openWriteReview = () => {
    setEditingReviewId(null);
    setRating(5);
    setTitle("");
    setComment("");
    setIsDialogOpen(true);
  };

  const openEditReview = (review: any) => {
    setEditingReviewId(review._id);
    setRating(review.rating);
    setTitle(review.title || "");
    setComment(review.comment || "");
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to write a review");
      return;
    }
    if (!title.trim() || !comment.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingReviewId) {
        await editReview({
          reviewId: editingReviewId,
          rating,
          title,
          comment,
        });
        toast.success("Review updated successfully");
      } else {
        await submitReview({
          productId,
          rating,
          title,
          comment,
        });
        toast.success("Review submitted successfully");
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId: Id<"reviews">) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to vote");
      return;
    }
    try {
      await markHelpful({ reviewId });
    } catch (error) {
      toast.error("Failed to mark helpful");
    }
  };

  const handleReport = async (reviewId: Id<"reviews">) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to report");
      return;
    }
    try {
      await reportReview({ reviewId });
      toast.success("Review reported for moderation");
    } catch (error) {
      toast.error("Failed to report review");
    }
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">Ratings & Reviews</h2>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <div className="flex items-end gap-2">
            <span className="text-5xl font-bold text-foreground">{averageRating ? averageRating.toFixed(1) : "0.0"}</span>
            <div className="mb-2">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`h-5 w-5 ${star <= Math.round(averageRating || 0) ? "fill-current" : "text-muted-foreground/30"}`} 
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{ratingCount || 0} Verified Ratings</span>
            </div>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full" onClick={openWriteReview}>Write a Review</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingReviewId ? "Edit Review" : "Write a Review"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star 
                          className={`h-8 w-8 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    placeholder="Summarize your experience" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comment">Review</Label>
                  <Textarea 
                    id="comment" 
                    placeholder="What did you like or dislike?" 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingReviewId ? "Update Review" : "Submit Review"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="md:col-span-2 space-y-6">
          {reviews === undefined ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No reviews yet. Be the first to review!
            </div>
          ) : (
            reviews.map((review: any) => (
              <div key={review._id} className="space-y-2 pb-6 border-b last:border-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex text-green-600">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`h-4 w-4 ${star <= review.rating ? "fill-current" : "text-muted-foreground/30"}`} 
                        />
                      ))}
                    </div>
                    <span className="font-medium text-sm">{review.title}</span>
                  </div>
                  
                  {review.isCurrentUser && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditReview(review)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">
                  "{review.comment}"
                </p>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{review.userName}</span>
                  <span>•</span>
                  {review.verifiedPurchase && (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Verified Purchase
                    </span>
                  )}
                  <span>•</span>
                  <span>{new Date(review._creationTime).toLocaleDateString()}</span>
                  {review.isEdited && <span className="italic">(edited)</span>}
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`h-8 px-2 text-xs gap-1.5 ${review.currentUserInteraction === 'helpful' ? 'text-primary' : 'text-muted-foreground'}`}
                    onClick={() => handleHelpful(review._id)}
                  >
                    <ThumbsUp className={`h-3.5 w-3.5 ${review.currentUserInteraction === 'helpful' ? 'fill-current' : ''}`} />
                    Helpful ({review.helpfulCount || 0})
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`h-8 px-2 text-xs gap-1.5 ${review.currentUserInteraction === 'report' ? 'text-destructive' : 'text-muted-foreground'}`}
                    onClick={() => handleReport(review._id)}
                  >
                    <Flag className={`h-3.5 w-3.5 ${review.currentUserInteraction === 'report' ? 'fill-current' : ''}`} />
                    Report
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}