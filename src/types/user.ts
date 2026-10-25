import type { Network, WalletProvider } from './nft'

export type User = {
  id: string
  displayName: string
  username: string
  email: string
  ensName?: string
  walletNickname?: string
  avatarUrl?: string
}

export type Session = {
  token: string
  expiresAt: string
}

export type Wallet = {
  id: string
  slot: 'primary' | 'secondary'
  displayName: string
  username: string
  nickname: string
  profileName: string
  network: Network
  address: string
  secondaryAddressOrEns?: string
  provider: WalletProvider
  referralCode: string
  email: string
  ensName: string
}

export type WalletsResponse = {
  primary: Wallet | null
  secondary: Wallet | null
}
