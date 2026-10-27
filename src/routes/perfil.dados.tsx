import { createFileRoute } from '@tanstack/react-router'

import { Profile } from '@/pages/Profile/Profile'

export const Route = createFileRoute('/perfil/dados')({
  staticData: { title: 'Dados do perfil' },
  component: Profile,
})
