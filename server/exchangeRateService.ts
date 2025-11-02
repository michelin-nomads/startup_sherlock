/**
 * Exchange Rate Service
 * 
 * Fetches and caches USD to INR exchange rates from free public API
 * Uses Currency API by Fawaz Ahmed (free, no API key required)
 * Updates daily and provides fallback for reliability
 */

interface ExchangeRateCache {
  rate: number;
  lastUpdated: Date;
  source: 'api' | 'fallback';
}

class ExchangeRateService {
  private cache: ExchangeRateCache = {
    rate: 89, 
    lastUpdated: new Date(),
    source: 'fallback'
  };

  private readonly API_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';
  private readonly CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly FALLBACK_RATE = 89;

  constructor() {
    this.fetchAndCacheRate().catch(err => {
      console.error('⚠️ Initial exchange rate fetch failed, using fallback:', err.message);
    });

    this.scheduleDailyUpdate();
  }

  public getRate(): ExchangeRateCache {
    return { ...this.cache };
  }

  public async fetchAndCacheRate(): Promise<ExchangeRateCache> {
    try {
      console.log('🔄 Fetching latest USD to INR exchange rate...');
      
      const response = await fetch(this.API_URL);
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      
      // API returns: { "date": "2024-11-02", "usd": { "inr": 89.05, ... } }
      const rate = data?.usd?.inr;

      if (typeof rate !== 'number' || rate <= 0) {
        throw new Error('Invalid rate received from API');
      }

      this.cache = {
        rate: rate,
        lastUpdated: new Date(),
        source: 'api'
      };

      console.log(`✅ Exchange rate updated: 1 USD = ₹${rate.toFixed(2)} INR (from API)`);
      
      return { ...this.cache };

    } catch (error) {
      console.error('❌ Failed to fetch exchange rate:', error);
      
      // Use fallback rate
      this.cache = {
        rate: this.FALLBACK_RATE,
        lastUpdated: new Date(),
        source: 'fallback'
      };

      console.log(`⚠️ Using fallback rate: 1 USD = ₹${this.FALLBACK_RATE} INR`);
      
      return { ...this.cache };
    }
  }

  public isCacheStale(): boolean {
    const age = Date.now() - this.cache.lastUpdated.getTime();
    return age > this.CACHE_DURATION_MS;
  }

  public async refreshIfStale(): Promise<ExchangeRateCache> {
    if (this.isCacheStale()) {
      console.log('⏰ Exchange rate cache is stale, refreshing...');
      return await this.fetchAndCacheRate();
    }
    return { ...this.cache };
  }

  private scheduleDailyUpdate(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    setTimeout(() => {
      this.fetchAndCacheRate().catch(err => {
        console.error('⚠️ Scheduled exchange rate update failed:', err.message);
      });

      setInterval(() => {
        this.fetchAndCacheRate().catch(err => {
          console.error('⚠️ Scheduled exchange rate update failed:', err.message);
        });
      }, this.CACHE_DURATION_MS);

    }, msUntilMidnight);
  }
}

export const exchangeRateService = new ExchangeRateService();

