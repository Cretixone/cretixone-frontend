/**
 * Google Sign-In configuration.
 *
 * Only the PUBLIC client ID is involved. This app uses the Google Identity
 * Services ID-token flow: the browser receives a signed ID token and the
 * backend verifies it against Google's published keys. No client secret exists
 * anywhere in this codebase — if you ever feel the need to add one, the flow
 * has been changed incorrectly.
 */
export const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

/**
 * Whether Google Sign-In can be offered at all. When the client ID is missing
 * (e.g. a fresh clone with no `.env`), every Google affordance hides itself
 * rather than rendering a button that throws on click.
 */
export const isGoogleAuthEnabled = (): boolean => GOOGLE_CLIENT_ID.length > 0
