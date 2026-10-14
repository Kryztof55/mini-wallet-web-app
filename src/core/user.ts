import type { Identifier } from './identifier';
import type { UserId } from './ids';

export type User = {
  readonly id: UserId;
  readonly firstName: string;
  readonly lastName: string;
  /** Phone and/or email the user can log in with; also used for BR-09. */
  readonly identifiers: readonly Identifier[];
};
