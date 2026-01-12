import flagsData from './flags.json';

export interface Flag {
  enabled: boolean;
  description: string;
}

export interface Flags {
  // About page flags
  aboutPage: Flag;
  aboutSidebar: Flag;
  aboutProgram: Flag;
  aboutAdvice: Flag;
  aboutCommunity: Flag;
  aboutBrand: Flag;
  aboutHiring: Flag;
  // Safe page flags
  safePage: Flag;
  safeSidebar: Flag;
  safeDownloads: Flag;
  safeAboutSection: Flag;
  // Company directory flags
  search: Flag;
  pagination: Flag;
  sidebar: Flag;
  isHiringFilter: Flag;
  batchFilter: Flag;
  companyLogo: Flag;
  companyLocation: Flag;
  industryTags: Flag;
  batchTag: Flag;
  resultsCount: Flag;
}

export const flags: Flags = flagsData;

export function isEnabled(flagName: keyof Flags): boolean {
  return flags[flagName]?.enabled ?? false;
}
