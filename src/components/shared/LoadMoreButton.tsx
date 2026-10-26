import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type LoadMoreButtonProps = {
  onClick: () => void
  loading?: boolean
  className?: string
}

// Só mobile: quem usa decide quando renderizar. Com `loading`, o clique é ignorado.
export function LoadMoreButton({ onClick, loading = false, className }: LoadMoreButtonProps) {
  function handleClick() {
    if (loading) return
    onClick()
  }

  return (
    <Button
      type="button"
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={handleClick}
      className={cn('mx-auto h-12.5 w-full max-w-xs rounded-4xl text-base', className)}
    >
      {loading ? 'Carregando…' : 'Carregar mais'}
    </Button>
  )
}
