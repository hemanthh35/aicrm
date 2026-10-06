import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Product } from './api'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getEffectivePrice(product: Pick<Product, 'price' | 'active_deal'>) {
  const discount = product.active_deal?.discount_percent ?? 0
  return Math.max(0, Math.round(product.price * (1 - discount / 100) * 100) / 100)
}
