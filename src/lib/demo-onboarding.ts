const ALLOWED_DEMO_HOSTS = new Set([
  "ucbs-form.vercel.app",
  "www.ucbshrportal.com",
  "ucbshrportal.com",
  "localhost",
  "127.0.0.1",
]);

/** Self-serve onboarding via /try is allowed in dev, when env is set, or on known UCBS hosts. */
export function isDemoOnboardingAllowed(hostHeader?: string | null): boolean {
  if (process.env.ALLOW_DEMO_ONBOARDING === "true") return true;
  if (process.env.ALLOW_DEMO_ONBOARDING === "false") return false;
  if (process.env.NODE_ENV !== "production") return true;

  const host = hostHeader?.split(":")[0]?.toLowerCase() ?? "";
  if (!host) return false;

  if (ALLOWED_DEMO_HOSTS.has(host)) return true;
  if (host.endsWith(".vercel.app")) return true;

  return false;
}
