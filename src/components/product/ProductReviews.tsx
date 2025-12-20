import { Button } from "@/components/ui/button";
import { Star, CheckCircle2, Loader2 } from "lucide-react";
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

interface ProductReviewsProps {
  productId: Id<"products">;
  averageRating: number;
  ratingCount: number;
}

export function ProductReviews({ productId, averageRating, ratingCount }: ProductReviewsProps) {
  const reviews = useQuery(api.reviews.getReviews, { productId });
  const submitReview = useMutation(api.reviews.submitReview);
  const { isAuthenticated } = useAuth();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");

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
      await submitReview({
        productId,
        rating,
        title,
        comment,
      });
      toast.success("Review submitted successfully");
      setIsDialogOpen(false);
      setTitle("");
      setComment("");
      setRating(5);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
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
              <Button variant="outline" className="w-full">Write a Review</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
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
                  Submit Review
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
            reviews.map((review) => (
              <div key={review._id} className="space-y-2 pb-6 border-b last:border-0">
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
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
