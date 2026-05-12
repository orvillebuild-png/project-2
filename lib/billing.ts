export type UsageEventType = "email_sent" | "validation_run";

export type BillingProvider = "lemonsqueezy";

export type UsageRecord = {
  id: string;
  orgId: string;
  type: UsageEventType;
  quantity: number;
  idempotencyKey: string;
};

export async function reportUsage(record: UsageRecord) {
  if (process.env.BILLING_PROVIDER && process.env.BILLING_PROVIDER !== "lemonsqueezy") {
    throw new Error(`Unsupported billing provider: ${process.env.BILLING_PROVIDER}`);
  }

  const { reportLemonSqueezyUsage } = await import("@/lib/lemon-squeezy");
  return reportLemonSqueezyUsage(record);
}
