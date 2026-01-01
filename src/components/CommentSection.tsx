import { useState } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { MessageSquare, Send, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CommentEntry } from '@/types/order';
import { cn } from '@/lib/utils';

const PAKISTAN_TZ = 'Asia/Karachi';

interface CommentSectionProps {
  comments: CommentEntry[];
  onAddComment: (comment: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function CommentSection({ comments, onAddComment, isSubmitting = false }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return;
    await onAddComment(newComment.trim());
    setNewComment('');
  };

  const formatDate = (dateString: string) => {
    return formatInTimeZone(new Date(dateString), PAKISTAN_TZ, 'MMM d, yyyy h:mm a');
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-primary/15 text-primary border-primary/30';
      case 'user':
        return 'bg-muted text-muted-foreground border-muted-foreground/30';
      default:
        return 'bg-muted/50 text-muted-foreground border-muted/30';
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Comments</h2>
          <p className="text-sm text-muted-foreground">
            {comments.length} comment{comments.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Add Comment Form */}
      <div className="space-y-3">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px] resize-none"
          disabled={isSubmitting}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!newComment.trim() || isSubmitting}
            size="sm"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <Send className="w-4 h-4 mr-1" />
            )}
            Send
          </Button>
        </div>
      </div>

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pt-4 border-t border-border">
          {comments.map((comment, index) => (
            <div
              key={comment._id || index}
              className={cn(
                'p-4 rounded-lg border border-border bg-muted/30',
                'animate-fade-in'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground text-sm">
                      {comment.commentedBy?.username || 'Unknown'}
                    </span>
                    <span
                      className={cn(
                        'ml-2 text-xs px-2 py-0.5 rounded-full border capitalize',
                        getRoleBadgeClass(comment.role)
                      )}
                    >
                      {comment.role}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(comment.commentedAt)}
                </span>
              </div>
              <p className="text-sm text-foreground pl-10">{comment.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No comments yet</p>
        </div>
      )}
    </div>
  );
}
