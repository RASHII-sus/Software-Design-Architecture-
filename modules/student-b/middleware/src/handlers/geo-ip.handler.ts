// middleware/src/handlers/geo-ip.handler.ts
// PATTERN: Chain of Responsibility (Handler 2: Geo-IP Enrichment)
// Enriches alerts with geographic and ISP context for all IP addresses
// found in the alert. Uses a lightweight in-process lookup table in dev;
// replace with MaxMind GeoIP2 or ip-api.com in production.

import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { EnrichmentHandler, EnrichmentResult } from './enrichment-handler.abstract';
import { CanonicalAlert, GeoIpContext } from '../../../shared/contracts/interfaces';

// Known malicious IP ranges (CIDR blocks — simplified for demo)
const KNOWN_MALICIOUS_RANGES = new Set([
  '185.220.',   // Tor exit nodes range
  '198.98.',    // Known abuse range
  '91.108.',    // Telegram-associated (sometimes abused)
]);

interface IpApiResponse {
  status: string;
  country: string;
  countryCode: string;
  city: string;
  lat: number;
  lon: number;
  isp: string;
  query: string;
}

@Injectable()
export class GeoIPHandler extends EnrichmentHandler {
  private readonly threatIntelUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    super();
    this.threatIntelUrl = this.config.get<string>('app.threatIntelServiceUrl', 'http://localhost:3002');
  }

  getHandlerName(): string {
    return 'GeoIPHandler';
  }

  // PATTERN: Chain of Responsibility — H2 logic
  protected async doEnrich(alert: CanonicalAlert): Promise<EnrichmentResult> {
    const ip = alert.normalizedData.sourceIp;

    if (!ip) {
      this.logger.debug(
        `[GeoIPHandler] No source IP in alert ${alert.id} — passing through`,
      );
      return {
        alert,
        enriched: false,
        handlerName: this.getHandlerName(),
        skipped: true,
        skipReason: 'NO_IP_ADDRESS',
        durationMs: 0,
      };
    }

    const geoContext = await this.lookupGeoIP(ip);

    const enrichedAlert: CanonicalAlert = {
      ...alert,
      enrichmentContext: {
        ...alert.enrichmentContext,
        geoIp: geoContext,
      },
    };

    this.logger.debug(
      `[GeoIPHandler] Enriched ${alert.id} — IP: ${ip} → ${geoContext.country ?? 'UNKNOWN'} ` +
        `(malicious range: ${geoContext.isKnownMaliciousRange})`,
    );

    return {
      alert: enrichedAlert,
      enriched: true,
      handlerName: this.getHandlerName(),
      skipped: false,
      durationMs: 0,
      metadata: { ip, country: geoContext.country, isp: geoContext.isp },
    };
  }

  private async lookupGeoIP(ip: string): Promise<GeoIpContext> {
    // Skip private/loopback addresses — no geo data available
    if (this.isPrivateIp(ip)) {
      return {
        ip,
        country: 'INTERNAL',
        countryCode: 'INT',
        isKnownMaliciousRange: false,
      };
    }

    try {
      // Use ip-api.com for demo — replace with MaxMind in production
      const response = await firstValueFrom(
        this.httpService.get<IpApiResponse>(`http://ip-api.com/json/${ip}`, {
          timeout: 3000,
        }),
      );

      const data = response.data;
      const isKnownMaliciousRange = this.checkMaliciousRange(ip);

      return {
        ip,
        country: data.country,
        countryCode: data.countryCode,
        city: data.city,
        latitude: data.lat,
        longitude: data.lon,
        isp: data.isp,
        isKnownMaliciousRange,
      };
    } catch (err) {
      this.logger.warn(
        `[GeoIPHandler] Geo lookup failed for ${ip}: ${(err as Error).message} — using fallback`,
      );
      return {
        ip,
        isKnownMaliciousRange: this.checkMaliciousRange(ip),
      };
    }
  }

  private isPrivateIp(ip: string): boolean {
    return (
      ip.startsWith('10.') ||
      ip.startsWith('172.16.') ||
      ip.startsWith('192.168.') ||
      ip === '127.0.0.1' ||
      ip === '::1'
    );
  }

  private checkMaliciousRange(ip: string): boolean {
    for (const range of KNOWN_MALICIOUS_RANGES) {
      if (ip.startsWith(range)) return true;
    }
    return false;
  }
}
