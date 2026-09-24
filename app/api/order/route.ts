import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Order intake → Telegram notification.
// Public route (middleware matcher excludes /api). No auth, no payment, no OTP.
// Requires env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.

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

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildMessage(order: OrderPayload): string {
  const lines: string[] = ["🆕 <b>طلب جديد — عقد إيجار</b>"];

  if (order.orderNumber) {
    lines.push(`رقم الطلب: <b>${escapeHtml(order.orderNumber)}</b>`);
  }
  if (order.contractType) {
    lines.push(`نوع العقد: ${escapeHtml(order.contractType)}`);
  }
  if (order.whatsappNumber) {
    lines.push(`📱 واتساب للتواصل: <b>${escapeHtml(order.whatsappNumber)}</b>`);
  }

  for (const section of order.sections ?? []) {
    const fields = (section.fields ?? []).filter(
      (field) => field?.value != null && String(field.value).trim() !== "",
    );
    if (fields.length === 0) continue;
    lines.push("");
    lines.push(`<b>${escapeHtml(section.title)}</b>`);
    for (const field of fields) {
      lines.push(`• ${escapeHtml(field.label)}: ${escapeHtml(String(field.value))}`);
    }
  }

  if (order.notes && order.notes.trim() !== "") {
    lines.push("");
    lines.push(`📝 ${escapeHtml(order.notes)}`);
  }

  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("[api/order] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
    return NextResponse.json(
      { ok: false, error: "server_not_configured" },
      { status: 500 },
    );
  }

  let order: OrderPayload;
  try {
    order = (await request.json()) as OrderPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const text = buildMessage(order);

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("[api/order] Telegram API error", response.status, detail);
      return NextResponse.json({ ok: false, error: "telegram_failed" }, { status: 502 });
    }
  } catch (error) {
    console.error("[api/order] Telegram request failed", error);
    return NextResponse.json({ ok: false, error: "telegram_unreachable" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, orderNumber: order.orderNumber ?? null });
}
