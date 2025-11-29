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
