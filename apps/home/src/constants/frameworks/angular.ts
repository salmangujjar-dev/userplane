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
    title: 'Userplane for Angular | Screen Recordings with Console Logs',
    description:
      'Resolve Angular bugs from screen recordings. Get console logs, network data, and session activity from standalone components.',
    keywords:
      'angular screen recording, angular session replay, angular console logs, angular debugging, standalone components screen recording, ngmodule session replay, userplane angular',
  },
  hero: {
    headline: {
      lines: ['Identify and fix Angular issues', 'with screen recordings'],
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
      'See every user interaction with logs, requests, and errors.',
      'Works with standalone components and NgModules.',
    ],
    preview: {
      src: getFrameworkHeroUrl('microsites/frameworks/angular/hero.png'),
      alt: 'Userplane screen recording from an Angular application',
    },
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_ANGULAR },
  },
  features: [
    {
      number: '01',
      title: 'Customer screen recordings',
      description:
        'Customers record their bugs from a link. You get a full replay — every component interaction, route change, and HTTP call captured. No downloads required.',
      tagline: 'Full replay, zero friction',
      capabilities: [
        'Link-based recording',
        'Full session replay',
        'No downloads required',
        'Works with standalone & NgModules',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/angular/angular-recording-link.png'),
      learnMoreHref: DOCS_FRAMEWORK_ANGULAR,
    },
    {
      number: '02',
      title: 'Errors, network, and state',
      description:
        'Console errors, network request timelines, browser fingerprints, and complete user action sequences — attached to every screen recording.',
      tagline: 'Technical depth on every ticket',
      capabilities: [
        'Console logs and error traces',
        'Network request timelines',
        'Browser fingerprints',
        'Complete action sequences',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/angular/angular-console-logs.png'),
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
      image: getFrameworkFeatureUrl('microsites/frameworks/angular/angular-data-redaction.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
    {
      number: '04',
      title: 'Delivers to your help desk',
      description:
        'Screen recordings attach to Intercom, Zendesk, and Slack conversations. Session data links to tickets. API and webhook endpoints for custom routing.',
      tagline: 'Recordings where tickets live',
      capabilities: [
        'Intercom, Zendesk, Slack',
        'Recordings linked to tickets',
        'API and webhook access',
        'Custom integration support',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/angular/angular-helpdesk-setup.png'),
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
          'How recordings capture console logs, network requests, and session details automatically.',
        href: DOCS_RECORDING_REQUESTING,
      },
    ],
    seeAllHref: DOCS_FRAMEWORK_ANGULAR,
  },
  cta: {
    headline: {
      lines: ['Pinpoint Angular issues with full technical context'],
      highlights: [
        { wordIndex: 1, color: 'red' },
        { wordIndex: 2, color: 'red' },
      ],
    },
    description:
      'Dependency injection errors, routing issues, and change detection bugs — resolved with full technical context from every recording.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_ANGULAR },
  },
});
