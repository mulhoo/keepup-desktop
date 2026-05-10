import { api } from './client'

export type ResourceType = 'school_icon' | 'school_banner' | 'sport_emoji' | 'sport_banner' | 'profile_photo'

interface PresignResponse {
  presigned_url: string
  key: string
  public_url: string
}

export async function presignUpload(
  resourceType: ResourceType,
  resourceId: number,
  file: File,
): Promise<string> {
  const { presigned_url, public_url } = await api.post<PresignResponse>('/uploads/presign', {
    resource_type: resourceType,
    resource_id: resourceId,
    filename: file.name,
    content_type: file.type,
  })

  await fetch(presigned_url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })

  return public_url
}
