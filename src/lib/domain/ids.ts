export function createEntityId() {
  return crypto.randomUUID();
}

export function createBusinessNumber(prefix: string) {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const rand = Math.floor(Math.random() * 900000 + 100000);
  return `${prefix}-${stamp}-${rand}`;
}
