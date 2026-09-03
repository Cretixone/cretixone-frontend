import cretixAxios from '@/store/api/cretixAxios'

interface Ok<T> {
  success: true
  data: T
}

export interface TeamMember {
  id: string
  name: string
  nameAr: string | null
  position: string
  positionAr: string | null
  email: string | null
  image: string | null
}

export const teamApi = {
  /** Active members, in the admin's chosen order — the whole Team page grid. */
  async list(): Promise<TeamMember[]> {
    const res = await cretixAxios.get<Ok<TeamMember[]>>('/team/public')
    return res.data.data
  },
}
