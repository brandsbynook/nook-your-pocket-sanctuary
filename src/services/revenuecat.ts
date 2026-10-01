import { Capacitor } from '@capacitor/core'
import {
  Purchases as PurchasesCapacitor,
  type PurchasesPackage,
  type PurchasesOfferings,
  type PurchasesStoreProduct,
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
  import.meta.env.VITE_REVENUECAT_GOOGLE_API_KEY || 'goog_PWvoBjiUdxMzzioWzgQTLDnxtzG'

export const REVENUECAT_PUBLIC_KEY =
  import.meta.env.VITE_REVENUECAT_PUBLIC_KEY || 'goog_PWvoBjiUdxMzzioWzgQTLDnxtzG'

export const OFFERING_ID = 'default'
export const ENTITLEMENT_ID = 'nook_tip_atelier_pro'
export const PATRON_STORAGE_KEY = 'nook_patron_unlocked'
export const SANCTUARY_KEY_UNLOCKED = 'nook_sanctuary_key_unlocked'
export const ANONYMOUS_USER_ID_KEY = 'nook_rc_anonymous_id'

let jsPurchasesInstance: PurchasesJs | null = null
let isNativeConfigured = false

/**
 * Helper to check whether any patron entitlement is active.
 * Listens primarily for "nook_tip_atelier_pro" and checks both customerInfo.customerInfo
 * and customerInfo wrappers.
 */
export function isEntitlementActive(info?: any): boolean {
  if (!info) return false
  const customerInfo = info?.customerInfo || info
  const activeEntitlements = customerInfo?.entitlements?.active || {}
  return Boolean(
    activeEntitlements['nook_tip_atelier_pro'] ||
    activeEntitlements['nook_pro']
  )
}

/**
 * Persists unlocked state across local storage and dispatches change events.
 */
export function markPatronUnlocked(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PATRON_STORAGE_KEY, 'true')
      localStorage.setItem(SANCTUARY_KEY_UNLOCKED, 'true')
      window.dispatchEvent(new Event('storage'))
    } catch (e) {
      console.warn('[RevenueCat] Failed to persist patron unlock state:', e)
    }
  }
}

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
 * Safely fetches package details from the current offering or default offering.
 * Locates the package matching $rc_lifetime, nook_tip_atelier, or LIFETIME,
 * falling back to availablePackages[0].
 */
