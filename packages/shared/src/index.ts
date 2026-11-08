// Root entry: CLP types and JSON conversion, safe for every app (D35).
// The allocation engine lives in the `@comvive/shared/money-engine` subpath (API only).
export { clp, clpFromJson, clpToJson, signedClpFromJson, type Clp } from './money/clp.js';
