import { Purchases, type Package, type CustomerInfo, type Offerings } from '@revenuecat/purchases-js'

export type { Package }

export const REVENUECAT_PUBLIC_KEY =
  import.meta.env.VITE_REVENUECAT_PUBLIC_KEY || 'rcb_sb_test_store_key'
export const OFFERING_ID = 'default'
export const ENTITLEMENT_ID = 'nook_pro'
export const PATRON_STORAGE_KEY = 'nook_patron_unlocked'
export const ANONYMOUS_USER_ID_KEY = 'nook_rc_anonymous_id'

let purchasesInstance: Purchases | null = null

/**
 * Returns or generates a persistent anonymous user ID stored in localStorage.
 * No user accounts, logins, or telemetry identifiers required.
 */
export function getAnonymousUserId(): string {
  if (typeof window === 'undefined') return 'nook_server_user'
  let id = localStorage.getItem(ANONYMOUS_USER_ID_KEY)
  if (!id) {
    id =
      'nook_anon_' +
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Date.now().toString(36))
    localStorage.setItem(ANONYMOUS_USER_ID_KEY, id)
  }
  return id
}

/**
 * Initializes Purchases instance using the anonymous persistent ID.
 */
export function initPurchases(): Purchases | null {
  if (typeof window === 'undefined') return null
  if (purchasesInstance) return purchasesInstance

  const appUserId = getAnonymousUserId()
  const apiKey = REVENUECAT_PUBLIC_KEY

  if (!apiKey || apiKey === 'rcb_sb_test_store_key') {
    // In test/demo mode without configured key, log once
    console.info('[RevenueCat] Running with test store key or placeholder. Set VITE_REVENUECAT_PUBLIC_KEY for live store.')
  }

  try {
    purchasesInstance = Purchases.configure({
      apiKey,
      appUserId,
    })
    return purchasesInstance
  } catch (err) {
    console.warn('[RevenueCat] Initialization deferred or error:', err)
    return null
  }
}

/**
 * Fetches package details from the "default" offering.
 */
export async function getDefaultOfferingPackage(): Promise<Package | null> {
  try {
    const purchases = initPurchases()
    if (!purchases) return null

    const offerings: Offerings = await purchases.getOfferings()
    const defaultOffering = offerings.all[OFFERING_ID] || offerings.current
    if (!defaultOffering) {
      return null
    }

    if (defaultOffering.lifetime) {
      return defaultOffering.lifetime
    }

    if (defaultOffering.availablePackages && defaultOffering.availablePackages.length > 0) {
      return defaultOffering.availablePackages[0]
    }

    return null
  } catch (err) {
    console.warn('[RevenueCat] Error fetching package from default offering:', err)
    return null
  }
}

export interface PurchaseResultResponse {
  success: boolean
  customerInfo?: CustomerInfo
  cancelled?: boolean
  error?: unknown
}

/**
 * Triggers the RevenueCat checkout flow for the Patron Atelier package.
 */
export async function purchasePatronPackage(pkg?: Package | null): Promise<PurchaseResultResponse> {
  try {
    const purchases = initPurchases()
    if (!purchases) {
      throw new Error('RevenueCat Purchases is not configured. Please supply a valid Public API Key.')
    }

    let targetPackage = pkg
    if (!targetPackage) {
      targetPackage = await getDefaultOfferingPackage()
    }

    if (!targetPackage) {
      throw new Error('No package found in the "default" offering.')
    }

    const result = await purchases.purchase({ rcPackage: targetPackage })
    const customerInfo = result.customerInfo
    const isProActive = Boolean(customerInfo?.entitlements?.active?.[ENTITLEMENT_ID])

    if (isProActive) {
      localStorage.setItem(PATRON_STORAGE_KEY, 'true')
      return { success: true, customerInfo }
    } else {
      return { success: false, customerInfo }
    }
  } catch (err: any) {
    if (err?.errorCode === 1 || err?.name === 'UserCancelledError' || String(err).includes('cancelled')) {
      return { success: false, cancelled: true }
    }
    console.error('[RevenueCat] Checkout error:', err)
    return { success: false, error: err }
  }
}

/**
 * Verifies if the patron entitlement is active either remotely via RevenueCat or locally in storage.
 */
export async function checkPatronStatus(): Promise<boolean> {
  if (typeof window !== 'undefined' && localStorage.getItem(PATRON_STORAGE_KEY) === 'true') {
    return true
  }

  try {
    const purchases = initPurchases()
    if (!purchases) return false

    const customerInfo = await purchases.getCustomerInfo()
    const isProActive = Boolean(customerInfo?.entitlements?.active?.[ENTITLEMENT_ID])
    if (isProActive) {
      localStorage.setItem(PATRON_STORAGE_KEY, 'true')
      return true
    }
    return false
  } catch {
    return typeof window !== 'undefined' && localStorage.getItem(PATRON_STORAGE_KEY) === 'true'
  }
}
