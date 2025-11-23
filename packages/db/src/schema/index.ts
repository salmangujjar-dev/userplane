export * from './user';
export * from './session';
export * from './account';
export * from './verification';
export * from './relations';

import { user } from './user';
import { session } from './session';
import { account } from './account';
import { verification } from './verification';

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;

export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;
