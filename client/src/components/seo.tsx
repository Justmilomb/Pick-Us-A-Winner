import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  noindex?: boolean;
  structuredData?: object;
}

const defaultTitle = "PickUsAWinner - Free Giveaway Picker, Spin the Wheel & Random Name Picker";
const defaultDescription = "The simplest random selection toolkit on the web. Instagram comment picker, spin the wheel, random name picker & giveaway generator. Trusted by creators. Cryptographically fair. 100% free.";
const defaultImage = "https://giveaway-engine.com/opengraph.jpg";
const baseUrl = "https://giveaway-engine.com";

export function SEO({
  title,
  description = defaultDescription,
  keywords = "pick us a winner, pick me a winner, instagram giveaway picker, giveaway generator, comment picker generator, spin the wheel, random wheel, random name picker, pick names at random, random option picker, giveaway maker, instagram comment picker, winner picker, fair giveaway, trusted by creators",
  image = defaultImage,
  url,
  type = "website",
  noindex = false,
  structuredData,
}: SEOProps) {
  const fullTitle = title ? `${title} | PickUsAWinner` : defaultTitle;
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={fullTitle} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={fullTitle} />

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
