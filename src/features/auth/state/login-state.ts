/**
 * Login state machine (TS-01 §4 `LoginState`, FS-01 UIR-AUTH-04…13). Pure: the hook performs
 * the requests and dispatches their outcomes here.
 */
export type StepError = {
  readonly kind: 'service' | 'network' | 'timeout';
  readonly requestId: string;
};

export type CodeError = 'format' | 'incorrect' | 'locked' | 'expired';

/**
 * Non-production aid on the code step (UIR-AUTH-16): the code of a known account, or a notice
 * that the identifier is not a demo account (no code is shown that could never verify).
 */
export type DemoAid =
  { readonly kind: 'code'; readonly code: string } | { readonly kind: 'unknown_account' };

export type LoginState = {
  readonly step: 'identifier' | 'code';
  /** A request in progress; while set, further submissions are ignored (UIR-AUTH-04). */
  readonly pending: 'code' | 'verify' | 'resend' | null;
  readonly identifier: string;
  readonly identifierError: 'format' | null;
  readonly destination: string | null;
  readonly demo: DemoAid | null;
  /** Epoch ms when a new code may be requested (BR-13), from the server's answer. */
  readonly resendAt: number | null;
  readonly codeStatus: 'active' | 'locked' | 'expired';
  readonly attemptsLeft: number | null;
  readonly codeError: CodeError | null;
  readonly stepError: StepError | null;
  readonly notice: 'code_resent' | 'already_sent' | null;
  /** Increments for every new code so the field is cleared and refocused (UIR-AUTH-12). */
  readonly codeVersion: number;
  readonly redirectTo: string | null;
};

export const initialLoginState: LoginState = {
  step: 'identifier',
  pending: null,
  identifier: '',
  identifierError: null,
  destination: null,
  demo: null,
  resendAt: null,
  codeStatus: 'active',
  attemptsLeft: null,
  codeError: null,
  stepError: null,
  notice: null,
  codeVersion: 0,
  redirectTo: null,
};

export type LoginAction =
  | { readonly type: 'CODE_REQUESTED'; readonly identifier: string }
  | { readonly type: 'RESEND_REQUESTED' }
  | {
      readonly type: 'CODE_ISSUED';
      readonly destination: string;
      readonly demo: DemoAid | null;
      readonly resendAt: number;
    }
  | { readonly type: 'CODE_ALREADY_SENT'; readonly destination: string; readonly resendAt: number }
  | { readonly type: 'RESEND_THROTTLED'; readonly resendAt: number }
  | { readonly type: 'IDENTIFIER_REJECTED' }
  | { readonly type: 'VERIFY_REQUESTED' }
  | { readonly type: 'CODE_REJECTED'; readonly error: 'format' }
  | { readonly type: 'CODE_INCORRECT'; readonly attemptsLeft: number }
  | { readonly type: 'CODE_BLOCKED'; readonly reason: 'locked' | 'expired'; readonly now: number }
  | { readonly type: 'REQUEST_FAILED'; readonly error: StepError }
  | { readonly type: 'VERIFIED'; readonly redirectTo: string }
  | { readonly type: 'CHANGE_IDENTIFIER' };

export function loginReducer(state: LoginState, action: LoginAction): LoginState {
  switch (action.type) {
    case 'CODE_REQUESTED':
      return {
        ...state,
        pending: 'code',
        identifier: action.identifier,
        identifierError: null,
        stepError: null,
        notice: null,
      };
    case 'RESEND_REQUESTED':
      return { ...state, pending: 'resend', stepError: null, notice: null };
    case 'CODE_ISSUED':
      return {
        ...state,
        step: 'code',
        pending: null,
        destination: action.destination,
        demo: action.demo,
        resendAt: action.resendAt,
        codeStatus: 'active',
        attemptsLeft: null,
        codeError: null,
        stepError: null,
        // Announced only for a resend; the first code is introduced by the step itself.
        notice: state.step === 'code' ? 'code_resent' : null,
        codeVersion: state.codeVersion + 1,
      };
    case 'CODE_ALREADY_SENT':
      // A code was issued for this identifier less than the cooldown ago and is still valid.
      return {
        ...state,
        step: 'code',
        pending: null,
        destination: action.destination,
        demo: null,
        resendAt: action.resendAt,
        codeStatus: 'active',
        attemptsLeft: null,
        codeError: null,
        notice: 'already_sent',
        codeVersion: state.codeVersion + 1,
      };
    case 'RESEND_THROTTLED':
      return { ...state, pending: null, resendAt: action.resendAt };
    case 'IDENTIFIER_REJECTED':
      return { ...state, step: 'identifier', pending: null, identifierError: 'format' };
    case 'VERIFY_REQUESTED':
      return { ...state, pending: 'verify', codeError: null, stepError: null, notice: null };
    case 'CODE_REJECTED':
      return { ...state, pending: null, codeError: action.error };
    case 'CODE_INCORRECT':
      return { ...state, pending: null, codeError: 'incorrect', attemptsLeft: action.attemptsLeft };
    case 'CODE_BLOCKED':
      // UIR-AUTH-10: a new code can be requested immediately.
      return {
        ...state,
        pending: null,
        codeStatus: action.reason,
        codeError: action.reason,
        resendAt: action.now,
      };
    case 'REQUEST_FAILED':
      return { ...state, pending: null, stepError: action.error };
    case 'VERIFIED':
      // Stays busy while the app navigates away.
      return { ...state, redirectTo: action.redirectTo };
    case 'CHANGE_IDENTIFIER':
      return {
        ...state,
        step: 'identifier',
        pending: null,
        identifierError: null,
        codeError: null,
        stepError: null,
        notice: null,
      };
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}
