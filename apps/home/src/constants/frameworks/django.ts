import { SIGNUP_URL } from '../onboarding';
import { defineFramework } from './defaults';
import {
  DOCS_FRAMEWORK_DJANGO,
  DOCS_RECORDING_REQUESTING,
  DOCS_SDK_OVERVIEW,
  DOCS_SENSITIVE_DATA_REDACTION,
} from './links';
import { getFrameworkFeatureUrl, getFrameworkHeroUrl, getFrameworkIconUrl } from './media';

export const djangoConfig = defineFramework({
  slug: 'django',
  name: 'Django',
  icon: { src: getFrameworkIconUrl('frameworks/django.svg'), alt: 'Django' },
  gradient: {
    stops: [
      'rgba(9, 46, 32, 0.1)',
      'rgba(7, 38, 26, 0.1)',
      'rgba(5, 30, 20, 0.1)',
      'rgba(9, 46, 32, 0.1)',
    ],
  },
  seo: {
    title: 'Userplane for Django | Screen Recordings with Console Logs',
    description:
      'Add screen recordings to your Django app. One script tag in your base template. Console logs, network data, and session info — works with template inheritance.',
    keywords:
      'django screen recording, django session replay, django console logs, django debugging, python web framework screen recording, django template screen recording, userplane django',
  },
  hero: {
    headline: {
      lines: ['Identify Django issues', 'with screen recordings'],
      highlights: [{ wordIndex: 1, color: 'green' }],
      icons: [
        {
          wordIndex: 1,
          src: getFrameworkIconUrl('frameworks/django.svg'),
          alt: 'Django',
        },
      ],
    },
    description: [
      'Add screen recordings to your Django app with a single script tag.',
      'Works with template inheritance, login_required, and Django middleware.',
    ],
    preview: {
      src: getFrameworkHeroUrl('microsites/frameworks/django/hero.png'),
      alt: 'Userplane screen recording from a Django application',
    },
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_DJANGO },
  },
  features: [
    {
      number: '01',
      title: 'One tag in your base template',
      description:
        'Add a script tag to your base.html. Django template inheritance propagates it to every page automatically. No per-view configuration needed.',
      tagline: 'Works with template inheritance',
      capabilities: [
        'Single script tag setup',
        'Template inheritance support',
        'Conditional loading via blocks',
        'Full session replay',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/django/django-recording-link.png'),
      learnMoreHref: DOCS_FRAMEWORK_DJANGO,
    },
    {
      number: '02',
      title: 'Logs, network, and metadata',
      description:
        'Console errors, network requests, browser metadata, and user steps — captured from every Django-rendered page. Debug template issues and API failures in one recording.',
      tagline: 'Server-rendered page context',
      capabilities: [
        'Console errors and stack traces',
        'Network request details',
        'Browser and OS context',
        'User action trail',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/django/django-console-logs.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Redaction before capture',
      description:
        'Sensitive data is masked before recordings leave the browser. Configure via data attributes or meta tags. Compatible with Django CSP middleware. GDPR and CCPA compliant.',
      tagline: 'CSP-compatible privacy',
      capabilities: [
        'In-browser data redaction',
        'Attribute-based redaction',
        'Django CSP compatible',
        'GDPR & CCPA covered',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/django/django-data-redaction.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
    {
      number: '04',
      title: 'Connects to your help desk',
      description:
        'Recordings route to Intercom, Zendesk, and Slack. Link session info to support tickets. API and webhook support for custom pipelines.',
      tagline: 'Support context delivered',
      capabilities: [
        'Intercom, Zendesk, Slack',
        'Sessions attached to tickets',
        'API and webhook endpoints',
        'Custom routing pipelines',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/django/django-helpdesk-setup.png'),
      learnMoreHref: DOCS_SDK_OVERVIEW,
    },
  ],
  resources: {
    links: [
      {
        label: 'Guide',
        title: 'Django Setup Guide',
        description:
          'Install Userplane in your Django application. Add the script to your base template.',
        href: DOCS_FRAMEWORK_DJANGO,
      },
      {
        label: 'SDK',
        title: 'SDK Overview',
        description:
          'Script tag or npm. Pass user metadata, control recording state, and configure redaction.',
        href: DOCS_SDK_OVERVIEW,
      },
      {
        label: 'Recording',
        title: 'How Screen Recording Works',
        description:
          'How recordings collect console errors, network data, and session activity automatically.',
        href: DOCS_RECORDING_REQUESTING,
      },
    ],
    seeAllHref: DOCS_FRAMEWORK_DJANGO,
  },
  cta: {
    headline: {
      lines: ['Trace Django issues from template to traceback'],
      highlights: [
        { wordIndex: 1, color: 'green' },
        { wordIndex: 2, color: 'green' },
      ],
    },
    description:
      'Server-rendered pages, form submissions, and API errors — diagnosed with console logs, network data, and full session context from every recording.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_DJANGO },
  },
});
