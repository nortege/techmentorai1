import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Star, ThumbsUp, Send, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface Review {
  id: string;
  author_name: string;
  rating: number;
  comment: string;
  likes: number;
  created_at: string;
}

export default function ReviewsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(8);
  const [comment, setComment] = useState('');
  const [stats, setStats] = useState({ avg: 0, total: 0 });

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);

    const [{ data, count, error: reviewsError }, { data: ratingsData, error: ratingsError }] = await Promise.all([
      supabase
        .from('reviews')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, 999),
      supabase
        .from('reviews')
        .select('rating')
        .range(0, 999),
    ]);

    if (reviewsError) {
      toast.error(reviewsError.message);
      setLoading(false);
      return;
    }

    if (ratingsError) {
      toast.error(ratingsError.message);
    }

    setReviews((data ?? []) as Review[]);

    const ratings = ratingsData ?? [];
    const avg = ratings.length > 0
      ? ratings.reduce((sum, review) => sum + review.rating, 0) / ratings.length
      : 0;

    setStats({
      avg: Math.round(avg * 10) / 10,
      total: count ?? ratings.length,
    });
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !comment.trim()) {
      toast.error(t('reviews.fill_all'));
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('reviews').insert({
      author_name: name.trim(),
      rating,
      comment: comment.trim(),
      likes: 0,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('reviews.submitted'));
      setName('');
      setComment('');
      setRating(8);
      loadReviews();
    }
    setSubmitting(false);
  };

  const renderStars = (r: number) => {
    const full = Math.round(r);
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <Star key={i} className={`h-3.5 w-3.5 ${i < full ? 'text-warning fill-warning' : 'text-muted-foreground/30'}`} />
        ))}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="container px-4 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-3xl font-bold mb-2">{t('reviews.title')}</h1>
          <p className="text-muted-foreground mb-8">{t('reviews.subtitle')}</p>

          {/* Stats */}
          <div className="rounded-xl border bg-card p-6 shadow-card mb-8 flex items-center gap-8">
            <div className="text-center">
              <p className="text-4xl font-heading font-bold text-primary">{stats.avg}</p>
              <p className="text-xs text-muted-foreground">{t('reviews.out_of_10')}</p>
              {renderStars(stats.avg)}
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">{stats.total.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">{t('reviews.total_reviews')}</p>
            </div>
          </div>

          {/* Submit form */}
          {user && (
            <div className="rounded-xl border bg-card p-6 shadow-card mb-8 space-y-4">
              <h2 className="font-heading font-semibold text-lg">{t('reviews.leave_review')}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t('reviews.your_name')}</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('reviews.name_placeholder')} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t('reviews.rating')} ({rating}/10)</label>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  {renderStars(rating)}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t('reviews.comment')}</label>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder={t('reviews.comment_placeholder')} />
              </div>
              <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {t('reviews.submit')}
              </Button>
            </div>
          )}

          {/* Reviews list */}
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review, i) => (
                <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="rounded-xl border bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{review.author_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      <span className="text-sm font-bold text-primary">{review.rating}/10</span>
                    </div>
                  </div>
                  {review.comment && <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    <span>{review.likes}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
