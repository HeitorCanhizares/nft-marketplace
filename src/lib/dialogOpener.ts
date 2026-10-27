// Quem abriu o modal. O Radix só devolve o foco a um Dialog.Trigger, que aqui não existe (os modais
// são rotas). Fica no módulo para sobreviver à troca entre modais irmãos, em que a rota troca o
// componente (Entrar e Criar conta).
let opener: HTMLElement | null = null

// Chamar ao abrir o modal, antes de o foco entrar nele.
export function rememberOpener() {
  const active = document.activeElement
  if (
    active instanceof HTMLElement &&
    active !== document.body &&
    !active.closest('[role="dialog"]')
  ) {
    opener = active
  }
}

// Usar em `onCloseAutoFocus`: devolve o foco a quem abriu o modal.
export function restoreOpenerFocus(event: Event) {
  // Troca de modal: outro modal já tomou o lugar e o foco dele não pode ser roubado.
  if (document.querySelector('[role="dialog"]')) return

  const target = opener
  opener = null
  if (!target?.isConnected) return

  event.preventDefault()
  target.focus()
}
