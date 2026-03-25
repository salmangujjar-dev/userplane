import { createMediaClient } from '@userplane/storage/media';

export const mediaClient = createMediaClient({
  cdnDomain: import.meta.env.WXT_CDN_DOMAIN || 'https://cdn.userplane.io',
  imageZone: import.meta.env.WXT_CLOUDFLARE_IMAGE_ZONE || 'userplane.io',
  skipTransform: import.meta.env.WXT_SKIP_IMAGE_TRANSFORM === 'true',
});
