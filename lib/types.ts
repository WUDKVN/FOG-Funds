export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  comment?: string
  settled?: boolean
  originalAmount?: number // Added to store original amount when marking as paid
  signature?: string // Added to store signature for the transaction
  settlementDate?: string // Added to store the date when the transaction was settled
  isPayment?: boolean // Added to identify payment transactions
  dueDate?: string // Payment deadline - if passed and not settled, shows in red
}

export interface Person {
  id: string
  name: string
  transactions: Transaction[]
  signature?: string
}

// Activity log for tracking all changes in the app
export interface ActivityLog {
  id: string
  timestamp: string // Full date and time
  userId: string // User who made the change (login username)
  userName: string // Display name of user
  action: "create" | "edit" | "delete" | "settle" | "payment" | "unsettle"
  category: "they-owe-me" | "i-owe-them"
  description: string // Full sentence describing the change
  personName?: string // Person involved in the transaction
  amount?: number // Amount involved
}

// Login log for tracking login/logout activities
export interface LoginLog {
  id: string
  userId: string
  userName: string
  userEmail: string
  action: "login" | "logout"
  ipAddress?: string
  deviceInfo?: string
  browserInfo?: string
  location?: string
  createdAt: string // Full date and time
}

// User with role information
export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: "admin" | "user"
  isActive: boolean
  avatarUrl?: string
  preferredLanguage: "fr" | "en"
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

// Admin permission grant
export interface AdminPermission {
  id: string
  userId: string
  grantedBy: string
  canViewHistory: boolean
  canViewLogs: boolean
  canGrantAdmin: boolean
  createdAt: string
  expiresAt?: string
}
