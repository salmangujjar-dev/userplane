import { SIGNUP_URL } from '../onboarding';
import { defineFramework } from './defaults';
import {
  DOCS_FRAMEWORK_RAILS,
  DOCS_RECORDING_REQUESTING,
  DOCS_SDK_OVERVIEW,
  DOCS_SENSITIVE_DATA_REDACTION,
} from './links';
import { getFrameworkFeatureUrl, getFrameworkHeroUrl, getFrameworkIconUrl } from './media';

export const railsConfig = defineFramework({
  slug: 'ruby-on-rails',
  name: 'Ruby on Rails',
  shortName: 'Rails',
  icon: { src: getFrameworkIconUrl('frameworks/ruby-on-rails.svg'), alt: 'Ruby on Rails' },
  gradient: {
    stops: [
      'rgba(204, 0, 0, 0.1)',
      'rgba(184, 0, 0, 0.1)',
      'rgba(163, 0, 0, 0.1)',
      'rgba(204, 0, 0, 0.1)',
    ],
  },
  seo: {
    title: 'Userplane for Ruby on Rails | Screen Recordings with Console Logs',
    description:
      'Fix Rails bugs from the screen recording. Console logs, network data, and session activity available across Turbo and Devise.',
    keywords:
      'ruby on rails screen recording, rails session replay, rails console logs, rails debugging, erb template screen recording, turbo session replay, devise screen recording, userplane rails',
  },
  hero: {
    headline: {
      lines: ['Debug Rails issues', 'with screen recordings'],
      highlights: [{ wordIndex: 1, color: 'red' }],
      icons: [
        {
          wordIndex: 1,
          src: getFrameworkIconUrl('frameworks/ruby-on-rails.svg'),
          alt: 'Ruby on Rails',
        },
      ],
    },
    description: [
      'Add screen recordings to your Rails app with a single script tag.',
      'Compatible with Turbo, Devise, and Rails middleware.',
    ],
    preview: {
      src: getFrameworkHeroUrl('microsites/frameworks/rails/hero.png'),
      alt: 'Userplane screen recording from a Ruby on Rails application',
    },
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_RAILS },
  },
  features: [
    {
      number: '01',
      title: 'Add to your application layout',
      description:
        'One script tag in application.html.erb. Rails layout inheritance propagates it to every page. Use content_for to conditionally load on specific views.',
      tagline: 'ERB layout integration',
      capabilities: [
        'Single script tag setup',
        'Layout inheritance support',
        'Conditional loading via content_for',
        'Full session replay',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/rails/rails-recording-link.png'),
      learnMoreHref: DOCS_FRAMEWORK_RAILS,
    },
    {
      number: '02',
      title: 'Turbo-compatible diagnostics',
      description:
        'Console errors, network requests, browser metadata, and user steps — captured across Turbo page transitions. Recordings persist through partial page replacements.',
      tagline: 'Works with Turbo Drive',
      capabilities: [
        'Console output and error logs',
        'Network request overview',
        'Turbo Drive compatible',
        'Persists across navigations',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/rails/rails-console-logs.png'),
      learnMoreHref: DOCS_RECORDING_REQUESTING,
    },
    {
      number: '03',
      title: 'Privacy via Rails CSP',
      description:
        'Sensitive data is masked before recordings leave the browser. Works with Rails built-in CSP DSL and Devise authentication flows. GDPR and CCPA compliant.',
      tagline: 'CSP and Devise ready',
      capabilities: [
        'Client-side field masking',
        'Rails CSP DSL compatible',
        'Devise flow support',
        'GDPR & CCPA ready',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/rails/rails-data-redaction.png'),
      learnMoreHref: DOCS_SENSITIVE_DATA_REDACTION,
    },
    {
      number: '04',
      title: 'Pipes to your help desk',
      description:
        'Screen recordings route to Intercom, Zendesk, and Slack. Link recordings to support tickets. API and webhook endpoints for custom pipelines.',
      tagline: 'Context lands where you work',
      capabilities: [
        'Intercom, Zendesk, Slack',
        'Ticket-linked session data',
        'API and webhook support',
        'Record from any browser',
      ],
      image: getFrameworkFeatureUrl('microsites/frameworks/rails/rails-helpdesk-setup.png'),
      learnMoreHref: DOCS_SDK_OVERVIEW,
    },
  ],
  resources: {
    links: [
      {
        label: 'Guide',
        title: 'Rails Setup Guide',
        description:
          'Install Userplane in your Rails application. Add the script to your application layout.',
        href: DOCS_FRAMEWORK_RAILS,
      },
      {
        label: 'SDK',
        title: 'SDK Overview',
        description:
          'CDN script or npm package. Identify users, manage sessions, and apply privacy settings.',
        href: DOCS_SDK_OVERVIEW,
      },
      {
        label: 'Recording',
        title: 'How Screen Recording Works',
        description:
          'How recordings gather console output, network requests, and session interactions automatically.',
        href: DOCS_RECORDING_REQUESTING,
      },
    ],
    seeAllHref: DOCS_FRAMEWORK_RAILS,
  },
  cta: {
    headline: {
      lines: ['Diagnose Rails issues with full browser context'],
      highlights: [
        { wordIndex: 1, color: 'red' },
        { wordIndex: 2, color: 'red' },
      ],
    },
    description:
      'ERB rendering issues, Turbo navigation bugs, and Devise auth errors — resolved with console logs, network data, and full session context.',
    primaryCTA: { text: 'Get Started', href: SIGNUP_URL },
    secondaryCTA: { text: 'View Docs', href: DOCS_FRAMEWORK_RAILS },
  },
});
