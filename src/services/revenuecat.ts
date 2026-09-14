import { Capacitor } from '@capacitor/core'
import {
  Purchases as PurchasesCapacitor,
  type PurchasesPackage,
  type PurchasesOfferings,
  type CustomerInfo as CapacitorCustomerInfo,
} from '@revenuecat/purchases-capacitor'
import {
  Purchases as PurchasesJs,
  type Package as JsPackage,
  type CustomerInfo as JsCustomerInfo,
  type Offerings as JsOfferings,
} from '@revenuecat/purchases-js'

export type UnifiedPackage = (JsPackage | PurchasesPackage) & {
  rcBillingProduct?: {
    currentPrice?: {
      formattedPrice?: string
    }
  }
  product?: {
    priceString?: string
  }
}

export type { UnifiedPackage as Package }

export const REVENUECAT_GOOGLE_API_KEY =
  import.meta.env.VITE_REVENUECAT_GOOGLE_API_KEY || 'goog_placeholder_api_key'

export const REVENUECAT_PUBLIC_KEY =
  import.meta.env.VITE_REVENUECAT_PUBLIC_KEY || 'rcb_sb_test_store_key'

export const OFFERING_ID = 'default'
export const ENTITLEMENT_ID = 'nook_pro'
export const PATRON_STORAGE_KEY = 'nook_patron_unlocked'
export const ANONYMOUS_USER_ID_KEY = 'nook_rc_anonymous_id'

let jsPurchasesInstance: PurchasesJs | null = null
let isNativeConfigured = false

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
 * Automatically delegates to @revenuecat/purchases-capacitor on native Android
 * and @revenuecat/purchases-js in web browsers.
 */
export async function initPurchases(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const appUserId = getAnonymousUserId()

  if (Capacitor.isNativePlatform()) {
    if (isNativeConfigured) return true

    const apiKey = REVENUECAT_GOOGLE_API_KEY
    if (!apiKey || apiKey === 'goog_placeholder_api_key') {
      console.info(
        '[RevenueCat] Running native Capacitor with placeholder Google API key. Set VITE_REVENUECAT_GOOGLE_API_KEY for live store.'
      )
    }

    try {
      await PurchasesCapacitor.configure({
        apiKey,
        appUserID: appUserId,
      })
      isNativeConfigured = true
      return true
    } catch (err) {
      console.warn('[RevenueCat] Native initialization deferred or error:', err)
      return false
    }
  }

  // Web (Purchases JS)
  if (jsPurchasesInstance) return true

  const apiKey = REVENUECAT_PUBLIC_KEY
  if (!apiKey || apiKey === 'rcb_sb_test_store_key') {
    console.info(
      '[RevenueCat] Running web with test store key or placeholder. Set VITE_REVENUECAT_PUBLIC_KEY for live store.'
    )
  }

  try {
    jsPurchasesInstance = PurchasesJs.configure({
      apiKey,
      appUserId,
    })
    return true
  } catch (err) {
    console.warn('[RevenueCat] Web initialization deferred or error:', err)
    return false
  }
}

/**
 * Fetches package details from the "default" offering.
 */
export async function getDefaultOfferingPackage(): Promise<UnifiedPackage | null> {
  try {
    await initPurchases()

    if (Capacitor.isNativePlatform()) {
      const offerings: PurchasesOfferings = await PurchasesCapacitor.getOfferings()
      const defaultOffering = offerings.all?.[OFFERING_ID] || offerings.current
      if (!defaultOffering) return null

      if (defaultOffering.lifetime) {
        return defaultOffering.lifetime as UnifiedPackage
      }
      if (defaultOffering.availablePackages && defaultOffering.availablePackages.length > 0) {
        return defaultOffering.availablePackages[0] as UnifiedPackage
      }
      return null
    }

    if (!jsPurchasesInstance) return null
    const offerings: JsOfferings = await jsPurchasesInstance.getOfferings()
    const defaultOffering = offerings.all?.[OFFERING_ID] || offerings.current
    if (!defaultOffering) return null

    if (defaultOffering.lifetime) {
      return defaultOffering.lifetime as UnifiedPackage
    }
    if (defaultOffering.availablePackages && defaultOffering.availablePackages.length > 0) {
      return defaultOffering.availablePackages[0] as UnifiedPackage
    }
    return null
  } catch (err) {
    console.warn('[RevenueCat] Error fetching package from default offering:', err)
    return null
  }
}

export interface PurchaseResultResponse {
  success: boolean
  customerInfo?: JsCustomerInfo | CapacitorCustomerInfo
  cancelled?: boolean
  error?: unknown
}

/**
 * Triggers the RevenueCat checkout flow for the Patron Atelier package.
 * Invokes Purchases.purchasePackage on native Android or PurchasesJs.purchase on web.
 */
export async function purchasePatronPackage(pkg?: UnifiedPackage | null): Promise<PurchaseResultResponse> {
  try {
    await initPurchases()

    let targetPackage = pkg
    if (!targetPackage) {
      targetPackage = await getDefaultOfferingPackage()
    }

    if (Capacitor.isNativePlatform()) {
      if (!targetPackage) {
        throw new Error('No package found in the default offering.')
      }

      const result = await PurchasesCapacitor.purchasePackage({
        aPackage: targetPackage as PurchasesPackage,
      })

      const customerInfo = result.customerInfo
      const isProActive = Boolean(customerInfo?.entitlements?.active?.[ENTITLEMENT_ID])

      if (isProActive) {
        localStorage.setItem(PATRON_STORAGE_KEY, 'true')
        return { success: true, customerInfo }
      } else {
        return { success: false, customerInfo }
      }
    }

    // Web fallback using PurchasesJs
    if (!jsPurchasesInstance) {
      throw new Error('RevenueCat Purchases is not configured. Please supply a valid Public API Key.')
    }
    if (!targetPackage) {
      throw new Error('No package found in the default offering.')
    }

    const result = await jsPurchasesInstance.purchase({ rcPackage: targetPackage as JsPackage })
    const customerInfo = result.customerInfo
    const isProActive = Boolean(customerInfo?.entitlements?.active?.[ENTITLEMENT_ID])

    if (isProActive) {
      localStorage.setItem(PATRON_STORAGE_KEY, 'true')
      return { success: true, customerInfo }
    } else {
      return { success: false, customerInfo }
    }
  } catch (err: any) {
    if (
      err?.userCancelled ||
      err?.errorCode === 1 ||
      err?.name === 'UserCancelledError' ||
      String(err?.message || err).toLowerCase().includes('cancel')
    ) {
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
    await initPurchases()

    if (Capacitor.isNativePlatform()) {
      const { customerInfo } = await PurchasesCapacitor.getCustomerInfo()
      const isProActive = Boolean(customerInfo?.entitlements?.active?.[ENTITLEMENT_ID])
      if (isProActive) {
        localStorage.setItem(PATRON_STORAGE_KEY, 'true')
        return true
      }
      return false
    }

    if (!jsPurchasesInstance) return false
    const customerInfo = await jsPurchasesInstance.getCustomerInfo()
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
