/**
 * Exchange Rate Manager (Frontend)
 * 
 * Manages fetching and caching USD to INR exchange rates
 * - Fetches from backend API on app load
 * - Caches in localStorage with timestamp
 * - Auto-refreshes if older than 24 hours
 * - Falls back to hardcoded rate if API unavailable
 */

import { getApiUrl } from './config';

interface ExchangeRateData {
  rate: number;
  lastUpdated: string;
  source: 'api' | 'fallback';
  message?: string;
}

interface CachedRate {
  rate: number;
  timestamp: number;
  source: 'api' | 'fallback';
}

class ExchangeRateManager {
  private currentRate: number = 89; // Fallback rate
  private readonly CACHE_KEY = 'usd_to_inr_rate';
  private readonly CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly FALLBACK_RATE = 89;
  private initialized: boolean = false;

  /**
   * Initialize and fetch exchange rate
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Try to load from cache first
      const cached = this.loadFromCache();
      
      if (cached && !this.isCacheStale(cached)) {
        this.currentRate = cached.rate;
        console.log(`💱 Using cached exchange rate: 1 USD = ₹${cached.rate.toFixed(2)}`);
        this.initialized = true;
        return;
      }

      // Cache is stale or doesn't exist, fetch fresh rate
      await this.fetchAndCache();
      this.initialized = true;

    } catch (error) {
      console.error('Failed to initialize exchange rate:', error);
      this.currentRate = this.FALLBACK_RATE;
      this.initialized = true;
    }
  }

  /**
   * Get current exchange rate
   */
  public getRate(): number {
    return this.currentRate;
  }

  /**
   * Fetch latest rate from backend API
   */
  public async fetchAndCache(): Promise<number> {
    try {
      const apiUrl = getApiUrl('');
      const response = await fetch(`${apiUrl}/api/exchange-rate`);
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data: ExchangeRateData = await response.json();
      
      if (typeof data.rate !== 'number' || data.rate <= 0) {
        throw new Error('Invalid rate received from API');
      }

      this.currentRate = data.rate;

      // Cache the rate
      const cached: CachedRate = {
        rate: data.rate,
        timestamp: Date.now(),
        source: data.source
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cached));

      console.log(`✅ Exchange rate updated: 1 USD = ₹${data.rate.toFixed(2)} (${data.source})`);
      
      return data.rate;

    } catch (error) {
      console.error('Failed to fetch exchange rate from API:', error);
      
      // Use fallback
      this.currentRate = this.FALLBACK_RATE;
      console.log(`⚠️ Using fallback rate: 1 USD = ₹${this.FALLBACK_RATE}`);
      
      return this.FALLBACK_RATE;
    }
  }

  /**
   * Load rate from localStorage cache
   */
  private loadFromCache(): CachedRate | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const data: CachedRate = JSON.parse(cached);
      
      if (typeof data.rate !== 'number' || typeof data.timestamp !== 'number') {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to load cached exchange rate:', error);
      return null;
    }
  }

  /**
   * Check if cached rate is stale (older than 24 hours)
   */
  private isCacheStale(cached: CachedRate): boolean {
    const age = Date.now() - cached.timestamp;
    return age > this.CACHE_DURATION_MS;
  }

  /**
   * Force refresh the exchange rate
   */
  public async refresh(): Promise<number> {
    console.log('🔄 Manually refreshing exchange rate...');
    return await this.fetchAndCache();
  }
}

// Singleton instance
export const exchangeRateManager = new ExchangeRateManager();

