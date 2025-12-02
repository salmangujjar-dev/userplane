/**
 * Additional recordings option
 */
export interface RecordingsOption {
  recordings: number;
  price: number;
}

/**
 * Additional seats option
 */
export interface SeatsOption {
  users: number;
  price: number;
  label: string;
}

/**
 * Additional recordings pricing options
 */
export const ADDITIONAL_RECORDINGS_OPTIONS: RecordingsOption[] = [
  { recordings: 50, price: 99 },
  { recordings: 100, price: 149 },
  { recordings: 250, price: 299 },
];

/**
 * Additional seats pricing options
 */
export const ADDITIONAL_SEATS_OPTIONS: SeatsOption[] = [
  { users: 5, price: 49, label: '$49 / 5 users' },
];