export async function getDefaultOfferingPackage(): Promise<UnifiedPackage | null> {
  try {
    await initPurchases()

    if (Capacitor.isNativePlatform()) {
      const offerings: PurchasesOfferings = await PurchasesCapacitor.getOfferings()
      if (!offerings) return null

      // Target current offering or fallback to default / first available offering
      const targetOffering =
        offerings.current ||
        offerings.all?.[OFFERING_ID] ||
        offerings.all?.['default'] ||
        (offerings.all ? Object.values(offerings.all)[0] : null)

      if (!targetOffering) return null

      const availablePackages = targetOffering.availablePackages || []

      const matchedPackage =
        availablePackages.find(
          pkg =>
            pkg.identifier === '$rc_lifetime' ||
            pkg.identifier === 'nook_tip_atelier' ||
            pkg.packageType === 'LIFETIME' ||
            pkg.product?.identifier === 'nook_tip_atelier' ||
            pkg.product?.identifier === 'nook_tip_atelier_pro'
        ) ||
        (targetOffering.lifetime as PurchasesPackage | undefined) ||
        availablePackages[0] ||
        null

      return (matchedPackage as UnifiedPackage) || null
    }

    // Web (Purchases JS)
    if (!jsPurchasesInstance) return null
    const offerings: JsOfferings = await jsPurchasesInstance.getOfferings()
    if (!offerings) return null

    const targetOffering =
      offerings.current ||
      offerings.all?.[OFFERING_ID] ||
      offerings.all?.['default'] ||
      (offerings.all ? Object.values(offerings.all)[0] : null)

    if (!targetOffering) return null

    const availablePackages = targetOffering.availablePackages || []

    const matchedPackage =
      availablePackages.find(
        (pkg: any) =>
          pkg.identifier === '$rc_lifetime' ||
          pkg.identifier === 'nook_tip_atelier' ||
          pkg.packageType === 'LIFETIME' ||
          pkg.rcBillingProduct?.identifier === 'nook_tip_atelier' ||
          pkg.rcBillingProduct?.identifier === 'nook_tip_atelier_pro'
      ) ||
      (targetOffering.lifetime as JsPackage | undefined) ||
      availablePackages[0] ||
      null

    return (matchedPackage as UnifiedPackage) || null
  } catch (err) {
    console.warn('[RevenueCat] Error fetching package from offerings:', err)
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
 * Invokes Purchases.purchasePackage on native Android using wrapped object parameter { aPackage: packageToBuy }.
 * Automatically handles already owned products and restores state.
 */
export async function purchasePatronPackage(
  pkg?: UnifiedPackage | null
): Promise<PurchaseResultResponse> {
  try {
    await initPurchases()

    let targetPackage = pkg
    if (!targetPackage) {
      targetPackage = await getDefaultOfferingPackage()
    }

    if (Capacitor.isNativePlatform()) {
      if (!targetPackage) {
        // Retry once in case offerings loaded right after
        targetPackage = await getDefaultOfferingPackage()
      }

      if (!targetPackage) {
        throw new Error('Offerings are loading from Google Play. Please try again in a moment.')
      }

      const packageToBuy = targetPackage as PurchasesPackage
      const result = await PurchasesCapacitor.purchasePackage({
        aPackage: packageToBuy,
      })

      const customerInfo = result.customerInfo
      if (isEntitlementActive(result)) {
        markPatronUnlocked()
        return { success: true, customerInfo }
      } else {
        // Query fresh customerInfo in case entitlement activation needed a beat
        try {
          const fresh = await PurchasesCapacitor.getCustomerInfo()
          if (isEntitlementActive(fresh)) {
            markPatronUnlocked()
            return { success: true, customerInfo: fresh.customerInfo }
          }
        } catch {}
        return { success: false, customerInfo }
      }
    }

    // Web fallback using PurchasesJs
    if (!jsPurchasesInstance) {
      throw new Error('RevenueCat Purchases is not configured. Please supply a valid Public API Key.')
    }
    if (!targetPackage) {
      targetPackage = await getDefaultOfferingPackage()
    }
    if (!targetPackage) {
      throw new Error('Offerings are loading. Please try again in a moment.')
    }

    const result = await jsPurchasesInstance.purchase({ rcPackage: targetPackage as JsPackage })
    const customerInfo = result.customerInfo

    if (isEntitlementActive(customerInfo)) {
      markPatronUnlocked()
      return { success: true, customerInfo }
    } else {
      return { success: false, customerInfo }
    }
  } catch (err: any) {
    const isUserCancelled =
      err?.userCancelled ||
      err?.errorCode === 1 ||
      err?.code === '1' ||
      err?.name === 'UserCancelledError' ||
      String(err?.message || err).toLowerCase().includes('cancel')

    if (isUserCancelled) {
      return { success: false, cancelled: true }
    }

    // If user already owns the product, trigger auto-restore and customerInfo refresh
    const isAlreadyOwned =
      err?.errorCode === 6 ||
      err?.code === '6' ||
      String(err?.message || '').toLowerCase().includes('already purchased') ||
      String(err?.message || '').toLowerCase().includes('already owned') ||
      String(err?.message || '').toLowerCase().includes('item_already_owned') ||
      String(err?.code || '').toLowerCase().includes('productalreadypurchased')

    if (isAlreadyOwned) {
      try {
        const restoreResult = await restorePatronPurchases()
        if (restoreResult.success) {
          return restoreResult
        }
      } catch (restoreErr) {
        console.warn('[RevenueCat] Auto-restore on already owned failed:', restoreErr)
      }
    }

    console.error('[RevenueCat] Checkout error:', err)
    return { success: false, error: err }
  }
}

/**
 * Purchases a store product directly on native Android using wrapped parameter { product: productToBuy }.
 */
export async function purchaseStoreProduct(
  productToBuy: PurchasesStoreProduct
): Promise<PurchaseResultResponse> {
  try {
    await initPurchases()

    if (Capacitor.isNativePlatform()) {
      const result = await PurchasesCapacitor.purchaseStoreProduct({
        product: productToBuy,
      })

      const customerInfo = result.customerInfo
      if (isEntitlementActive(result)) {
        markPatronUnlocked()
        return { success: true, customerInfo }
      }
      return { success: false, customerInfo }
    }

    return { success: false, error: new Error('Store product purchase is only available on native Android.') }
  } catch (err: any) {
    const isUserCancelled =
      err?.userCancelled ||
      err?.errorCode === 1 ||
      err?.code === '1' ||
      err?.name === 'UserCancelledError' ||
      String(err?.message || err).toLowerCase().includes('cancel')

    if (isUserCancelled) {
      return { success: false, cancelled: true }
    }

    console.error('[RevenueCat] purchaseStoreProduct error:', err)
    return { success: false, error: err }
  }
}

/**
 * Restores previous purchases and refreshes customer info.
 * Calls Purchases.restorePurchases() and checks customerInfo.customerInfo.entitlements.active['nook_tip_atelier_pro']
 * or customerInfo.entitlements?.active['nook_tip_atelier_pro'].
 */
export async function restorePatronPurchases(): Promise<PurchaseResultResponse> {
  try {
    await initPurchases()

    if (Capacitor.isNativePlatform()) {
      const result: any = await PurchasesCapacitor.restorePurchases()
      const customerInfo = result?.customerInfo || result
      if (isEntitlementActive(result)) {
        markPatronUnlocked()
        return { success: true, customerInfo }
      }
      return { success: false, customerInfo }
    }

    if (!jsPurchasesInstance) {
      return { success: false, error: new Error('Purchases not initialized') }
    }

    const customerInfo = await jsPurchasesInstance.getCustomerInfo()
    if (isEntitlementActive(customerInfo)) {
      markPatronUnlocked()
      return { success: true, customerInfo }
    }
    return { success: false, customerInfo }
  } catch (err: any) {
    console.error('[RevenueCat] Restore purchases error:', err)
    return { success: false, error: err }
  }
}

/**
 * Verifies if the patron entitlement is active either remotely via RevenueCat or locally in storage.
 */
export async function checkPatronStatus(): Promise<boolean> {
  if (
    typeof window !== 'undefined' &&
    (localStorage.getItem(PATRON_STORAGE_KEY) === 'true' ||
      localStorage.getItem(SANCTUARY_KEY_UNLOCKED) === 'true')
  ) {
    return true
  }

  try {
    await initPurchases()

    if (Capacitor.isNativePlatform()) {
      const result: any = await PurchasesCapacitor.getCustomerInfo()
      if (isEntitlementActive(result)) {
        markPatronUnlocked()
        return true
      }
      return false
    }

    if (!jsPurchasesInstance) return false
    const customerInfo = await jsPurchasesInstance.getCustomerInfo()
    if (isEntitlementActive(customerInfo)) {
      markPatronUnlocked()
      return true
    }
    return false
  } catch {
    return (
      typeof window !== 'undefined' &&
      (localStorage.getItem(PATRON_STORAGE_KEY) === 'true' ||
        localStorage.getItem(SANCTUARY_KEY_UNLOCKED) === 'true')
    )
  }
}
