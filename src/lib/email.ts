import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendOnboardingLinkEmail(params: {
  to: string;
  employeeName: string;
  onboardingUrl: string;
}) {
  const { to, employeeName, onboardingUrl } = params;
  const from = process.env.EMAIL_FROM || "onboarding@ucbs.com";
  const subject = "UCBS Employee Onboarding — Complete Your Profile";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e3a5f;">Welcome to UCBS, ${employeeName}!</h2>
      <p>Please complete your employee onboarding form using the secure link below:</p>
      <p style="margin: 24px 0;">
        <a href="${onboardingUrl}" style="background: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Start Onboarding
        </a>
      </p>
      <p style="color: #666; font-size: 14px;">This link is unique to you. Do not share it with others.</p>
      <p style="color: #666; font-size: 14px;">If the button doesn't work, copy this URL:<br/>${onboardingUrl}</p>
    </div>
  `;

  if (!resend) {
    console.log("\n📧 [DEV] Onboarding email (Resend not configured):");
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Link: ${onboardingUrl}\n`);
    return { success: true, dev: true };
  }

  await resend.emails.send({ from, to, subject, html });
  return { success: true };
}

export async function sendSubmissionConfirmationEmail(params: {
  to: string;
  employeeName: string;
}) {
  const { to, employeeName } = params;
  const from = process.env.EMAIL_FROM || "onboarding@ucbs.com";
  const subject = "UCBS Onboarding — Submission Received";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e3a5f;">Thank you, ${employeeName}!</h2>
      <p>Your onboarding form has been submitted successfully.</p>
      <p>Our HR team will review your submission and contact you if any additional information is needed.</p>
      <p style="color: #666; font-size: 14px;">You can revisit your onboarding link to view your submitted information in read-only mode.</p>
    </div>
  `;

  if (!resend) {
    console.log("\n📧 [DEV] Confirmation email:");
    console.log(`   To: ${to}\n`);
    return { success: true, dev: true };
  }

  await resend.emails.send({ from, to, subject, html });
  return { success: true };
}
