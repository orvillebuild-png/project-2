const messages: Record<string, string> = {
  missing_fields: "Please complete all required fields.",
  missing_email: "Please enter an email address.",
  signup_failed: "We could not create your account. Please try again.",
  org_failed: "Your account was created, but the workspace could not be set up. Please contact support before trying again.",
  email_not_confirmed: "Please verify your email before logging in.",
  invalid_credentials: "The email or password is incorrect.",
  confirmation_sent: "Verification email sent. Please check your inbox.",
  resend_failed: "We could not resend the verification email. Please try again."
};

export function authMessage(code?: string) {
  if (!code) {
    return null;
  }

  return messages[code] ?? code;
}

export function authErrorCode(message?: string) {
  const normalized = (message ?? "").toLowerCase();

  if (normalized.includes("email not confirmed")) {
    return "email_not_confirmed";
  }

  if (normalized.includes("invalid login credentials")) {
    return "invalid_credentials";
  }

  return encodeURIComponent(message ?? "Something went wrong.");
}
