import axios from 'axios';
import * as cheerio from 'cheerio';

export interface DiscoveredSource {
  url: string;
  type: 'website' | 'news' | 'business_registry' | 'domain_info';
  title: string;
  description: string;
  confidence: number; // 0-100
  status: 'discovered' | 'crawled' | 'failed';
  data?: any;
  error?: string;
}

export interface SourceDiscoveryResult {
  sources: DiscoveredSource[];
  totalDiscovered: number;
  totalCrawled: number;
  totalFailed: number;
  discoveryTime: string;
  companyName: string;
}

export class SourceDiscoveryService {
  private userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  async discoverSources(companyName: string, industry?: string): Promise<SourceDiscoveryResult> {
    console.log(`🔍 Starting automated source discovery for ${companyName}...`);
    
    const sources: DiscoveredSource[] = [];
    const startTime = new Date().toISOString();

    try {
      // Parallel discovery of different source types (only publicly accessible)
      const discoveryPromises = [
        this.discoverCompanyWebsite(companyName),
        this.discoverNewsArticles(companyName),
        this.discoverBusinessRegistry(companyName),
        this.discoverDomainInfo(companyName)
      ];

      const results = await Promise.allSettled(discoveryPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          sources.push(...result.value);
        } else {
          console.error(`Source discovery ${index} failed:`, result.status === 'rejected' ? result.reason : 'Unknown error');
        }
      });

      // Remove duplicates and sort by confidence
      const uniqueSources = this.removeDuplicateSources(sources);
      const sortedSources = uniqueSources.sort((a, b) => b.confidence - a.confidence);

      // If no sources were found, try a simple fallback approach
      if (sortedSources.length === 0) {
        console.log(`⚠️ No sources found via search, trying fallback approach for ${companyName}`);
        const fallbackSources = await this.discoverFallbackSources(companyName);
        sortedSources.push(...fallbackSources);
      }

      const result: SourceDiscoveryResult = {
        sources: sortedSources,
        totalDiscovered: sortedSources.length,
        totalCrawled: sortedSources.filter(s => s.status === 'crawled').length,
        totalFailed: sortedSources.filter(s => s.status === 'failed').length,
        discoveryTime: startTime,
        companyName
      };

