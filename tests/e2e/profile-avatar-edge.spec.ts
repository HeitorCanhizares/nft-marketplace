/// <reference lib="dom" />
import { expect, test, type Page, type TestInfo } from '@playwright/test'

import {
  announcements,
  collectAnnouncements,
  openApp,
  ready,
  recordApi,
  signInAs,
} from './helpers.ts'

const isDesktop = (testInfo: TestInfo) => testInfo.project.name === 'desktop'

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)
const TXT_FILE = Buffer.from('conteudo de texto nao suportado')
const LARGE_FILE = Buffer.alloc(2 * 1024 * 1024 + 1024)

async function openProfileData(page: Page) {
  await openApp(page)
  await signInAs(page, 'primary')
  await page.goto('/perfil/dados')
  await ready(page)
  await expect(page.getByLabel('Nome de exibição')).toHaveValue('Teste Kurio')
}

const fileInput = (page: Page) => page.locator('input[type="file"]')
const dialogOf = (page: Page, name: string) => page.getByRole('dialog', { name })
const avatarAlert = (page: Page) => page.getByRole('group', { name: 'Avatar' }).getByRole('alert')

test.describe('Perfil — upload, prévia, remoção e erros de avatar (13-052)', () => {
  test('1. Arquivo fora de png/jpg/webp e acima de 2 MB rejeitado no front e no mock (422 fields.file)', async ({
    page,
  }) => {
    await openProfileData(page)
    await collectAnnouncements(page)

    // 1) Rejeição de formato no front:
    await fileInput(page).setInputFiles({
      name: 'documento.txt',
      mimeType: 'text/plain',
      buffer: TXT_FILE,
    })
    await expect(avatarAlert(page)).toHaveText('Use uma imagem PNG, JPG ou WEBP.')
    expect(await announcements(page)).toContain('Use uma imagem PNG, JPG ou WEBP.')

    // 2) Rejeição de tamanho acima de 2 MB no front:
    await fileInput(page).setInputFiles({
      name: 'grande.png',
      mimeType: 'image/png',
      buffer: LARGE_FILE,
    })
    await expect(avatarAlert(page)).toHaveText('A imagem deve ter até 2 MB.')
    expect(await announcements(page)).toContain('A imagem deve ter até 2 MB.')

    // 3) Chamada direta ao mock rejeitando formato inválido com 422:
    const invalidTypeOutcome = await page.evaluate(async () => {
      const raw = localStorage.getItem('kurio:session')
      const session = raw ? (JSON.parse(raw) as { token?: string }) : null
      const token = session?.token ?? ''
      const form = new FormData()
      form.append('file', new File(['texto'], 'teste.txt', { type: 'text/plain' }))
      const res = await fetch('/api/profile/avatar', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const body = (await res.json()) as {
        error?: { code?: string; fields?: { file?: string } }
      }
      return { status: res.status, body }
    })
    expect(invalidTypeOutcome.status).toBe(422)
    expect(invalidTypeOutcome.body.error?.fields?.file).toBe('Use uma imagem PNG, JPG ou WEBP.')

    // 4) Chamada direta ao mock rejeitando tamanho acima de 2 MB com 422:
    const largeFileOutcome = await page.evaluate(async () => {
      const raw = localStorage.getItem('kurio:session')
      const session = raw ? (JSON.parse(raw) as { token?: string }) : null
      const token = session?.token ?? ''
      const blob = new Blob([new Uint8Array(2 * 1024 * 1024 + 100)], { type: 'image/png' })
      const form = new FormData()
      form.append('file', new File([blob], 'grande.png', { type: 'image/png' }))
      const res = await fetch('/api/profile/avatar', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      const body = (await res.json()) as {
        error?: { code?: string; fields?: { file?: string } }
      }
      return { status: res.status, body }
    })
    expect(largeFileOutcome.status).toBe(422)
    expect(largeFileOutcome.body.error?.fields?.file).toBe('A imagem deve ter até 2 MB.')
  })

  test('2. Prévia cancelada revoga a URL; clique repetido em "Usar esta foto" e "Remover" gera uma requisição', async ({
    page,
  }) => {
    await openProfileData(page)

    // Espia URL.revokeObjectURL
    await page.evaluate(`(() => {
      window.__revokedUrls = []
      const orig = URL.revokeObjectURL
      URL.revokeObjectURL = (u) => {
        window.__revokedUrls.push(u)
        orig(u)
      }
    })()`)

    // Seleciona um arquivo válido
    await fileInput(page).setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: PNG })
    const useButton = page.getByRole('button', { name: 'Usar esta foto' })
    const cancelButton = page.getByRole('button', { name: 'Cancelar' })
    await expect(useButton).toBeVisible()
    await expect(cancelButton).toBeVisible()

    // Cancela a prévia e confere que a URL gerada foi revogada
    await cancelButton.click()
    await expect(useButton).toBeHidden()
    const revokedUrls = await page.evaluate<string[]>('window.__revokedUrls')
    expect(revokedUrls.length).toBeGreaterThan(0)

    // Seleciona novamente para testar duplo clique em "Usar esta foto"
    await fileInput(page).setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: PNG })
    await expect(useButton).toBeVisible()

    const api = recordApi(page)
    await useButton.click({ clickCount: 3 })
    await expect(page.getByRole('img', { name: 'Sua foto de perfil' })).toBeVisible()
    expect(api.calls('PUT', '/profile/avatar')).toHaveLength(1)

    // Testa duplo clique em "Remover" dentro do modal de confirmação
    await page.getByRole('button', { name: 'Remover' }).click()
    const dialog = dialogOf(page, 'Remover foto?')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Remover' }).click({ clickCount: 3 })
    await expect(dialog).toBeHidden()
    expect(api.calls('DELETE', '/profile/avatar')).toHaveLength(1)
  })

  test('3. 5xx/rede no envio mantém a prévia; erro ao remover mantém a foto; "Remover" desabilitado sem foto; avatar do UserMenu atualiza junto', async ({
    page,
  }, testInfo) => {
    await openProfileData(page)

    // 1) "Remover" desabilitado quando não há foto
    await expect(page.getByRole('button', { name: 'Remover' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )

    // 2) Falha 5xx no envio mantém a prévia e botões ativos
    await fileInput(page).setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: PNG })
    const useButton = page.getByRole('button', { name: 'Usar esta foto' })
    await expect(useButton).toBeVisible()

    await page.evaluate(
      `localStorage.setItem('kurio:mock:scenarios', 'server-error:PUT /profile/avatar')`,
    )
    await useButton.click()
    await expect(avatarAlert(page)).toHaveText('Não foi possível enviar a foto. Tente novamente.')
    // A prévia permanece na tela após a falha
    await expect(useButton).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancelar' })).toBeVisible()

    // 3) Envia foto com sucesso (limpando o cenário forçado) e confere que UserMenu atualiza (desktop)
    await page.evaluate(`localStorage.removeItem('kurio:mock:scenarios')`)
    await useButton.click()
    await expect(page.getByRole('img', { name: 'Sua foto de perfil' })).toBeVisible()
    if (isDesktop(testInfo)) {
      await expect(page.getByRole('button', { name: /^Menu de/ }).locator('img')).toBeVisible()
    }

    // 4) Falha 500 ao remover mantém a foto
    await page.evaluate(
      `localStorage.setItem('kurio:mock:scenarios', 'server-error:DELETE /profile/avatar')`,
    )
    await page.getByRole('button', { name: 'Remover' }).click()
    const dialog = dialogOf(page, 'Remover foto?')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Remover' }).click()
    await expect(dialog).toBeHidden()
    await expect(avatarAlert(page)).toHaveText('Não foi possível remover a foto. Tente novamente.')
    // A foto continua visível
    await expect(page.getByRole('img', { name: 'Sua foto de perfil' })).toBeVisible()

    // 5) Remove com sucesso (limpando o cenário de erro): foto sai e UserMenu atualiza
    await page.evaluate(`localStorage.removeItem('kurio:mock:scenarios')`)
    await page.getByRole('button', { name: 'Remover' }).click()
    await dialogOf(page, 'Remover foto?').getByRole('button', { name: 'Remover' }).click()
    await expect(page.getByRole('img', { name: 'Sua foto de perfil' })).toHaveCount(0)
    if (isDesktop(testInfo)) {
      await expect(page.getByRole('button', { name: /^Menu de/ }).locator('img')).toHaveCount(0)
    }
  })
})
