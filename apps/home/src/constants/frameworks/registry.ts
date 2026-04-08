import type { FrameworkConfig } from '@/types/frameworks';

import { angularConfig } from './angular';
import { astroConfig } from './astro';
import { boltConfig } from './bolt';
import { djangoConfig } from './django';
import { emergentConfig } from './emergent';
import { lovableConfig } from './lovable';
import { nextjsConfig } from './nextjs';
import { nuxtConfig } from './nuxt';
import { railsConfig } from './rails';
import { reactConfig } from './react';
import { solidjsConfig } from './solidjs';
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
  django: djangoConfig,
  'ruby-on-rails': railsConfig,
  lovable: lovableConfig,
  web: webConfig,
  solidjs: solidjsConfig,
  bolt: boltConfig,
  emergent: emergentConfig,
};