      console.log(`✅ Source discovery completed: ${result.totalDiscovered} sources found`);
      console.log(`📊 Discovery breakdown:`, {
        totalDiscovered: result.totalDiscovered,
        totalCrawled: result.totalCrawled,
        totalFailed: result.totalFailed,
        sources: result.sources.map(s => ({ type: s.type, url: s.url, status: s.status, confidence: s.confidence }))
      });
      return result;

    } catch (error) {
      console.error('Error in source discovery:', error);
      throw error;
    }
  }

  private async discoverCompanyWebsite(companyName: string): Promise<DiscoveredSource[]> {
    const sources: DiscoveredSource[] = [];
    
    try {
      // Search for company website using multiple strategies
      const searchQueries = [
        `${companyName} official website`,
        `${companyName} company site`,
        `site:${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        `site:${companyName.toLowerCase().replace(/\s+/g, '')}.io`,
        `site:${companyName.toLowerCase().replace(/\s+/g, '')}.co`
      ];

      for (const query of searchQueries) {
        try {
          // Use DuckDuckGo search (no API key required)
          const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
          const response = await axios.get(searchUrl, {
            headers: { 'User-Agent': this.userAgent },
            timeout: 10000
          });

          const $ = cheerio.load(response.data);
          const links = $('.result__url').slice(0, 3); // Get top 3 results

          links.each((_, element) => {
            const url = $(element).attr('href');
            const title = $(element).closest('.result').find('.result__title a').text().trim();
            
            if (url && this.isValidCompanyUrl(url, companyName)) {
              sources.push({
                url,
                type: 'website',
                title: title || 'Company Website',
                description: `Official website discovered for ${companyName}`,
                confidence: this.calculateWebsiteConfidence(url, companyName),
                status: 'discovered'
              });
            }
          });
        } catch (error) {
          console.error(`Website discovery failed for query "${query}":`, error);
        }
      }
    } catch (error) {
      console.error('Company website discovery failed:', error);
    }

    return sources;
  }


  private async discoverNewsArticles(companyName: string): Promise<DiscoveredSource[]> {
    const sources: DiscoveredSource[] = [];
    
    try {
      // Search for recent news articles
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`${companyName} news recent`)}`;
      const response = await axios.get(searchUrl, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const links = $('.result__url').slice(0, 5); // Get top 5 news results

      links.each((_, element) => {
        const url = $(element).attr('href');
        const title = $(element).closest('.result').find('.result__title a').text().trim();
        
        if (url && this.isNewsUrl(url)) {
          sources.push({
            url,
            type: 'news',
            title: title || 'News Article',
            description: `News article about ${companyName}`,
            confidence: 70,
            status: 'discovered'
          });
        }
      });
    } catch (error) {
      console.error('News discovery failed:', error);
    }

    return sources;
  }


  private async discoverBusinessRegistry(companyName: string): Promise<DiscoveredSource[]> {
    const sources: DiscoveredSource[] = [];
    
    try {
      // Search for business registry information
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(`${companyName} business registration`)}`;
      const response = await axios.get(searchUrl, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const links = $('.result__url').slice(0, 3);

      links.each((_, element) => {
        const url = $(element).attr('href');
        const title = $(element).closest('.result').find('.result__title a').text().trim();
        
        if (url && this.isBusinessRegistryUrl(url)) {
          sources.push({
            url,
            type: 'business_registry',
            title: title || 'Business Registry',
            description: `Business registration information for ${companyName}`,
            confidence: 75,
            status: 'discovered'
          });
        }
      });
    } catch (error) {
      console.error('Business registry discovery failed:', error);
    }

    return sources;
  }

  private async discoverDomainInfo(companyName: string): Promise<DiscoveredSource[]> {
    const sources: DiscoveredSource[] = [];
    
    try {
      // Try common domain patterns
      const domainPatterns = [
        `${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        `${companyName.toLowerCase().replace(/\s+/g, '')}.io`,
        `${companyName.toLowerCase().replace(/\s+/g, '')}.co`,
        `${companyName.toLowerCase().replace(/\s+/g, '')}.net`,
        `${companyName.toLowerCase().replace(/\s+/g, '')}.org`
      ];

      for (const domain of domainPatterns) {
        try {
          const url = `https://${domain}`;
          const response = await axios.head(url, {
            timeout: 5000,
            headers: { 'User-Agent': this.userAgent }
          });

          if (response.status === 200) {
            sources.push({
              url,
              type: 'domain_info',
              title: `${domain} Domain`,
              description: `Domain information for ${companyName}`,
              confidence: 90,
              status: 'discovered'
            });
          }
        } catch (error) {
          // Domain doesn't exist or is not accessible
        }
      }
    } catch (error) {
      console.error('Domain discovery failed:', error);
    }

    return sources;
  }

  private isValidCompanyUrl(url: string, companyName: string): boolean {
    const companyNameLower = companyName.toLowerCase().replace(/\s+/g, '');
    const urlLower = url.toLowerCase();
    
    // Check if URL contains company name
    if (urlLower.includes(companyNameLower)) {
      return true;
    }
    
    // Check for common company website patterns
    const commonPatterns = ['about', 'company', 'team', 'contact', 'home'];
    return commonPatterns.some(pattern => urlLower.includes(pattern));
  }

  private calculateWebsiteConfidence(url: string, companyName: string): number {
    let confidence = 50;
    const companyNameLower = companyName.toLowerCase().replace(/\s+/g, '');
    const urlLower = url.toLowerCase();
    
    // Higher confidence for exact company name match
    if (urlLower.includes(companyNameLower)) {
      confidence += 30;
    }
    
    // Higher confidence for .com domains
    if (urlLower.includes('.com')) {
      confidence += 10;
    }
    
    // Higher confidence for official-looking URLs
    if (urlLower.includes('www.') || urlLower.includes('official')) {
      confidence += 10;
    }
    
    return Math.min(confidence, 100);
  }

  private isNewsUrl(url: string): boolean {
    const newsDomains = [
      'reuters.com', 'bloomberg.com', 'techcrunch.com', 'forbes.com',
      'wsj.com', 'nytimes.com', 'cnn.com', 'bbc.com', 'cnbc.com',
      'venturebeat.com', 'wired.com', 'theverge.com', 'arstechnica.com'
    ];
    
    return newsDomains.some(domain => url.includes(domain));
  }

  private isBusinessRegistryUrl(url: string): boolean {
    const registryDomains = [
      'opencorporates.com', 'sec.gov', 'companieshouse.gov.uk',
      'business.gov', 'corporationwiki.com', 'bizapedia.com'
    ];
    
    return registryDomains.some(domain => url.includes(domain));
  }

  private removeDuplicateSources(sources: DiscoveredSource[]): DiscoveredSource[] {
    const seen = new Set<string>();
    return sources.filter(source => {
      if (seen.has(source.url)) {
        return false;
      }
      seen.add(source.url);
      return true;
    });
  }

  private async discoverFallbackSources(companyName: string): Promise<DiscoveredSource[]> {
    const sources: DiscoveredSource[] = [];
    
    try {
      // Try common domain patterns as fallback
      const domainPatterns = [
        `${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        `${companyName.toLowerCase().replace(/\s+/g, '')}.io`,
        `${companyName.toLowerCase().replace(/\s+/g, '')}.co`,
        `${companyName.toLowerCase().replace(/\s+/g, '')}.net`,
        `${companyName.toLowerCase().replace(/\s+/g, '')}.org`
      ];

      for (const domain of domainPatterns) {
        try {
          const url = `https://${domain}`;
          const response = await axios.head(url, {
            timeout: 3000,
            headers: { 'User-Agent': this.userAgent }
          });

          if (response.status === 200) {
            sources.push({
              url,
              type: 'website',
              title: `${domain} - Company Website`,
              description: `Company website discovered for ${companyName}`,
              confidence: 85,
              status: 'discovered'
            });
            console.log(`✅ Fallback: Found working domain ${domain}`);
            break; // Stop after finding first working domain
          }
        } catch (error) {
          // Domain doesn't exist or is not accessible
        }
      }

      // Add a generic news search as fallback
      sources.push({
        url: `https://news.google.com/search?q=${encodeURIComponent(companyName)}`,
        type: 'news',
        title: `News Search for ${companyName}`,
        description: `Google News search results for ${companyName}`,
        confidence: 60,
        status: 'discovered'
      });

    } catch (error) {
      console.error('Fallback source discovery failed:', error);
    }

    return sources;
  }
}

export const sourceDiscoveryService = new SourceDiscoveryService();
