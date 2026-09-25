declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/**
 * Push an arbitrary event object onto the GTM dataLayer.
 * No-op on the server (SSR) so it is safe to call from anywhere.
 */
export function pushToDataLayer(event: Record<string, unknown>): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}

/**
 * Fire the standard `generate_lead` conversion event.
 *
 * GTM (and any pixel wired through it — Google Ads, Meta, TikTok, X, Snap)
 * listens for this event as the conversion trigger. `value` is only included
 * when `NEXT_PUBLIC_LEAD_VALUE` is set to a numeric value.
 */
export function trackLead(params: {
  orderNumber: string;
  contractType: string;
}): void {
  const leadValue = Number(process.env.NEXT_PUBLIC_LEAD_VALUE);
  const value = Number.isFinite(leadValue) && leadValue > 0 ? leadValue : undefined;

  pushToDataLayer({
    event: "generate_lead",
    order_number: params.orderNumber,
    contract_type: params.contractType,
    currency: "SAR",
    value,
  });
}

export {};
