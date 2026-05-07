export type IntegrationPlatform =
  | "shopify"
  | "razorpay"
  | "meta_ads"
  | "instagram"
  | "google_analytics"
  | "google_ads";

export interface ShopifyConfig {
  shopDomain: string;
  accessToken: string;
}

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
}

export interface MetaAdsConfig {
  accessToken: string;
  adAccountId: string;
}

export interface InstagramConfig {
  accessToken: string;
  instagramAccountId: string;
}

export interface GoogleAnalyticsConfig {
  propertyId: string;
  accessToken: string;
}

export interface GoogleAdsConfig {
  developerToken: string;
  customerId: string;
  accessToken: string;
}

export type IntegrationConfig =
  | ShopifyConfig
  | RazorpayConfig
  | MetaAdsConfig
  | InstagramConfig
  | GoogleAnalyticsConfig
  | GoogleAdsConfig;

export interface IntegrationStatus {
  isConnected: boolean;
  lastSyncedAt?: string;
  syncStatus?: "success" | "error" | "syncing";
  errorMessage?: string;
  dataPoints?: number;
  summary?: string;
}

const CONFIG_KEY = (p: IntegrationPlatform) => `integration_config_${p}`;
const STATUS_KEY = (p: IntegrationPlatform) => `integration_status_${p}`;

function get<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function set<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function getIntegrationConfig<T extends IntegrationConfig>(
  platform: IntegrationPlatform
): T | null {
  return get<T>(CONFIG_KEY(platform));
}

export function setIntegrationConfig(
  platform: IntegrationPlatform,
  config: IntegrationConfig
): void {
  set(CONFIG_KEY(platform), config);
}

export function clearIntegrationConfig(platform: IntegrationPlatform): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CONFIG_KEY(platform));
  localStorage.removeItem(STATUS_KEY(platform));
}

export function getIntegrationStatus(
  platform: IntegrationPlatform
): IntegrationStatus {
  return get<IntegrationStatus>(STATUS_KEY(platform)) ?? { isConnected: false };
}

export function setIntegrationStatus(
  platform: IntegrationPlatform,
  status: IntegrationStatus
): void {
  set(STATUS_KEY(platform), status);
}

export const ALL_PLATFORMS: IntegrationPlatform[] = [
  "shopify",
  "razorpay",
  "meta_ads",
  "instagram",
  "google_analytics",
  "google_ads",
];

export function getConnectedCount(): number {
  return ALL_PLATFORMS.filter((p) => getIntegrationStatus(p).isConnected).length;
}
