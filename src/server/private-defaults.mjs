// Server-only defaults. Never import this module from browser components.
export const DEFAULT_SOBRIETY=Object.freeze({
 startedAt:process.env.SOBRIETY_STARTED_AT||'2025-08-25T07:00:00.000Z',
 dailySpending:4,dailyCalories:306,currency:'GBP'
});
