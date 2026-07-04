export interface JwtPayload {
  userId: number
  username: string
  role: 'HEADMASTER' | 'TEACHER' | 'STUDENT'
}

export interface LoginRequest {
  username: string
  password: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
}
