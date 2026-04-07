import type { FrameworkConfig } from '@/types/frameworks';

import { angularConfig } from './angular';
import { astroConfig } from './astro';
import { nextjsConfig } from './nextjs';
import { nuxtConfig } from './nuxt';
import { reactConfig } from './react';
import { svelteConfig } from './svelte';
import { vueConfig } from './vue';
import { webConfig } from './web';

export const FRAMEWORK_REGISTRY: Record<string, FrameworkConfig> = {
  nextjs: nextjsConfig,
  react: reactConfig,
  vue: vueConfig,
  angular: angularConfig,
  nuxt: nuxtConfig,
  svelte: svelteConfig,
  astro: astroConfig,
  web: webConfig,
};
