import flagsData from './flags.json';

export interface Flag {
  enabled: boolean;
  description: string;
}

export interface Flags {
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
