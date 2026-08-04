export const ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  SUPPORT: 'support',
  CREATOR: 'creator',
  SUBSCRIBER: 'subscriber',
})

export const ROLE_LABELS = Object.freeze({
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.MODERATOR]: 'Moderador',
  [ROLES.SUPPORT]: 'Soporte',
  [ROLES.CREATOR]: 'Creador',
  [ROLES.SUBSCRIBER]: 'Suscriptor',
})

export const ROLE_LEVELS = Object.freeze({
  [ROLES.SUPER_ADMIN]: 100,
  [ROLES.ADMIN]: 80,
  [ROLES.MODERATOR]: 60,
  [ROLES.SUPPORT]: 40,
  [ROLES.CREATOR]: 20,
  [ROLES.SUBSCRIBER]: 10,
})

export const POST_VISIBILITY = Object.freeze({
  FREE: 'free',
  SUBSCRIBERS: 'subscribers',
  PPV: 'ppv',
})

export const SUBSCRIPTION_STATUS = Object.freeze({
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
})

export const REPORT_STATUS = Object.freeze({
  PENDING: 'pending',
  REVIEWING: 'reviewing',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed',
})

export const PAYMENT_PROVIDERS = Object.freeze(['stripe', 'ccbill', 'segpay'])

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
})
