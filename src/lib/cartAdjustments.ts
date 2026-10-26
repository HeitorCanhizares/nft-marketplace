import type { CartAdjustment } from '@/types/cart'

// Frase do aviso para um ajuste de estoque do carrinho mesclado.
export function describeAdjustment(adjustment: CartAdjustment): string {
  const { nftName, editionLabel, requested, applied } = adjustment

  if (applied > 0) {
    const unit = applied === 1 ? 'unidade' : 'unidades'
    return `Ajustamos ${nftName} (${editionLabel}) de ${requested} para ${applied} ${unit}, o estoque disponível.`
  }

  return `Removemos ${nftName} (${editionLabel}) do carrinho: sem estoque disponível.`
}

// Uma frase por ajuste, na ordem recebida.
export function describeAdjustments(adjustments: readonly CartAdjustment[]): string[] {
  return adjustments.map(describeAdjustment)
}
