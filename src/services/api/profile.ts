import { userSchema } from '@/schemas/user'
import { avatarResponseSchema, type ChangePasswordBody, type ProfileBody } from '@/schemas/profile'
import { del, get, patch, post, put } from '@/services/http/validate'

export function getProfile(signal?: AbortSignal) {
  return get('/profile', userSchema, { signal })
}

export function updateProfile(body: ProfileBody) {
  return patch('/profile', userSchema, body)
}

// Sem Content-Type manual: o axios define multipart/form-data com o limite ao receber FormData.
export function uploadAvatar(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return put('/profile/avatar', avatarResponseSchema, formData)
}

export function removeAvatar() {
  return del('/profile/avatar', null)
}

export function changePassword(body: ChangePasswordBody) {
  return post('/profile/password', null, body)
}
