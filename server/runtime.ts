export function isProductionRuntime(): boolean {
  return process.env.VERCEL_ENV === 'production';
}
