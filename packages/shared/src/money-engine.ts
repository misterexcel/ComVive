// `@comvive/shared/money-engine`: amount calculation engine. Only the API may import it
// (docs/arquitectura.md §1, decision D35); ESLint forbids it in apps/web and apps/mobile.
export { allocateLargestRemainder, type AllocationShare } from './money/largest-remainder.js';
