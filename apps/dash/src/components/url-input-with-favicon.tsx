'use client';

import { useState, useEffect } from 'react';
import NextImage from 'next/image';

// Map of domain patterns to local preview icons
const DOMAIN_TO_ICON_MAP: Record<string, string> = {
  asana: '/preview/asana.webp',
  clickup: '/preview/clickup.webp',
  crisp: '/preview/crisp.webp',
  discord: '/preview/discord.webp',
  freshchat: '/preview/freshchat.webp',
  freshdesk: '/preview/freshdesk.webp',
  front: '/preview/front.webp',
  happyfox: '/preview/happyfox.webp',
  helpscout: '/preview/helpscout.webp',
  hiver: '/preview/hiver.webp',
  hubspot: '/preview/hubspot.webp',
  intercom: '/preview/intercom.webp',
  jira: '/preview/jira.webp',
  atlassian: '/preview/jira.webp',
  linear: '/preview/linear.webp',
  make: '/preview/make.webp',
  n8n: '/preview/n8n.webp',
  notion: '/preview/notion.webp',
  plain: '/preview/plain.webp',
  pylon: '/preview/pylon.webp',
  salesforce: '/preview/salesforce.webp',
  sentry: '/preview/sentry.webp',
  slack: '/preview/slack.webp',
  talkdesk: '/preview/talkdesk.webp',
  zapier: '/preview/zapier.webp',
  zendesk: '/preview/zendesk.webp',
  zoho: '/preview/zoho.webp',
};

interface UrlInputWithFaviconProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function UrlInputWithFavicon({
  id,
  value,
  onChange,
  placeholder = 'Enter URL or reference',
  className = 'w-full rounded-lg bg-muted py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
}: UrlInputWithFaviconProps) {
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [fallbackDomain, setFallbackDomain] = useState<string | null>(null);

  const checkFaviconSize = (
    domain: string,
    requestedSize: number = 64
  ): Promise<{ isDefault: boolean; reason?: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=${requestedSize}`;

      img.onload = function () {
        const naturalWidth = (this as HTMLImageElement).naturalWidth;
        const naturalHeight = (this as HTMLImageElement).naturalHeight;

        if (naturalWidth === 16 && naturalHeight === 16 && requestedSize > 16) {
          resolve({ isDefault: true, reason: 'Size mismatch - got 16x16 when requesting larger' });
        } else if (naturalWidth <= 1 || naturalHeight <= 1) {
          resolve({ isDefault: true, reason: 'Transparent 1x1 pixel' });
        } else {
          resolve({ isDefault: false });
        }
      };

      img.onerror = function () {
        resolve({ isDefault: true, reason: 'Load error' });
      };
    });
  };

  const handleFaviconError = () => {
    // If local icon fails and we have a fallback domain, try Google's favicon API
    if (fallbackDomain && faviconUrl?.startsWith('/preview/')) {
      checkFaviconSize(fallbackDomain, 64).then((result) => {
        if (result.isDefault) {
          // It's the default globe icon, don't show it
          setFaviconUrl(null);
        } else {
          // Real favicon found
          setFaviconUrl(`https://www.google.com/s2/favicons?domain=${fallbackDomain}&sz=64`);
        }
        setFallbackDomain(null);
      });
    } else {
      // If Google's API also fails, just hide the icon
      setFaviconUrl(null);
      setFallbackDomain(null);
    }
  };

  // Effect to extract domain and set favicon URL when value changes
  useEffect(() => {
    let isMounted = true;
    const urlPattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b/;
    const match = value.match(urlPattern);

    if (match) {
      try {
        const url = new URL(match[0]);
        const domain = url.hostname;

        // Extract the main domain name (e.g., "github" from "github.com" or "app.github.com")
        const domainParts = domain.split('.');
        const mainDomain =
          domainParts.length >= 2 ? domainParts[domainParts.length - 2] : domainParts[0];

        // Check if we have a local icon for this domain
        const localIcon = mainDomain ? DOMAIN_TO_ICON_MAP[mainDomain.toLowerCase()] : undefined;

        if (localIcon) {
          setFaviconUrl(localIcon);
          setFallbackDomain(domain);
        } else {
          // Fall back to Google's v2 favicon API, but check if it's the default globe
          checkFaviconSize(domain, 64).then((result) => {
            if (!isMounted) return;

            if (result.isDefault) {
              // It's the default globe icon, don't show it
              setFaviconUrl(null);
            } else {
              // Real favicon found
              setFaviconUrl(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
            }
          });
          setFallbackDomain(null);
        }
      } catch {
        setFaviconUrl(null);
      }
    } else {
      setFaviconUrl(null);
      setFallbackDomain(null);
    }

    return () => {
      isMounted = false;
    };
  }, [value]);

  return (
    <div className="relative">
      {faviconUrl && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded bg-background border shadow-sm">
          <NextImage
            src={faviconUrl}
            alt="Site favicon"
            width={16}
            height={16}
            className="w-4 h-4 object-contain"
            onError={handleFaviconError}
            unoptimized
          />
        </div>
      )}
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${className} ${faviconUrl ? 'pl-12 pr-4' : 'px-4'}`}
      />
    </div>
  );
}
