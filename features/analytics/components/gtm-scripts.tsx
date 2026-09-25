import Script from "next/script";

/**
 * Google Tag Manager loader + Google Consent Mode defaults.
 *
 * Entirely env-driven: with no `NEXT_PUBLIC_GTM_ID` this renders nothing and
 * loads no scripts. Once the id is set, the business owner can wire up GA4,
 * Google Ads, Meta, TikTok, X and Snap pixels from GTM's UI — no code changes.
 */
export default function GtmScripts() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  if (!gtmId) {
    return null;
  }

  return (
    <>
      {/*
        Consent Mode defaults — set BEFORE GTM loads (beforeInteractive).
        Defaults to `granted` because the owner wants full data capture for
        ad measurement. To move to an opt-in model later, switch these to
        'denied' and call gtag('consent','update',{...}) from the cookie
        notice's accept handler.
      */}
      {/*
        In the App Router, `beforeInteractive` scripts are placed in the root
        layout (app/layout.tsx) — this is the documented Next.js location. The
        lint rule below still references the Pages-Router `pages/_document.js`,
        so it is a false positive here.
      */}
      {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
      <Script id="gtm-consent-default" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            ad_storage: 'granted',
            analytics_storage: 'granted',
            ad_user_data: 'granted',
            ad_personalization: 'granted'
          });
        `}
      </Script>

      {/* Standard GTM container loader. */}
      <Script id="gtm-loader" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmId}');
        `}
      </Script>
    </>
  );
}
