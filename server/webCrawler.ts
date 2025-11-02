import puppeteer, { Browser, Page } from 'puppeteer';
import axios from 'axios';
import { sourceDiscoveryService, DiscoveredSource, SourceDiscoveryResult } from './sourceDiscovery';

export interface PublicDataResult {
  companyInfo: CompanyInfo;
  founderProfiles: FounderProfile[];
  newsArticles: NewsArticle[];
  domainInfo: DomainInfo;
  businessRegistry: BusinessRegistryInfo;
  confidenceScore: number;
  lastUpdated: string;
  discoveredSources: SourceDiscoveryResult;
}

export interface CompanyInfo {
  website: string;
  description: string;
  founded: string;
  employees: string;
  headquarters: string;
  industry: string;
  socialMedia: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}

export interface FounderProfile {
  name: string;
  title: string;
  linkedinUrl?: string;
  experience: string[];
  education: string[];
  previousCompanies: string[];
  verified: boolean;
}

export interface NewsArticle {
  title: string;
  url: string;
  publishedDate: string;
  source: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface DomainInfo {
  domain: string;
  registeredDate: string;
  registrar: string;
  nameServers: string[];
  status: string;
  expirationDate: string;
}

export interface BusinessRegistryInfo {
  companyName: string;
  registrationNumber: string;
  status: string;
  incorporationDate: string;
  jurisdiction: string;
  registeredAgent: string;
}

export class WebCrawlerService {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async crawlCompanyWebsite(url: string): Promise<CompanyInfo> {
    try {
      await this.initialize();
      const page = await this.browser!.newPage();
      
      // Set user agent to avoid blocking
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      const companyInfo = await page.evaluate(() => {
        try {
          const getTextContent = (selector: string): string => {
            try {
              const element = document.querySelector(selector);
              return element ? element.textContent?.trim() || '' : '';
            } catch (e) {
              return '';
            }
          };

          const getHref = (selector: string): string => {
            try {
              const element = document.querySelector(selector) as HTMLAnchorElement;
              return element ? element.href : '';
            } catch (e) {
              return '';
            }
          };

          return {
            website: window.location.href,
            description: getTextContent('meta[name="description"]') || 
                        getTextContent('h1') || 
                        getTextContent('.hero-description') ||
                        getTextContent('[class*="description"]'),
            founded: getTextContent('[class*="founded"]') || 
                     getTextContent('[class*="established"]') ||
                     getTextContent('[class*="since"]'),
            employees: getTextContent('[class*="employee"]') || 
                       getTextContent('[class*="team"]') ||
                       getTextContent('[class*="size"]'),
            headquarters: getTextContent('[class*="headquarters"]') || 
                          getTextContent('[class*="location"]') ||
                          getTextContent('[class*="address"]'),
            industry: getTextContent('[class*="industry"]') || 
                      getTextContent('[class*="sector"]') ||
                      getTextContent('[class*="category"]'),
            socialMedia: {
              linkedin: getHref('a[href*="linkedin.com"]'),
              twitter: getHref('a[href*="twitter.com"], a[href*="x.com"]'),
              facebook: getHref('a[href*="facebook.com"]')
            }
          };
        } catch (e) {
          // Return minimal info if page evaluation fails
          return {
            website: window.location.href,
            description: '',
            founded: '',
            employees: '',
            headquarters: '',
            industry: '',
            socialMedia: {}
          };
        }
      });

      await page.close();
      return companyInfo;
    } catch (error) {
      console.error('Error crawling company website:', error);
      throw new Error(`Failed to crawl company website: ${error}`);
    }
  }

  async searchNewsArticles(companyName: string, founderNames: string[]): Promise<NewsArticle[]> {
    try {
      const searchQuery = `${companyName} ${founderNames.join(' ')} startup funding`;
      const response = await axios.get('https://newsapi.org/v2/everything', {
        params: {
          q: searchQuery,
          sortBy: 'publishedAt',
          pageSize: 10,
          apiKey: process.env.NEWS_API_KEY || 'your-news-api-key-here'
        }
      });

      if (response.data.status === 'ok') {
        return response.data.articles.map((article: any) => ({
          title: article.title,
          url: article.url,
          publishedDate: article.publishedAt,
          source: article.source.name,
          summary: article.description || '',
          sentiment: this.analyzeSentiment(article.title + ' ' + article.description)
        }));
      }

      return [];
    } catch (error) {
      console.error('Error searching news articles:', error);
      return [];
    }
  }

