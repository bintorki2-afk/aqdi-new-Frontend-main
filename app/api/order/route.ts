import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Order intake → multi-channel delivery. Public route (middleware excludes /api).
// No auth, no payment, no OTP. Defense-in-depth so an order is never lost:
//   1. Telegram notification (with one retry)   — env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
//   2. Durable store on the business backend     — env: ORDER_INTAKE_URL (+ optional ORDER_INTAKE_TOKEN)
//   3. Email backup                              — env: RESEND_API_KEY, ORDER_EMAIL_TO, ORDER_EMAIL_FROM
// Any channel that is not configured is skipped. The request succeeds if AT LEAST
// one channel accepted the order; otherwise it fails so the UI can show the
// "contact us on WhatsApp" fallback.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderField = { label: string; value: string };
type OrderSection = { title: string; fields: OrderField[] };
type OrderPayload = {
  orderNumber?: string;
  contractType?: string;
  whatsappNumber?: string;
  sections?: OrderSection[];
  notes?: string;
};

function buildMessage(order: OrderPayload): string {
  const lines: string[] = ["🆕 طلب جديد — عقد إيجار"];

  if (order.orderNumber) lines.push(`رقم الطلب: ${order.orderNumber}`);
  if (order.contractType) lines.push(`نوع العقد: ${order.contractType}`);
  if (order.whatsappNumber) lines.push(`📱 واتساب للتواصل: ${order.whatsappNumber}`);

  for (const section of order.sections ?? []) {
    const fields = (section.fields ?? []).filter(
      (field) => field?.value != null && String(field.value).trim() !== "",
    );
    if (fields.length === 0) continue;
    lines.push("");
    lines.push(`— ${section.title} —`);
    for (const field of fields) {
      lines.push(`• ${field.label}: ${String(field.value)}`);
    }
  }

  if (order.notes && order.notes.trim() !== "") {
    lines.push("");
    lines.push(`📝 ${order.notes}`);
  }

  return lines.join("\n");
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 1) Telegram — one retry on failure.
async function notifyTelegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            disable_web_page_preview: true,
          }),
        },
      );
      if (response.ok) return true;
      const detail = await response.text().catch(() => "");
      console.error("[api/order] Telegram error", response.status, detail);
    } catch (error) {
      console.error("[api/order] Telegram request failed", error);
    }
    if (attempt === 0) await delay(600);
  }
  return false;
}

// 2) Durable store on the business backend (source of truth).
async function storeOnBackend(
  order: OrderPayload,
  createdAt: string,
): Promise<boolean> {
  const url = process.env.ORDER_INTAKE_URL;
  if (!url) return false;

  const token = process.env.ORDER_INTAKE_TOKEN;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ...order, createdAt, source: "web" }),
    });
    if (response.ok) return true;
    const detail = await response.text().catch(() => "");
    console.error("[api/order] Backend store error", response.status, detail);
  } catch (error) {
    console.error("[api/order] Backend store failed", error);
  }
  return false;
}

// 3) Email backup (Resend HTTP API — no extra dependency).
async function emailBackup(order: OrderPayload, text: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ORDER_EMAIL_TO;
  const from = process.env.ORDER_EMAIL_FROM;
  if (!apiKey || !to || !from) return false;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: to.split(",").map((address) => address.trim()),
        subject: `طلب جديد${order.orderNumber ? ` — ${order.orderNumber}` : ""}`,
        text,
      }),
    });
    if (response.ok) return true;
    const detail = await response.text().catch(() => "");
    console.error("[api/order] Email backup error", response.status, detail);
  } catch (error) {
    console.error("[api/order] Email backup failed", error);
  }
  return false;
}

export async function POST(request: NextRequest) {
  let order: OrderPayload;
  try {
    order = (await request.json()) as OrderPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const createdAt = new Date().toISOString();
  const text = buildMessage(order);

  const telegramConfigured = Boolean(
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID,
  );
  const anyChannelConfigured =
    telegramConfigured ||
    Boolean(process.env.ORDER_INTAKE_URL) ||
    Boolean(process.env.RESEND_API_KEY);

  const [telegram, stored, emailed] = await Promise.all([
    notifyTelegram(text),
    storeOnBackend(order, createdAt),
    emailBackup(order, text),
  ]);

  const delivered = telegram || stored || emailed;
  const channels = { telegram, stored, emailed };

  if (!delivered) {
    console.error("[api/order] No delivery channel succeeded", {
      anyChannelConfigured,
      channels,
    });
    return NextResponse.json(
      {
        ok: false,
        error: anyChannelConfigured ? "delivery_failed" : "server_not_configured",
        channels,
      },
      { status: anyChannelConfigured ? 502 : 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    orderNumber: order.orderNumber ?? null,
    channels,
  });
}
