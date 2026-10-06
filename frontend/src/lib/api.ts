import axios from 'axios'

export const api = axios.create({ baseURL: '/api', withCredentials: true })

api.interceptors.request.use((config) => {
  const csrf = document.cookie
    .split('; ')
    .find((part) => part.startsWith('techkart_csrf='))
    ?.split('=')[1]
  if (csrf && config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
    config.headers = config.headers ?? {}
    config.headers['X-CSRF-Token'] = decodeURIComponent(csrf)
  }
  return config
})

/** @deprecated use useAuth().user.id instead — kept only as a safe fallback for dev/demo flows */
export const CURRENT_CUSTOMER_ID = 1

// ---- Types ----
export interface Category {
  id: number
  name: string
  icon?: string | null
  domain: 'ecommerce' | 'agriculture'
}

export interface Product {
  id: number
  name: string
  brand?: string | null
  description?: string | null
  price: number
  original_price?: number | null
  stock: number
  image_url?: string | null
  warranty?: string | null
  rating: number
  rating_count: number
  is_featured: boolean
  category_id: number
  category?: Category | null
  active_deal?: ActiveDeal | null
  created_at: string
}

export interface CartItem {
  id: number
  quantity: number
  product: Product
}

export interface WishlistItem {
  id: number
  product: Product
}

export interface OrderItem {
  id: number
  quantity: number
  unit_price: number
  product: Product
}

export interface Order {
  id: number
  status: string
  total_amount: number
  shipping_address?: string | null
  payment_method: string
  created_at: string
  items: OrderItem[]
}

export interface AssistantActionOption {
  id: number
  order_id?: number
  item_id?: number
  label: string
  subtitle: string
  status?: string
}

export interface AssistantAction {
  type: 'order_list' | 'order_detail' | 'select_order' | 'select_item' | 'confirm_order_action' | 'action_completed' | 'info'
  operation?: string
  order_id?: number
  item_id?: number
  label?: string
  order?: AssistantActionOption
  options?: AssistantActionOption[]
  status?: string
}

export interface AssistantResponse {
  reply: string
  sentiment: string
  intent: string
  next_best_action: string
  language?: 'en' | 'hi' | 'te' | null
  products: { id: number; name: string; price: number; stock: number; rating: number; image_url?: string | null }[]
  action?: AssistantAction | null
}

export interface Review {
  id: number
  rating: number
  comment?: string | null
  is_approved: boolean
  created_at: string
  customer?: { id: number; name: string } | null
}

export interface Deal {
  id: number
  discount_percent: number
  starts_at: string
  ends_at?: string | null
  is_active: boolean
  product: Product
}

export interface ActiveDeal {
  id: number
  discount_percent: number
  starts_at: string
  ends_at?: string | null
  is_active: boolean
}

export interface Banner {
  id: number
  title: string
  image_url?: string | null
  link_url?: string | null
  is_active: boolean
}

export interface TicketMessage {
  id: number
  sender: 'customer' | 'admin'
  message: string
  created_at: string
}

export interface Ticket {
  id: number
  subject: string
  message: string
  status: string
  is_escalated: boolean
  escalation_reason?: string | null
  created_at: string
  customer?: { id: number; name: string } | null
  messages: TicketMessage[]
}

export interface Notification {
  id: number
  title: string
  message: string
  type: 'info' | 'order' | 'support' | 'recommendation'
  link_url?: string | null
  is_read: boolean
  created_at: string
}

export interface Customer {
  id: number
  name: string
  email: string
  phone?: string | null
  city?: string | null
  role: 'customer' | 'farmer' | 'admin'
  language: 'en' | 'te' | 'hi'
  created_at: string
}

// ---- Auth ----
export interface AuthUser {
  id: number
  name: string
  email: string
  phone?: string | null
  city?: string | null
  role: 'customer' | 'farmer' | 'admin'
  language: 'en' | 'te' | 'hi'
}

export interface TokenResponse {
  access_token?: string | null
  token_type: string
  user: AuthUser
}

// ---- Agriculture ----
export interface Crop {
  id: number
  name: string
  variety?: string | null
  area_acres?: number | null
  planted_on?: string | null
  notes?: string | null
  created_at: string
  customer?: { id: number; name: string } | null
}

export interface CropIssue {
  id: number
  issue_type: string
  description: string
  image_url?: string | null
  status: string
  ai_recommendation?: string | null
  created_at: string
  customer?: { id: number; name: string } | null
  crop?: Crop | null
}

export interface Advisory {
  id: number
  title: string
  content: string
  crop_type?: string | null
  created_at: string
}

export interface Scheme {
  id: number
  title: string
  description: string
  link_url?: string | null
  is_active: boolean
  created_at: string
}

// ---- Knowledge Base & Conversations ----
export interface KnowledgeBaseArticle {
  id: number
  title: string
  content: string
  domain: 'ecommerce' | 'agriculture'
  language: 'en' | 'te' | 'hi'
  created_at: string
  updated_at: string
}

export interface KnowledgeDocument {
  id: number
  original_filename: string
  content_type: string
  size_bytes: number
  page_count: number
  chunk_count: number
  domain: 'ecommerce' | 'agriculture'
  language: 'en' | 'te' | 'hi'
  created_at: string
}

export interface ConversationMessage {
  id: number
  sender: 'customer' | 'assistant'
  content: string
  sentiment?: string | null
  intent?: string | null
  next_best_action?: string | null
  created_at: string
}

export interface Conversation {
  id: number
  customer_id: number
  domain: 'ecommerce' | 'agriculture'
  created_at: string
  updated_at: string
  messages: ConversationMessage[]
}

export interface ConversationSummary {
  id: number
  customer_id: number
  customer_name?: string | null
  domain: 'ecommerce' | 'agriculture'
  message_count: number
  last_message?: string | null
  last_sentiment?: string | null
  updated_at: string
}

export interface SentimentBreakdown {
  sentiment: string
  count: number
}

export interface IssueTypeBreakdown {
  issue_type: string
  count: number
  percent: number
}

export interface AgriDashboardStats {
  total_farmers: number
  total_crop_entries: number
  total_agri_orders: number
  total_agri_revenue: number
  crop_issues_reported: number
  crop_issues_this_week: number
}

export interface DashboardStats {
  total_orders: number
  total_customers: number
  total_revenue: number
  total_products: number
  orders_growth_pct: number
  customers_growth_pct: number
  revenue_growth_pct: number
  products_growth_pct: number
}

export interface SalesPoint {
  label: string
  value: number
}

export interface OrderStatusBreakdown {
  status: string
  count: number
  percent: number
}

export interface TopProduct {
  product_id: number
  name: string
  image_url?: string | null
  order_count: number
  price: number
}

export interface LowStockProduct {
  product_id: number
  name: string
  stock: number
  image_url?: string | null
}

export interface CategoryShare {
  name: string
  percent: number
}