  async getDomainInfo(domain: string): Promise<DomainInfo> {
    try {
      // Using a free WHOIS API (you might want to use a paid service for production)
      const response = await axios.get(`https://api.whoisjson.com/v1/${domain}`);
      
      return {
        domain,
        registeredDate: response.data.created_date || '',
        registrar: response.data.registrar || '',
        nameServers: response.data.name_servers || [],
        status: response.data.status || '',
        expirationDate: response.data.expires_date || ''
      };
    } catch (error) {
      console.error('Error getting domain info:', error);
      return {
        domain,
        registeredDate: '',
        registrar: '',
        nameServers: [],
        status: '',
        expirationDate: ''
      };
    }
  }

  // Commented out due to API authentication requirements
  // async searchBusinessRegistry(companyName: string, jurisdiction: string = 'US'): Promise<BusinessRegistryInfo> {
  //   try {
  //     // This is a simplified implementation
  //     // In production, you'd want to use official business registry APIs
  //     const response = await axios.get('https://api.opencorporates.com/v0.4/companies/search', {
  //       params: {
  //         q: companyName,
  //         jurisdiction_code: jurisdiction,
  //         format: 'json'
  //       }
  //     });

  //     if (response.data.results && response.data.results.companies.length > 0) {
  //       const company = response.data.results.companies[0].company;
  //       return {
  //         companyName: company.name,
  //         registrationNumber: company.company_number || '',
  //         status: company.current_status || '',
  //         incorporationDate: company.incorporation_date || '',
  //         jurisdiction: company.jurisdiction_code || '',
  //         registeredAgent: company.registered_agent_name || ''
  //       };
  //     }

  //     return {
  //       companyName,
  //       registrationNumber: '',
  //       status: '',
  //       incorporationDate: '',
  //       jurisdiction,
  //       registeredAgent: ''
  //     };
  //   } catch (error) {
  //     console.error('Error searching business registry:', error);
  //     return {
  //       companyName,
  //       registrationNumber: '',
  //       status: '',
  //       incorporationDate: '',
  //       jurisdiction,
  //       registeredAgent: ''
  //     };
  //   }
  // }

