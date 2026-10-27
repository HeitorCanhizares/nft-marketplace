import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react'
import { ImageIcon, Loader2Icon } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLiveAnnouncer } from '@/contexts/liveAnnouncer'
import { useRemoveAvatar, useUploadAvatar } from '@/hooks/useProfileAvatar'
import { AVATAR_MAX_BYTES, AVATAR_MIME_TYPES } from '@/schemas/profile'
import { isApiError } from '@/services/http/ApiError'
import { cn } from '@/lib/utils'

type AvatarUploaderProps = {
  avatarUrl?: string
  name: string
  className?: string
}

type Preview = { file: File; url: string }

const TYPE_MESSAGE = 'Use uma imagem PNG, JPG ou WEBP.'
const SIZE_MESSAGE = 'A imagem deve ter até 2 MB.'
const UPLOAD_MESSAGE = 'Não foi possível enviar a foto. Tente novamente.'
const REMOVE_MESSAGE = 'Não foi possível remover a foto. Tente novamente.'

export function AvatarUploader({ avatarUrl, className }: AvatarUploaderProps) {
  const labelId = useId()
  const { announce } = useLiveAnnouncer()
  const upload = useUploadAvatar()
  const removeAvatar = useRemoveAvatar()

  const [preview, setPreview] = useState<Preview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [removeOpen, setRemoveOpen] = useState(false)

  // Refs só nos handlers (abrir o seletor e devolver o foco), nunca no render.
  const inputRef = useRef<HTMLInputElement | null>(null)
  const changeButtonRef = useRef<HTMLButtonElement | null>(null)

  const previewUrl = preview?.url
  // Libera a URL da prévia ao trocar de prévia ou ao desmontar.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const hasPhoto = avatarUrl !== undefined
  const shownUrl = preview?.url ?? avatarUrl

  function showError(message: string) {
    setError(message)
    announce(message, 'assertive')
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    // Limpa o campo para permitir escolher o mesmo arquivo de novo.
    event.currentTarget.value = ''
    if (!file) return

    if (!(AVATAR_MIME_TYPES as readonly string[]).includes(file.type)) {
      showError(TYPE_MESSAGE)
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      showError(SIZE_MESSAGE)
      return
    }

    setError(null)
    setPreview({ file, url: URL.createObjectURL(file) })
  }

  function handleChangeClick() {
    if (preview !== null) {
      void handleUpload(preview.file)
      return
    }
    inputRef.current?.click()
  }

  async function handleUpload(file: File) {
    if (upload.isPending) return
    setError(null)
    try {
      await upload.mutateAsync(file)
      setPreview(null)
    } catch (failure) {
      const fieldMessage = isApiError(failure) ? failure.fields?.file : undefined
      showError(fieldMessage ?? UPLOAD_MESSAGE)
    }
  }

  function handleCancelPreview() {
    setPreview(null)
    setError(null)
  }

  async function handleRemove() {
    if (removeAvatar.isPending) return
    setError(null)
    try {
      await removeAvatar.mutateAsync()
    } catch {
      setRemoveOpen(false)
      showError(REMOVE_MESSAGE)
      return
    }
    setRemoveOpen(false)
  }

  return (
    <div
      className={cn('flex flex-col gap-2 lg:gap-1.5', className)}
      role="group"
      aria-labelledby={labelId}
    >
      <span id={labelId} className="text-body">
        Avatar
      </span>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-6">
          <Avatar className="size-12.5 border border-border bg-card max-lg:size-16">
            <AvatarImage src={shownUrl} alt="Sua foto de perfil" className="object-cover" />
            <AvatarFallback className="bg-card text-primary" aria-hidden="true">
              <ImageIcon aria-hidden="true" className="size-5.5" />
            </AvatarFallback>
          </Avatar>
          <Button
            ref={changeButtonRef}
            type="button"
            variant="default"
            onClick={handleChangeClick}
            disabled={upload.isPending}
            aria-busy={upload.isPending}
            className="h-10 w-[98px] font-bold max-lg:h-11 max-lg:rounded-3xl"
          >
            {upload.isPending && (
              <Loader2Icon aria-hidden="true" className="motion-safe:animate-spin" />
            )}
            {preview !== null ? 'Usar esta foto' : 'Alterar'}
          </Button>
        </div>
        {preview !== null ? (
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancelPreview}
            disabled={upload.isPending}
            className="h-10 px-0 text-foreground hover:bg-transparent max-lg:h-11"
          >
            Cancelar
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            aria-disabled={!hasPhoto}
            onClick={() => {
              if (hasPhoto) setRemoveOpen(true)
            }}
            className="h-10 px-0 text-foreground hover:bg-transparent max-lg:h-11"
          >
            Remover
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleFileChange}
      />
      {error !== null && (
        <p role="alert" className="text-caption text-destructive">
          {error}
        </p>
      )}

      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            changeButtonRef.current?.focus()
          }}
        >
          <DialogHeader>
            <DialogTitle>Remover foto?</DialogTitle>
            <DialogDescription>Sua foto de perfil será removida.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={removeAvatar.isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={() => void handleRemove()}
              disabled={removeAvatar.isPending}
              aria-busy={removeAvatar.isPending}
            >
              {removeAvatar.isPending && (
                <Loader2Icon aria-hidden="true" className="motion-safe:animate-spin" />
              )}
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
