import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Увеличиваем лимиты для API запросов
  const response = NextResponse.next()
  
  // Устанавливаем заголовки для увеличения лимитов
  response.headers.set('Content-Type', 'application/json')
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400') // 24 часа

  return response
}

export const config = {
  matcher: '/api/:path*',
} 