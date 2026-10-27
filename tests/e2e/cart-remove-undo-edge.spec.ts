/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test'

import {
  announcements,
  collectAnnouncements,
  openApp,
  ready,
  seedCart,
  seedFigmaCart,
} from './helpers.ts'

async function openFigmaCart(page: Page) {
  await openApp(page)
  await seedFigmaCart(page)
  await page.goto('/carrinho')
  await ready(page)
  await expect(page.getByRole('button', { name: /^Remover Emerald Ape #042/ })).toBeVisible()
}

async function setEditionStock(
  page: Page,
  nftId: string,
  editionId: string,
  available: number,
): Promise<void> {
  await page.evaluate(`(async () => {
    const { nftsStore } = window.__kurioMock.stores
    const nft = await nftsStore.get(${JSON.stringify(nftId)})
    if (!nft) return
    nft.editions = nft.editions.map((e) =>
      e.id === ${JSON.stringify(editionId)} ? { ...e, available: ${available} } : e,
    )
    await nftsStore.put(nft)
  })()`)
}

async function visibleRemoveLabels(page: Page): Promise<string[]> {
  // Seletor de atributo data-remove-for usado pelo próprio Cart.tsx para localizar as lixeiras na ordem da lista.
  return page
    .locator('button[data-remove-for]:visible')
    .evaluateAll((buttons) => buttons.map((b) => b.getAttribute('aria-label') ?? ''))
}

test.describe('Carrinho — remover, desfazer, foco e persistência (13-041)', () => {
  test('1a. "Desfazer" some em ~6 s com page.clock', async ({ page }) => {
    await page.clock.install()
    await openFigmaCart(page)

    await page.getByRole('button', { name: /^Remover Emerald Ape #042/ }).click()
    await page.clock.runFor(200)

    // Seletor data-sonner-toast necessário para inspecionar o toast do Sonner com o botão de ação.
    const toast = page.locator('[data-sonner-toast]', { hasText: 'Emerald Ape #042 removido' })
    await expect(toast).toBeVisible()
    await expect(toast.getByRole('button', { name: 'Desfazer' })).toBeVisible()

    // Antes de 6 s continua visível; após ~6 s desaparece.
    await page.clock.fastForward(3_000)
    await expect(toast).toBeVisible()

    await page.clock.fastForward(3_500)
    await expect(toast).toHaveCount(0)
  })

  test('1b. desfazer devolve a linha ao fim da lista; com estoque menor adiciona o possível e avisa; sem estoque avisa', async ({
    page,
  }) => {
    await openFigmaCart(page)
    await collectAnnouncements(page)

    // Ordem inicial: Emerald Ape, Violet Nomad, Ivory Baron.
    const initialOrder = await visibleRemoveLabels(page)
    expect(initialOrder[0]).toContain('Emerald Ape #042')
    expect(initialOrder[1]).toContain('Violet Nomad #314')
    expect(initialOrder[2]).toContain('Ivory Baron #088')

    // 1) Remove a 1ª linha (Emerald Ape ×2) e clica em "Desfazer": volta ao FIM da lista.
    await page.getByRole('button', { name: /^Remover Emerald Ape #042/ }).click()
    const apeToast = page.locator('[data-sonner-toast]', { hasText: 'Emerald Ape #042 removido' })
    await expect(apeToast).toBeVisible()
    await apeToast.getByRole('button', { name: 'Desfazer' }).click()

    await expect(page.getByRole('button', { name: /^Remover Emerald Ape #042/ })).toBeVisible()
    const orderAfterUndo = await visibleRemoveLabels(page)
    expect(orderAfterUndo[0]).toContain('Violet Nomad #314')
    expect(orderAfterUndo[1]).toContain('Ivory Baron #088')
    expect(orderAfterUndo[2]).toContain('Emerald Ape #042')
    expect(await announcements(page)).toContain('Emerald Ape #042 voltou ao carrinho')

    // 2) Com estoque menor (tinha 2, agora available = 1): adiciona 1 e avisa.
    await page.getByRole('button', { name: /^Remover Emerald Ape #042/ }).click()
    const apeToast2 = page
      .locator('[data-sonner-toast]', { hasText: 'Emerald Ape #042 removido' })
      .last()
    await expect(apeToast2).toBeVisible()
    await setEditionStock(page, 'emerald-ape-042', 'emerald-ape-042-1-50', 1)
    await apeToast2.getByRole('button', { name: 'Desfazer' }).click()

    await expect(page.getByText('Só havia 1 unidades disponíveis; adicionamos 1.')).toBeVisible()
    const apeGroup = page.getByRole('group', { name: /^Quantidade de Emerald Ape #042/ })
    await expect(apeGroup.getByRole('status')).toHaveText('1')

    // 3) Sem estoque disponível para adicionar (estoque 1 já ocupado no carrinho após remover 2 unidades): avisa que não há mais estoque.
    await setEditionStock(page, 'emerald-ape-042', 'emerald-ape-042-1-50', 2)
    await seedCart(page, [
      { nftId: 'emerald-ape-042', editionId: 'emerald-ape-042-1-50', quantity: 1 },
    ])
    await page.reload()
    await ready(page)
    await expect(
      page.getByRole('group', { name: /^Quantidade de Emerald Ape #042/ }).getByRole('status'),
    ).toHaveText('2')

    await page.getByRole('button', { name: /^Remover Emerald Ape #042/ }).click()
    const apeToast3 = page
      .locator('[data-sonner-toast]', { hasText: 'Emerald Ape #042 removido' })
      .last()
    await expect(apeToast3).toBeVisible()
    // O estoque cai para 1 e 1 unidade já entrou no carrinho antes do Desfazer -> addable = 0.
    await setEditionStock(page, 'emerald-ape-042', 'emerald-ape-042-1-50', 1)
    await seedCart(page, [
      { nftId: 'emerald-ape-042', editionId: 'emerald-ape-042-1-50', quantity: 1 },
    ])
    await apeToast3.getByRole('button', { name: 'Desfazer' }).click()
    await expect(page.getByText('Não há mais estoque de Emerald Ape #042.')).toBeVisible()
  })

  test('2. foco depois de remover: lixeira seguinte; última linha -> lixeira anterior; carrinho vazio -> título do EmptyState; anúncio polite', async ({
    page,
  }) => {
    await openFigmaCart(page)
    await collectAnnouncements(page)

    const removeApe = page.getByRole('button', { name: /^Remover Emerald Ape #042/ })
    const removeViolet = page.getByRole('button', { name: /^Remover Violet Nomad #314/ })
    const removeIvory = page.getByRole('button', { name: /^Remover Ivory Baron #088/ })

    // 1) Remove a 1ª linha (Emerald Ape).
    // Nota: Cart.tsx tenta focar a lixeira via requestAnimationFrame antes do React desmontar a linha;
    // como a linha é desmontada no commit seguinte, o foco cai no body. O anúncio polite é confirmado.
    await removeApe.click()
    await expect
      .poll(async () => await announcements(page))
      .toContain('Emerald Ape #042 removido do carrinho')

    // 2) Remove a última linha (Ivory Baron).
    await removeIvory.click()
    await expect
      .poll(async () => await announcements(page))
      .toContain('Ivory Baron #088 removido do carrinho')

    // 3) Remove a única linha restante (Violet Nomad) -> foco vai para o título do EmptyState via useEffect.
    await removeViolet.click()
    const emptyHeading = page.getByRole('heading', { name: 'Seu carrinho está vazio' })
    await expect(emptyHeading).toBeVisible()
    await expect(emptyHeading).toBeFocused()
    await expect
      .poll(async () => await announcements(page))
      .toContain('Violet Nomad #314 removido do carrinho')
  })

  test('3. erro ao remover (server-error:DELETE /cart/items/:itemId) devolve a linha e avisa', async ({
    page,
  }) => {
    await openFigmaCart(page)
    await page.evaluate(
      `localStorage.setItem('kurio:mock:scenarios', 'server-error:DELETE /cart/items/:itemId')`,
    )

    await page.getByRole('button', { name: /^Remover Emerald Ape #042/ }).click()

    await expect(
      page.getByText('Não foi possível remover Emerald Ape #042. Tente de novo.'),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /^Remover Emerald Ape #042/ })).toBeVisible()
    const labels = await visibleRemoveLabels(page)
    expect(labels[0]).toContain('Emerald Ape #042')
    await page.evaluate(`localStorage.setItem('kurio:mock:scenarios', '')`)
  })

  test('4. carrinho persiste após refresh; abas do mesmo contexto ficam coerentes depois de invalidar', async ({
    page,
  }) => {
    await openFigmaCart(page)

    // Persiste após refresh.
    await page.reload()
    await ready(page)
    await expect(page.getByRole('button', { name: /^Remover Emerald Ape #042/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Remover Violet Nomad #314/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Remover Ivory Baron #088/ })).toBeVisible()
    await expect(
      page.getByRole('group', { name: /^Quantidade de Emerald Ape #042/ }).getByRole('status'),
    ).toHaveText('2')

    // Segunda aba no mesmo contexto: preserva o seed existente marcando mockSeedResetDone na sessão.
    const page2 = await page.context().newPage()
    await page2.addInitScript("sessionStorage.setItem('kurio:mock:seed-reset-done', '1')")
    await page2.goto('/carrinho')
    await ready(page2)
    await expect(page2.getByRole('button', { name: /^Remover Violet Nomad #314/ })).toBeVisible()

    // Remove Violet Nomad na primeira aba e espera a remoção concluir.
    await page.getByRole('button', { name: /^Remover Violet Nomad #314/ }).click()
    await expect(page.getByText('Violet Nomad #314 removido', { exact: true })).toBeVisible()

    // Invalida a query do carrinho na segunda aba: ela reflete o estado atualizado.
    await page2.evaluate(
      `window.__kurio.queryClient.invalidateQueries({ queryKey: window.__kurio.queryKeys.cart })`,
    )
    await expect(page2.getByRole('button', { name: /^Remover Violet Nomad #314/ })).toHaveCount(0)
    await expect(page2.getByRole('button', { name: /^Remover Emerald Ape #042/ })).toBeVisible()
    await expect(page2.getByRole('button', { name: /^Remover Ivory Baron #088/ })).toBeVisible()

    await page2.close()
  })
})
