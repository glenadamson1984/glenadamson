export function validateSobriety(value) {
  if (
    !value ||
    typeof value.startedAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(
      value.startedAt
    ) ||
    !Number.isFinite(Date.parse(value.startedAt))
  )
    throw new Error("Choose a valid sobriety start date and time.");
  const datePart = value.startedAt.slice(0, 10);
  if (new Date(datePart).toISOString().slice(0, 10) !== datePart)
    throw new Error("Choose a valid calendar date.");
  if (!["GBP", "EUR", "USD"].includes(value.currency))
    throw new Error("Choose GBP, EUR or USD.");
  for (const key of ["dailySpending", "dailyCalories"])
    if (
      typeof value[key] !== "number" ||
      !Number.isFinite(value[key]) ||
      value[key] < 0
    )
      throw new Error("Daily savings estimates must be zero or greater.");
  return {
    startedAt: new Date(value.startedAt).toISOString(),
    dailySpending: value.dailySpending,
    dailyCalories: value.dailyCalories,
    currency: value.currency,
  };
}
export function sobrietyProgress(config, now) {
  const elapsedMs = Math.max(
    0,
    new Date(now).getTime() - Date.parse(config.startedAt)
  );
  const seconds = Math.floor(elapsedMs / 1000),
    days = elapsedMs / 86400000;
  return {
    days,
    wholeDays: Math.floor(days),
    hours: Math.floor(seconds / 3600) % 24,
    minutes: Math.floor(seconds / 60) % 60,
    seconds: seconds % 60,
    moneySaved: days * config.dailySpending,
    caloriesSaved: days * config.dailyCalories,
    started: new Date(now).getTime() >= Date.parse(config.startedAt),
  };
}
export function toLocalInput(instant) {
  const date = new Date(instant),
    pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
