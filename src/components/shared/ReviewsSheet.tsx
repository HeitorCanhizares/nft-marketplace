import { ReviewsPanel } from '@/components/shared/ReviewsPanel'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { ReviewsState } from '@/hooks/useReviews'

type ReviewsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  count: number
  reviews: ReviewsState
}

// Avaliações no mobile: drawer de baixo, com altura até ~85dvh e corpo rolável.
export function ReviewsSheet({ open, onOpenChange, count, reviews }: ReviewsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{`Avaliações de colecionadores (${count})`}</SheetTitle>
          <SheetDescription className="sr-only">
            Lista de avaliações de colecionadores deste NFT.
          </SheetDescription>
        </SheetHeader>
        <ReviewsPanel reviews={reviews} />
      </SheetContent>
    </Sheet>
  )
}