  async searchFounderProfiles(founderNames: string[]): Promise<FounderProfile[]> {
    const profiles: FounderProfile[] = [];
    
    for (const name of founderNames) {
      try {
        // This is a simplified implementation
        // In production, you'd want to use LinkedIn's official API or other professional network APIs
        const profile: FounderProfile = {
          name,
          title: '',
          linkedinUrl: '',
          experience: [],
          education: [],
          previousCompanies: [],
          verified: false
        };

        // For now, we'll create a placeholder profile
        // In a real implementation, you'd search LinkedIn, Crunchbase, etc.
        profiles.push(profile);
      } catch (error) {
        console.error(`Error searching profile for ${name}:`, error);
      }
    }

    return profiles;
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['success', 'growth', 'funding', 'investment', 'breakthrough', 'innovation', 'award', 'achievement'];
    const negativeWords = ['failure', 'loss', 'decline', 'problem', 'issue', 'controversy', 'lawsuit', 'scandal'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  async crawlPublicData(companyName: string, websites: string[] = []): Promise<PublicDataResult> {
    console.log(`🔍 Starting public data crawl for ${companyName} with ${websites.length} manual sources...`);
    
    try {
      // Use only manually provided websites with proper URL validation
      const validSources = websites.filter(url => {
        if (!url || typeof url !== 'string') return false;
        try {
          new URL(url);
          return true;
        } catch {
          console.log(`⚠️ Skipping invalid URL: ${url}`);
          return false;
        }
      });
      
      const allSources = validSources.filter((url, index, arr) => arr.indexOf(url) === index); // Remove duplicates

      console.log(`🌐 Crawling ${allSources.length} valid manual sources (${websites.length - allSources.length} invalid URLs skipped)...`);

      const results: PublicDataResult = {
        companyInfo: {
          website: allSources[0] || '',
          description: '',
          founded: '',
          employees: '',
          headquarters: '',
          industry: '',
          socialMedia: {}
        },
        founderProfiles: [],
        newsArticles: [],
        domainInfo: {
          domain: '',
          registeredDate: '',
          registrar: '',
          nameServers: [],
          status: '',
          expirationDate: ''
        },
        businessRegistry: {
          companyName,
          registrationNumber: '',
          status: '',
          incorporationDate: '',
          jurisdiction: '',
          registeredAgent: ''
        },
        confidenceScore: 0,
        lastUpdated: new Date().toISOString(),
        discoveredSources: {
          sources: [],
          summary: { total: 0, byType: {}, quality: { high: 0, medium: 0, low: 0 } }
        }
      };

      // Step 2: Crawl all provided sources
      if (allSources.length > 0) {
        console.log(`🌐 Step 2: Crawling ${allSources.length} sources...`);
        const websiteDataPromises = allSources.map(async (website, index) => {
          console.log(`🌐 Crawling source ${index + 1}/${allSources.length}: ${website}`);
          try {
            const data = await this.crawlCompanyWebsite(website);
            return data;
          } catch (error) {
            console.error(`Failed to crawl source ${website}:`, error);
            return null;
          }
        });
        
        const websiteDataResults = await Promise.all(websiteDataPromises);
        
        // Merge data from all successfully crawled sources
        const validResults = websiteDataResults.filter(result => result !== null);
        console.log(`📊 Crawling results: ${validResults.length}/${allSources.length} sources successfully crawled`);
        
        if (validResults.length > 0) {
          const mergedWebsiteData = validResults.reduce((acc, data) => {
            return {
              ...acc,
              ...data,
              // Keep the first website as primary
              website: acc.website || data.website
            };
          }, results.companyInfo);
          
          results.companyInfo = mergedWebsiteData;
          results.confidenceScore += 30;
          console.log(`✅ Added 30% confidence for ${validResults.length} successfully crawled websites`);
        } else {
          console.log(`❌ No websites were successfully crawled`);
        }
      }

      // Search news articles (optional - don't fail if no API key)
      try {
        if (process.env.NEWS_API_KEY && process.env.NEWS_API_KEY !== 'your-news-api-key-here') {
          const newsArticles = await this.searchNewsArticles(companyName, []);
          if (newsArticles && newsArticles.length > 0) {
            results.newsArticles = newsArticles;
            results.confidenceScore += 20;
            console.log(`✅ Added 20% confidence for ${newsArticles.length} news articles`);
          } else {
            console.log(`❌ No news articles found`);
          }
        } else {
          console.log(`⏭️ Skipping news search - no valid API key provided`);
        }
      } catch (error) {
        console.error('Failed to search news articles:', error);
        console.log(`⏭️ Continuing without news articles due to API error`);
      }

      // Get domain information for the primary website (only if it's a valid website URL)
      if (allSources.length > 0) {
        try {
          const firstSource = allSources[0];
          console.log(`🔍 Checking domain info for: ${firstSource}`);
          // Only get domain info for actual website URLs, not news or other sources
          if (firstSource && !firstSource.includes('news.google.com') && !firstSource.includes('linkedin.com')) {
            try {
              const domain = new URL(firstSource).hostname;
              console.log(`🌐 Getting domain info for: ${domain}`);
              const domainInfo = await this.getDomainInfo(domain);
              if (domainInfo && domainInfo.domain) {
                results.domainInfo = domainInfo;
                results.confidenceScore += 15;
                console.log(`✅ Added 15% confidence for domain info`);
              } else {
                console.log(`❌ No domain info found`);
              }
            } catch (urlError) {
              console.log(`⚠️ Invalid URL for domain info: ${firstSource}`);
            }
          } else {
            console.log(`⏭️ Skipping domain info for non-website source: ${firstSource}`);
          }
        } catch (error) {
          console.error('Failed to get domain info:', error);
        }
      }

      // Search business registry (commented out due to API authentication requirements)
      // try {
      //   results.businessRegistry = await this.searchBusinessRegistry(companyName);
      //   results.confidenceScore += 20;
      // } catch (error) {
      //   console.error('Failed to search business registry:', error);
      // }

      // Search founder profiles (commented out due to LinkedIn authentication requirements)
      // try {
      //   results.founderProfiles = await this.searchFounderProfiles([]);
      //   results.confidenceScore += 15;
      // } catch (error) {
      //   console.error('Failed to search founder profiles:', error);
      // }

      console.log(`✅ Public data crawl completed for ${companyName} (confidence: ${results.confidenceScore}%)`);
      return results;
    } catch (error) {
      console.error('Error in public data crawl:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const webCrawler = new WebCrawlerService();
