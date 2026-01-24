import { createParser } from 'nuqs';

export const pageParser = createParser({
  parse: (value) => {
    const parsed = parseInt(value);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  },
  serialize: (value) => value.toString(),
}).withDefault(1);

export const tabParser = createParser({
  parse: (value) => value,
  serialize: (value) => value,
});

export const searchParser = createParser({
  parse: (value) => value,
  serialize: (value) => value,
}).withDefault('');

export const sortParser = createParser({
  parse: (value) => value as 'asc' | 'desc',
  serialize: (value) => value,
}).withDefault('desc' as const);

export const stringArrayParser = createParser({
  parse: (value) => {
    if (!value) return [];
    return value.split(',').filter(Boolean);
  },
  serialize: (value) => value.join(','),
}).withDefault([]);

export const singleValueArrayParser = createParser({
  parse: (value) => {
    if (!value) return [];
    return [value];
  },
  serialize: (value) => value[0] || '',
}).withDefault([]);

export const adminUserSortByParser = createParser({
  parse: (value) => {
    if (!value) return [];
    const valid = ['createdAt', 'name', 'email'];
    return valid.includes(value) ? [value] : [];
  },
  serialize: (value) => value[0] || '',
}).withDefault([]);

export const adminWorkspaceSortByParser = createParser({
  parse: (value) => {
    if (!value) return [];
    const valid = ['createdAt', 'name', 'memberCount'];
    return valid.includes(value) ? [value] : [];
  },
  serialize: (value) => value[0] || '',
}).withDefault([]);

export const adminRecordingWeeksParser = createParser({
  parse: (value) => {
    if (!value) return [];
    const valid = ['12', '24', '36', '48'];
    return valid.includes(value) ? [value] : [];
  },
  serialize: (value) => value[0] || '',
}).withDefault([]);

export const adminSortDirectionParser = createParser({
  parse: (value) => {
    if (!value) return [];
    const valid = ['asc', 'desc'];
    return valid.includes(value) ? [value] : [];
  },
  serialize: (value) => value[0] || '',
}).withDefault([]);

export const adminUploadStatusParser = createParser({
  parse: (value) => {
    if (!value) return [];
    const valid = ['pending', 'available', 'expired', 'purged'];
    return valid.includes(value) ? [value] : [];
  },
  serialize: (value) => value[0] || '',
}).withDefault([]);

export const adminStreamingStatusParser = createParser({
  parse: (value) => {
    if (!value) return [];
    const valid = ['pending', 'available', 'failed', 'expired', 'purged'];
    return valid.includes(value) ? [value] : [];
  },
  serialize: (value) => value[0] || '',
}).withDefault([]);

export const adminRecordingStatusParser = createParser({
  parse: (value) => {
    if (!value) return [];
    const valid = ['all', 'active', 'deleted'];
    return valid.includes(value) ? [value] : [];
  },
  serialize: (value) => value[0] || '',
}).withDefault([]);

export const booleanParser = createParser({
  parse: (value) => value === 'true',
  serialize: (value) => (value ? 'true' : ''),
}).withDefault(false);

export const planModalParser = createParser<'suggested' | 'detailed' | null>({
  parse: (value) => {
    if (value === 'suggested' || value === 'detailed') return value;
    return null;
  },
  serialize: (value) => value || '',
});
