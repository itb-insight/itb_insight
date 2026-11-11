/**
 * Width of the feedback pop-up: it stretches with the viewport and keeps a side margin
 * that grows with the screen (6vw) but stays between 12px and 100px — so it is tiny on a phone.
 * Modal additionally never lets it get closer than 16px to the edge.
 * Edit the clamp() to change the margin.
 */
export const FEEDBACK_DIALOG_WIDTH = "min(720px, calc(100vw - 2 * clamp(12px, 6vw, 100px)))"

