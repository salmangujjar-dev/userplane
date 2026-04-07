import { SIGNUP_URL } from '../onboarding';
import { defineFramework } from './defaults';
import {
  DOCS_FRAMEWORK_ANGULAR,
  DOCS_RECORDING_REQUESTING,
  DOCS_SDK_OVERVIEW,
  DOCS_SENSITIVE_DATA_REDACTION,
} from './links';
import { getFrameworkFeatureUrl, getFrameworkHeroUrl, getFrameworkIconUrl } from './media';

export const angularConfig = defineFramework({
  slug: 'angular',
  name: 'Angular',
  icon: { src: getFrameworkIconUrl('frameworks/angular.svg'), alt: 'Angular' },
  gradient: {
    stops: [
      'rgba(221, 0, 49, 0.1)',
      'rgba(198, 0, 44, 0.1)',
      'rgba(175, 0, 39, 0.1)',
      'rgba(221, 0, 49, 0.1)',
    ],
  },
  seo: {
    title: 'Userplane for Angular | Session Recordings with Console Logs',
    description:
      'Console logs, network requests, and session metadata from your Angular app. Works with standalone components and NgModules.',
    keywords:
      'angular screen recording, angular session replay, angular console logs, angular debugging, standalone components screen recording, ngmodule session replay, userplane angular',
  },
  hero: {
    headline: {
      lines: ['Screen recordings for', 'Angular applications'],
      highlights: [{ wordIndex: 3, color: 'red' }],
      icons: [
        {
          wordIndex: 3,
          src: getFrameworkIconUrl('frameworks/angular.svg'),
          alt: 'Angular',
        },
      ],
    },
    description: [
      'Console logs, network requests, and session metadata from your Angular app.',
      'Works with standalone components and NgModules.',
    ],
    preview: {
      src: getFrameworkHeroUrl('microsites/angular/hero.png'),
      alt: 'Userplane screen recording from an Angular application',
    },
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_ANGULAR },
  },
  features: [
    {
      number: '01',
      title: 'Customer session recordings',
      description:
        'Customers record their session from a link. You get a full replay — every component interaction, route change, and HTTP call captured. No downloads required.',
      tagline: 'Full replay, zero friction',
      capabilities: [
        'Link-based recording',
        'Full session replay',
        'No downloads required',
        'Works with standalone & NgModules',
      ],
      image: getFrameworkFeatureUrl('microsites/angular/angular-sdk.png'),
      learnMoreHref: DOCS_FRAMEWORK_ANGULAR,
    },
    {
      number: '02',
      title: 'Errors, network, and state',
      description:
        'Console errors, network request timelines, browser fingerprints, and complete user action sequences — attached to every session recording.',
      tagline: 'Technical depth on every ticket',
      capabilities: [
        'Console logs and error traces',
        'Network request timelines',
        'Browser fingerprints',
        'Complete action sequences',
      ],
      image: getFrameworkFeatureUrl('microsites/angular/angular-context.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Redaction at the source',
      description:
        "PII is masked before recordings leave the customer's browser. Environment-based configuration. GDPR and CCPA compliant across dev, staging, and production.",
      tagline: 'Compliant in every environment',
      capabilities: [
        'Client-side PII masking',
        'Environment-based configuration',
        'GDPR & CCPA compliant',
        'Dev, staging & production support',
      ],
      image: getFrameworkFeatureUrl('microsites/angular/angular-privacy.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
    {
      number: '04',
      title: 'Delivers to your help desk',
      description:
        'Session recordings attach to Intercom, Zendesk, and Slack conversations. API and webhook endpoints for routing to Jira, Linear, or your internal tools.',
      tagline: 'Recordings where tickets live',
      capabilities: [
        'Intercom, Zendesk, Slack',
        'API and webhook endpoints',
        'Jira & Linear routing',
        'Internal tool integration',
      ],
      image: getFrameworkFeatureUrl('microsites/angular/angular-integration.png'),
      learnMoreHref: DOCS_SDK_OVERVIEW,
    },
  ],
  resources: {
    links: [
      {
        label: 'Guide',
        title: 'Angular Setup Guide',
        description:
          'Install Userplane in your Angular application. APP_INITIALIZER integration and environment-based configuration.',
        href: DOCS_FRAMEWORK_ANGULAR,
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
    seeAllHref: DOCS_FRAMEWORK_ANGULAR,
  },
  cta: {
    headline: {
      lines: ['Start capturing sessions', 'in your Angular app'],
      highlights: [
        { wordIndex: 1, color: 'red' },
        { wordIndex: 2, color: 'red' },
      ],
    },
    description:
      'Console logs, network requests, and session metadata — captured from every Angular session.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_ANGULAR },
  },
});
