import { createFileRoute, Outlet } from '@tanstack/react-router'

// Layout do perfil. 04-029 troca o Outlet pelo ProfileLayout.
export const Route = createFileRoute('/perfil')({
  staticData: { footer: false },
  component: Outlet,
})
