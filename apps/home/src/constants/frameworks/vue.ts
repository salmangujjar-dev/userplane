import { SIGNUP_URL } from '../onboarding';
import { defineFramework } from './defaults';
import {
  DOCS_FRAMEWORK_VUE,
  DOCS_RECORDING_REQUESTING,
  DOCS_SDK_OVERVIEW,
  DOCS_SENSITIVE_DATA_REDACTION,
} from './links';
import { getFrameworkFeatureUrl, getFrameworkHeroUrl, getFrameworkIconUrl } from './media';

export const vueConfig = defineFramework({
  slug: 'vue',
  name: 'Vue',
  icon: { src: getFrameworkIconUrl('frameworks/vue.svg'), alt: 'Vue' },
  gradient: {
    stops: [
      'rgba(79, 192, 141, 0.1)',
      'rgba(66, 172, 126, 0.1)',
      'rgba(53, 152, 111, 0.1)',
      'rgba(79, 192, 141, 0.1)',
    ],
  },
  seo: {
    title: 'Userplane for Vue | Session Recordings with Console Logs',
    description:
      'Capture console logs, network requests, and session metadata from your Vue app. Compatible with Vue 3 and Vue Router.',
    keywords:
      'vue screen recording, vue session replay, vue console logs, vue debugging, vue 3 screen recording, vue router session replay, userplane vue',
  },
  hero: {
    headline: {
      lines: ['Screen recordings for', 'Vue applications'],
      highlights: [{ wordIndex: 3, color: 'green' }],
      icons: [
        {
          wordIndex: 3,
          src: getFrameworkIconUrl('frameworks/vue.svg'),
          alt: 'Vue',
        },
      ],
    },
    description: [
      'Capture console logs, network requests, and session metadata from your Vue app.',
      'Compatible with Vue 3 and Vue Router.',
    ],
    preview: {
      src: getFrameworkHeroUrl('microsites/vue/hero.png'),
      alt: 'Userplane screen recording from a Vue application',
    },
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_VUE },
  },
  features: [
    {
      number: '01',
      title: 'Session replays on demand',
      description:
        'Send a link. Customers record their session. You get a replay with every reactive state change, route transition, and error that occurred. No extensions required.',
      tagline: 'Record on demand',
      capabilities: [
        'On-demand recording links',
        'Reactive state captured',
        'No browser extensions',
        'Works with Vue Router',
      ],
      image: getFrameworkFeatureUrl('microsites/vue/vue-sdk.png'),
      learnMoreHref: DOCS_FRAMEWORK_VUE,
    },
    {
      number: '02',
      title: 'Technical context included',
      description:
        'Console errors, network snapshots, browser metadata, and step-by-step user actions — attached to every recording from your Vue application automatically.',
      tagline: 'Everything to triage',
      capabilities: [
        'Console logs and error traces',
        'Network request timeline',
        'Browser & OS metadata',
        'Step-by-step user actions',
      ],
      image: getFrameworkFeatureUrl('microsites/vue/vue-context.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Privacy controls included',
      description:
        "Sensitive data is redacted before it leaves the customer's browser. Router-aware token preservation. GDPR and CCPA compliant out of the box.",
      tagline: 'Redacted before capture',
      capabilities: [
        'Client-side data redaction',
        'Router-aware token handling',
        'GDPR & CCPA compliant',
        'Configurable privacy rules',
      ],
      image: getFrameworkFeatureUrl('microsites/vue/vue-privacy.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
    {
      number: '04',
      title: 'Integrates with your stack',
      description:
        'Recordings route to Intercom, Zendesk, or Slack. Session data links to tickets. API and webhook support for custom pipelines.',
      tagline: 'Fits your support workflow',
      capabilities: [
        'Intercom, Zendesk, Slack',
        'Session data linked to tickets',
        'API and webhook support',
        'Record from any browser',
      ],
      image: getFrameworkFeatureUrl('microsites/vue/vue-integration.png'),
      learnMoreHref: DOCS_SDK_OVERVIEW,
    },
  ],
  resources: {
    links: [
      {
        label: 'Guide',
        title: 'Vue Setup Guide',
        description:
          'Install Userplane in your Vue application. Vue plugin integration and router configuration.',
        href: DOCS_FRAMEWORK_VUE,
      },
      {
        label: 'SDK',
        title: 'SDK Overview',
        description:
          'Embed script or npm package. Attach metadata, control recordings, and configure privacy.',
        href: DOCS_SDK_OVERVIEW,
      },
      {
        label: 'Recording',
        title: 'How Screen Recording Works',
        description:
          'How recordings capture console logs, network requests, and session metadata automatically.',
        href: DOCS_RECORDING_REQUESTING,
      },
    ],
    seeAllHref: DOCS_FRAMEWORK_VUE,
  },
  cta: {
    headline: {
      lines: ['See exactly what went wrong in your Vue app'],
      highlights: [
        { wordIndex: 1, color: 'green' },
        { wordIndex: 2, color: 'green' },
      ],
    },
    description:
      'Reactive state issues, routing bugs, and runtime errors — every recording has the technical context to find the root cause.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_VUE },
  },
});
