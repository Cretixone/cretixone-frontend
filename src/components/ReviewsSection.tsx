import { useCallback, useEffect, useRef, useState } from 'react'
import { Star, StarIcon, ThumbsUp } from 'lucide-react'
import ReactStars from 'react-rating-stars-component'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useAuthUiStore } from '@/store/authUiStore'
import { reviewsApi, type Review } from '@/api/reviews.api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const REPORT_REASONS = [
  'Spam or advertising',
  'Offensive or inappropriate',
  'Fake or misleading',
  'Off-topic / irrelevant',
  'Other',
] as const

// "3 days ago" style relative time.
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`
  const years = Math.floor(days / 365)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

const initialsOf = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'U'

// Static star row for displaying a review's rating.
function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn('h-3.5 w-3.5', i < rating ? 'text-brand-gold' : 'text-black/15')}
          fill={i < rating ? '#e5a743' : 'transparent'}
          strokeWidth={i < rating ? 0 : 1.5}
        />
      ))}
    </div>
  )
}

function ReviewCard({
  r,
  liked,
  onLike,
  onReport,
}: {
  r: Review
  liked: boolean
  onLike: () => void
  onReport: () => void
}) {
  return (
    <div className="py-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-navy text-xs font-semibold text-white">
          {initialsOf(r.userName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-brand-navy">{r.userName}</p>
              <div className="mt-1">
                <StarRow rating={r.rating} />
              </div>
            </div>
            <button
              type="button"
              onClick={onReport}
              className="shrink-0 text-[11px] text-foreground/40 transition hover:text-foreground/70"
            >
              Report this review
            </button>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <h4 className="text-sm font-semibold text-foreground">{r.title}</h4>
            <span className="text-[11px] text-foreground/45">{timeAgo(r.createdAt)}</span>
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-foreground/70">{r.body}</p>

          <button
            type="button"
            onClick={onLike}
            className={cn(
              'mt-3 inline-flex items-center gap-1.5 text-xs transition',
              liked ? 'text-brand-gold' : 'text-foreground/50 hover:text-foreground/80',
            )}
          >
            <ThumbsUp className="h-3.5 w-3.5" fill={liked ? '#e5a743' : 'transparent'} />
            <span>({r.likes})</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export function ReviewsSection({ frameId }: { frameId: number }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const formRef = useRef<HTMLDivElement>(null)

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const openAuth = useAuthUiStore((s) => s.openAuth)

  // Form state
  const [rating, setRating] = useState(0)
  const [ratingError, setRatingError] = useState(false)
  const [ratingKey, setRatingKey] = useState(0) // remount the stars to reset them
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [agree, setAgree] = useState(false)
  const [agreeError, setAgreeError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // The write-a-review form is hidden until the user clicks "Write Review".
  const [showForm, setShowForm] = useState(false)

  // Report popup state
  const [reportFor, setReportFor] = useState<Review | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [reportOther, setReportOther] = useState('')
  const [reportError, setReportError] = useState<string | null>(null)
  const [reporting, setReporting] = useState(false)

  const load = useCallback(() => {
    if (!frameId) return
    setLoading(true)
    reviewsApi
      .list(frameId)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false))
  }, [frameId])

  useEffect(() => {
    load()
  }, [load])

  const scrollToForm = () =>
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // "Write Review" reveals the form (hidden by default) and scrolls to it. If
  // it's already open, just scroll — the reveal effect below fires only on the
  // hidden→shown transition, once the form has actually rendered into the DOM.
  const openForm = () => {
    if (showForm) scrollToForm()
    else setShowForm(true)
  }

  useEffect(() => {
    if (showForm) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [showForm])

  const handleLike = async (r: Review) => {
    if (!isAuthenticated || !user) {
      openAuth('login')
      return
    }
    try {
      const res = await reviewsApi.like(r.id)
      setReviews((prev) =>
        prev.map((x) =>
          x.id === r.id
            ? {
              ...x,
              likes: res.likes,
              likedBy: res.liked
                ? [...x.likedBy, user.id]
                : x.likedBy.filter((u) => u !== user.id),
            }
            : x,
        ),
      )
    } catch {
      /* global toast */
    }
  }

  // Open the report popup (login-gated).
  const openReport = (r: Review) => {
    if (!isAuthenticated) {
      openAuth('login')
      return
    }
    setReportFor(r)
    setReportReason('')
    setReportOther('')
    setReportError(null)
  }

  const submitReport = async () => {
    if (!reportFor) return
    if (!reportReason) {
      setReportError('Please select a reason.')
      return
    }
    const finalReason =
      reportReason === 'Other' ? reportOther.trim() : reportReason
    if (reportReason === 'Other' && !finalReason) {
      setReportError('Please describe the reason.')
      return
    }
    setReporting(true)
    try {
      await reviewsApi.report(reportFor.id, finalReason)
      toast.success('Report submitted — thanks for letting us know.')
      setReportFor(null)
    } catch {
      /* global toast */
    } finally {
      setReporting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // A star rating is required before anything else.
    if (!rating) {
      setRatingError(true)
      toast.error('Please select a star rating')
      return
    }
    if (!isAuthenticated) {
      openAuth('login')
      return
    }
    if (!title.trim() || !body.trim()) {
      toast.error('Please add a title and your review')
      return
    }
    // Consent is required — show a red inline error, no toast.
    if (!agree) {
      setAgreeError(true)
      return
    }
    setSubmitting(true)
    try {
      await reviewsApi.create({ frameId, rating, title: title.trim(), body: body.trim() })
      toast.success('Review submitted')
      setRating(0)
      setRatingError(false)
      setRatingKey((k) => k + 1)
      setTitle('')
      setBody('')
      setAgree(false)
      setAgreeError(false)
      load()
    } catch {
      /* global toast */
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-14 max-w-3xl">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-brand-navy">
          Review <span className="text-sm font-normal text-foreground/45">({reviews.length})</span>
        </h2>
        <button
          type="button"
          onClick={openForm}
          className="rounded-full border border-brand-navy/30 px-5 py-2 text-sm font-medium text-brand-navy transition hover:bg-brand-navy/5"
        >
          Write Review
        </button>
      </div>

      {/* Reviews list */}
      <div className="mt-4 divide-y divide-black/[0.07]">
        {loading ? (
          <p className="py-8 text-sm text-foreground/50">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="py-8 text-sm text-foreground/50">
            No reviews yet — be the first to share your experience.
          </p>
        ) : (
          reviews.map((r) => (
            <ReviewCard
              key={r.id}
              r={r}
              liked={!!user && r.likedBy.includes(user.id)}
              onLike={() => handleLike(r)}
              onReport={() => openReport(r)}
            />
          ))
        )}
      </div>

      {/* Write-a-review form — hidden until "Write Review" is clicked */}
      {showForm && (
      <div ref={formRef} className="mt-12 scroll-mt-28">
        <h2 className="max-w-md text-2xl font-bold leading-snug text-brand-navy">
          We&apos;d Love To Hear About Your Experience!
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <p className="text-sm font-medium text-foreground">
              How would you rate your experience? <span className="text-red-500">*</span>
            </p>
            <div className="mt-3">
              <ReactStars
                key={ratingKey}
                count={5}
                value={rating}
                onChange={(v: number) => {
                  setRating(v)
                  setRatingError(false)
                }}
                isHalf={false}
                color="#d9d9d9"
                activeColor="#e5a743"
                emptyIcon={<StarIcon size={32} />}
                filledIcon={<StarIcon size={32} fill="currentColor" />}
              />
            </div>
            {ratingError && (
              <p className="mt-1 text-xs text-red-500">Please select a star rating to submit.</p>
            )}
          </div>

          <div>
            <label htmlFor="review-body" className="text-sm font-medium text-foreground">
              Write Your Review
            </label>
            <textarea
              id="review-body"
              rows={5}
              maxLength={500}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your experience…"
              className="mt-2 w-full resize-none rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30"
            />
            <div className="mt-1 text-right text-[11px] text-foreground/40">
              {body.length}/500 characters
            </div>
          </div>

          <div>
            <label htmlFor="review-title" className="text-sm font-medium text-foreground">
              Write A Title For Your Review
            </label>
            <input
              id="review-title"
              maxLength={500}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience…"
              className="mt-2 w-full rounded-full border border-black/15 bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30"
            />
            <div className="mt-1 text-right text-[11px] text-foreground/40">
              {title.length}/500 characters
            </div>
          </div>

          <div>
            <label className="flex items-start gap-2.5 text-[11px] leading-relaxed text-foreground/50">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => {
                  setAgree(e.target.checked)
                  setAgreeError(false)
                }}
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand-gold"
              />
              <span>
                I confirm that this review is based on my personal experience and reflects my genuine opinion of this establishment. I have no personal or business relationship with this establishment and have not received any incentive or payment from it to write this review. I also understand that SK Fans maintains a strict zero-tolerance policy against fake reviews.
              </span>
            </label>
            {agreeError && (
              <p className="mt-1.5 text-xs text-red-500">
                Please confirm the statement above to submit your review.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-brand-gold px-9 w-[200px] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-gold/90 disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </form>
      </div>
      )}

      {/* Report-a-review popup */}
      <Dialog open={!!reportFor} onOpenChange={(o) => !o && setReportFor(null)}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-brand-navy">
              Report review
            </DialogTitle>
            <DialogDescription className="text-foreground/60">
              Tell us why you&apos;re reporting this review.
            </DialogDescription>
          </DialogHeader>

          <RadioGroup
            value={reportReason}
            onValueChange={(v) => {
              setReportReason(v)
              setReportError(null)
            }}
            className="mt-1 space-y-0.5 px-6 "
          >
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason}
                htmlFor={`report-${reason}`}
                className={cn(
                  'flex cursor-pointer items-center gap-3 py-1.5 text-sm transition',
                  reportReason === reason ? 'text-brand-navy' : 'text-foreground/80',
                )}
              >
                <RadioGroupItem value={reason} id={`report-${reason}`} />
                <span className="font-medium">{reason}</span>
              </label>
            ))}
          </RadioGroup>

          {reportReason === 'Other' && (
            <div className="px-6 mt-2">
            <Textarea
              rows={3}
              maxLength={500}
              value={reportOther}
              onChange={(e) => {
                setReportOther(e.target.value)
                setReportError(null)
              }}
              placeholder="Please describe the reason…"
              className="resize-none border"
              autoFocus
            />
            </div>
          )}

          {reportError && <p className="text-xs font-medium text-red-500">{reportError}</p>}

          <DialogFooter className="mt-2 flex-row justify-end gap-2">
            <Button variant="ghost" onClick={() => setReportFor(null)} disabled={reporting}>
              Cancel
            </Button>
            <Button variant="gold" onClick={submitReport} disabled={reporting}>
              {reporting ? 'Submitting…' : 'Submit report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
