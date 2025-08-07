"use client";

import { useState, useEffect } from "react";
import Button from "./Button";
import styles from "../page.module.css";

interface Comment {
  id: number;
  content: string;
  rating?: number;
  isReview: boolean;
  createdAt: string;
  user: {
    id: number;
    username: string;
    avatar?: string;
    avatarType?: string;
  };
}

interface VinylCommentsProps {
  discogsId: number;
}

export default function VinylComments({ discogsId }: VinylCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState<number | undefined>(undefined);
  const [isReview, setIsReview] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [discogsId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(
        `/api/vinyl-comments?discogsId=${discogsId}`
      );
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch("/api/vinyl-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discogsId: discogsId,
          content: newComment,
          rating: newRating,
          isReview: isReview,
        }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments([comment, ...comments]);
        setNewComment("");
        setNewRating(undefined);
        setIsReview(false);
      } else {
        const data = await response.json();
        alert("Error: " + (data.error || "Failed to post comment"));
      }
    } catch (err) {
      alert(
        "Network error: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  if (loading) {
    return (
      <div className={styles.commentsContainer}>
        <p className={styles.loadingText}>Loading comments...</p>
      </div>
    );
  }

  return (
    <div className={styles.commentsContainer}>
      {/* Comment Form */}
      <div className={styles.cleanCommentForm}>
        <div className={styles.formControls}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={isReview}
              onChange={(e) => setIsReview(e.target.checked)}
              className={styles.checkbox}
            />
            <span>This is a review</span>
          </label>
          {isReview && (
            <div className={styles.cleanRatingInput}>
              <span className={styles.ratingLabel}>Rating:</span>
              <div className={styles.starButtons}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    className={`${styles.cleanStarButton} ${
                      newRating && newRating >= star ? styles.starSelected : ""
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={
            isReview ? "Write your review..." : "Share your thoughts..."
          }
          className={styles.cleanTextarea}
          rows={4}
        />
        <div className={styles.formActions}>
          <Button
            onClick={handleCommentSubmit}
            disabled={!newComment.trim()}
            variant="primary"
            size="medium"
          >
            {isReview ? "Post Review" : "Post Comment"}
          </Button>
        </div>
      </div>

      {/* Comments List */}
      <div className={styles.cleanCommentsList}>
        {comments.length === 0 ? (
          <p className={styles.emptyState}>
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className={styles.cleanCommentItem}>
              <div className={styles.cleanCommentHeader}>
                <div className={styles.commentAuthor}>
                  <span className={styles.username}>
                    {comment.user.username}
                  </span>
                  {comment.isReview && (
                    <span className={styles.cleanReviewBadge}>Review</span>
                  )}
                  {comment.rating && (
                    <div className={styles.cleanRating}>
                      {"★".repeat(comment.rating)}
                    </div>
                  )}
                </div>
                <span className={styles.cleanDate}>
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className={styles.cleanCommentContent}>
                {comment.content}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
