/**
 * GTM `<noscript>` fallback iframe — the second half of the standard GTM
 * install snippet, meant to sit as the first child of <body>.
 *
 * Inert when `NEXT_PUBLIC_GTM_ID` is unset.
 */
export default function GtmNoScript() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  if (!gtmId) {
    return null;
  }

  return (
    <noscript>
      <iframe
        title="Google Tag Manager"
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height={0}
        width={0}
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
