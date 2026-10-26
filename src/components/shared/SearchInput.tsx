import {
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'
import { SearchIcon } from 'lucide-react'

import { SvgIcon } from '@/assets/icons/SvgIcon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/lib/utils'

type SearchInputProps = {
  onSearch: (query: string) => void
  initialQuery?: string
  onOpenChange?: (open: boolean) => void
  className?: string
  variant?: 'expandable' | 'bar'
}

type ExpandableSearchInputProps = Omit<SearchInputProps, 'variant'>

// Expandable (Header, padrão) e bar (mobile). Cada variante é um componente próprio,
// para que os hooks de uma não sejam chamados condicionalmente pela outra.
export function SearchInput({ variant = 'expandable', ...props }: SearchInputProps) {
  if (variant === 'bar') {
    return (
      <SearchBar
        onSearch={props.onSearch}
        initialQuery={props.initialQuery}
        className={props.className}
      />
    )
  }

  return <ExpandableSearchInput {...props} />
}

function ExpandableSearchInput({
  onSearch,
  initialQuery = '',
  onOpenChange,
  className,
}: ExpandableSearchInputProps) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [value, setValue] = useState(initialQuery)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()
  const formId = `${id}-form`
  const inputId = `${id}-input`

  // Largura de 0 a 280 px: o campo nasce fechado e expande no quadro seguinte.
  useEffect(() => {
    if (!open) return

    inputRef.current?.focus()
    const frame = requestAnimationFrame(() => setExpanded(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  function openSearch() {
    setValue(initialQuery)
    setOpen(true)
    onOpenChange?.(true)
  }

  function closeSearch(restoreFocus: boolean) {
    setOpen(false)
    setExpanded(false)
    onOpenChange?.(false)

    if (restoreFocus) {
      toggleRef.current?.focus()
    }
  }

  function handleToggleClick(event: MouseEvent<HTMLButtonElement>) {
    if (!open) {
      // O botão vira "submit" ao abrir; sem isto o clique que abre já enviaria o formulário.
      event.preventDefault()
      openSearch()
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const query = value.trim()
    if (query === '') {
      inputRef.current?.focus()
      return
    }

    onSearch(query)
    closeSearch(true)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeSearch(true)
    }
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const nextFocus = event.relatedTarget
    const insideGroup = nextFocus instanceof Node && event.currentTarget.contains(nextFocus)

    if (!insideGroup && value.trim() === '') {
      closeSearch(false)
    }
  }

  return (
    <div className={cn('relative flex items-center', className)} onBlur={handleBlur}>
      {open ? (
        <form
          id={formId}
          role="search"
          onSubmit={handleSubmit}
          className={cn(
            'absolute top-1/2 right-full mr-2 flex h-9 -translate-y-1/2 items-center overflow-hidden transition-[width] duration-200 ease-out motion-reduce:transition-none',
            expanded ? 'w-70' : 'w-0',
          )}
        >
          <Label htmlFor={inputId} className="sr-only">
            Buscar NFTs e coleções
          </Label>
          <div className="relative w-70 shrink-0">
            <Input
              ref={inputRef}
              id={inputId}
              type="text"
              enterKeyHint="search"
              placeholder="Buscar NFTs e coleções"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={handleKeyDown}
              className="h-9 pr-9"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Fechar busca"
              onClick={() => closeSearch(true)}
              className="absolute top-1/2 right-1 size-7 -translate-y-1/2 hover:bg-transparent"
            >
              <SvgIcon name="x" className="text-primary" />
            </Button>
          </div>
        </form>
      ) : null}

      <Button
        ref={toggleRef}
        type={open ? 'submit' : 'button'}
        form={open ? formId : undefined}
        variant="ghost"
        size="icon"
        aria-label={open ? 'Buscar' : 'Abrir busca'}
        aria-expanded={open}
        aria-controls={formId}
        onClick={handleToggleClick}
        className="size-8 text-foreground hover:bg-transparent"
      >
        <SearchIcon className="size-5.5" />
      </Button>
    </div>
  )
}

type SearchBarProps = Pick<SearchInputProps, 'onSearch' | 'initialQuery' | 'className'>

// Barra sempre aberta do mobile. Busca com debounce de 300 ms; Enter e "Limpar" enviam na hora.
function SearchBar({ onSearch, initialQuery = '', className }: SearchBarProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  // Último valor enviado para onSearch: só lido e escrito em efeitos e handlers.
  const sent = useRef(initialQuery)
  const [value, setValue] = useState(initialQuery)
  const [seen, setSeen] = useState(initialQuery)
  const debounced = useDebounce(value.trim(), 300)

  // Sincronia com a URL, sem effect que chama setState: ajusta o state quando a prop muda.
  // Com mudança pendente de digitação, o texto digitado vence.
  if (initialQuery !== seen) {
    setSeen(initialQuery)
    if (value.trim() === debounced) {
      setValue(initialQuery)
    }
  }

  useEffect(() => {
    sent.current = initialQuery
  }, [initialQuery])

  useEffect(() => {
    if (debounced !== sent.current) {
      sent.current = debounced
      onSearch(debounced)
    }
  }, [debounced, onSearch])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const query = value.trim()
    sent.current = query
    onSearch(query)
  }

  function handleClear() {
    setValue('')
    sent.current = ''
    onSearch('')
    inputRef.current?.focus()
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn(
        'flex h-11.25 min-w-0 flex-1 items-center gap-3 rounded-mobile bg-card px-4 focus-within:ring-2 focus-within:ring-ring',
        className,
      )}
    >
      <Label htmlFor={inputId} className="sr-only">
        Buscar NFTs e coleções
      </Label>
      <SvgIcon name="search" aria-hidden="true" className="shrink-0 text-tan" />
      <Input
        ref={inputRef}
        id={inputId}
        type="search"
        enterKeyHint="search"
        placeholder="Explorar coleções"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-full min-w-0 flex-1 border-0 bg-transparent px-0 text-sm font-bold placeholder:text-tan focus-visible:border-transparent focus-visible:ring-0 max-lg:h-full"
      />
      {value !== '' ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Limpar busca"
          onClick={handleClear}
          className="size-7 shrink-0"
        >
          <SvgIcon name="x" className="text-primary" />
        </Button>
      ) : null}
    </form>
  )
}
