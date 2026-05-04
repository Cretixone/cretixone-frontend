import { cn } from '@/lib/utils'

export interface CategoryCardProps {
  /** Path to the category image (e.g. /categories/frames.jpg) */
  image: string
  /** Label shown beneath the image */
  label: string
  /** Optional click target / anchor href */
  href?: string
  /** Extra classes for the wrapper (lets the parent control sizing/grid behaviour) */
  className?: string
}

export default function CategoryCard({
  image,
  label,
  href,
  className,
}: CategoryCardProps) {
  const Tag = href ? 'a' : 'div'
  return (
    <Tag
      {...(href ? { href } : {})}
      className={cn(
        'group flex flex-col items-center gap-4 transition',
        href && 'cursor-pointer',
        className,
      )}
    >
      <div
        className="relative aspect-square w-full overflow-hidden rounded-[33px] bg-neutral-200 ring-1 ring-black/5 transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-[0px_4px_21.4px_4px_rgba(99,104,119,0.15)]"
        style={{
          backgroundImage: `url(${image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          height: "388px"
        }}
        role="img"
        aria-label={label}
      />

      <span className="text-base font-medium text-brand-gold transition group-hover:text-brand-gold-dark">
        {label}
      </span>
    </Tag>
  )
}
