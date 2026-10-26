import { cn } from '@/lib/utils'

import { FooterNewsletter } from './FooterNewsletter'

const HIGHLIGHTS = [
  {
    letter: 'W',
    title: 'Segurança da carteira',
    description: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    letter: 'C',
    title: 'Criadores em destaque',
    description: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    letter: 'D',
    title: 'Alertas de lançamentos',
    description:
      'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

// Faixa superior do rodapé (desktop): o AppShell esconde o rodapé abaixo de 1024 px.
export function FooterHighlights() {
  return (
    <div className="grid pt-8 pb-4 lg:grid-cols-[297fr_266fr_266fr_371fr]">
      {HIGHLIGHTS.map((item, index) => (
        <div
          key={item.letter}
          className={cn(index === 0 ? 'lg:pl-12' : 'border-l border-primary pl-4')}
        >
          <span
            aria-hidden="true"
            className="flex size-18.5 items-center justify-center rounded-full bg-primary text-heading font-bold text-primary-foreground"
          >
            {item.letter}
          </span>
          <h2 className="mt-1.75 text-subtitle font-bold text-foreground">{item.title}</h2>
          <p className="mt-1.25 max-w-50 text-sm leading-5.5 text-muted-foreground">
            {item.description}
          </p>
        </div>
      ))}

      <div className="border-l border-primary px-4">
        <FooterNewsletter />
      </div>
    </div>
  )
}
