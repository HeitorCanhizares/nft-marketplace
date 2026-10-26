import { useLayoutEffect, useRef, useState, type ComponentProps } from 'react'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

import { AUTH_INPUT_CLASS } from '@/components/shared/authStyles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type PasswordInputProps = Omit<ComponentProps<'input'>, 'type'>

export function PasswordInput({ className, ref, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  // Seleção do campo guardada antes de trocar o tipo, para o cursor não se perder ao alternar.
  const pendingSelectionRef = useRef<{ start: number; end: number } | null>(null)

  function setInputRef(node: HTMLInputElement | null) {
    inputRef.current = node
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      ref.current = node
    }
  }

  function handleToggle() {
    const input = inputRef.current
    if (input && input.selectionStart !== null && input.selectionEnd !== null) {
      pendingSelectionRef.current = { start: input.selectionStart, end: input.selectionEnd }
    }
    setVisible((current) => !current)
  }

  useLayoutEffect(() => {
    const input = inputRef.current
    const selection = pendingSelectionRef.current
    if (!input || !selection) return

    pendingSelectionRef.current = null
    input.focus()
    input.setSelectionRange(selection.start, selection.end)
  }, [visible])

  return (
    <div className="relative">
      <Input
        {...props}
        ref={setInputRef}
        type={visible ? 'text' : 'password'}
        className={cn(AUTH_INPUT_CLASS, 'pr-12', className)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-pressed={visible}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        onClick={handleToggle}
        className="absolute inset-y-0 right-0 h-full w-10 text-tan hover:text-tan"
      >
        {visible ? <EyeIcon className="size-5.5" /> : <EyeOffIcon className="size-5.5" />}
      </Button>
    </div>
  )
}
