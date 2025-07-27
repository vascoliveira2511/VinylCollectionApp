"use client";

import { useState, useEffect } from "react";
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
      const response = await fetch(`/api/vinyl-comments?discogsId=${discogsId}`);
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
      alert("Network error: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  if (loading) {
    return (
      <div className="window" style={{ marginBottom: "20px" }}>
        <div className="title-bar">Community Reviews & Comments</div>
        <div className={styles.contentSection}>
          <p>Loading comments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="window" style={{ marginBottom: "20px" }}>
      <div className="title-bar">Community Reviews & Comments ({comments.length})</div>
      <div className={styles.contentSection}>
        {/* Comment Form */}
        <div className={styles.commentForm}>
          <div className={styles.commentFormHeader}>
            <label>
              <input
                type="checkbox"
                checked={isReview}
                onChange={(e) => setIsReview(e.target.checked)}
              />
              This is a review (include rating)
            </label>
            {isReview && (
              <div className={styles.ratingInput}>
                <label>Rating: </label>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    className={`${styles.starButton} ${
                      newRating && newRating >= star ? styles.starActive : ""
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            )}
          </div>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={isReview ? "Write your review..." : "Write a comment..."}
            className={styles.commentTextarea}
            rows={3}
          />
          <button
            onClick={handleCommentSubmit}
            disabled={!newComment.trim()}
            className={styles.commentSubmitButton}
          >
            {isReview ? "Post Review" : "Post Comment"}
          </button>
        </div>

        {/* Comments List */}
        <div className={styles.commentsList}>
          {comments.length === 0 ? (
            <p className={styles.noComments}>
              No comments yet. Be the first to share your thoughts!
            </p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className={styles.commentItem}>
                <div className={styles.commentHeader}>
                  <div className={styles.commentUser}>
                    <strong>{comment.user.username}</strong>
                    {comment.isReview && (
                      <span className={styles.reviewBadge}>Review</span>
                    )}
                    {comment.rating && (
                      <div className={styles.commentRating}>
                        {"⭐".repeat(comment.rating)}
                      </div>
                    )}
                  </div>
                  <span className={styles.commentDate}>
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.commentContent}>
                  {comment.content}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}