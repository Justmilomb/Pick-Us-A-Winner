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
  /** Additional structured data (e.g. BreadcrumbList). Merged with structuredData if both provided. */
  additionalStructuredData?: object[];
}

const defaultTitle = "PickUsAWinner - The Fairest Instagram Giveaway Tool";
const defaultDescription = "Secure, transparent, and certified random winner picking for Instagram giveaways. Filter comments, detect fraud, and pick winners fairly.";
const defaultImage = "https://giveaway-engine.com/opengraph.jpg";
const baseUrl = "https://giveaway-engine.com";

export function SEO({
  title,
  description = defaultDescription,
  keywords = "instagram giveaway picker, random winner selector, fair giveaway tool, fraud detection, instagram contest, social media giveaway, winner picker, secure giveaway",
  image = defaultImage,
  url,
  type = "website",
  noindex = false,
  structuredData,
  additionalStructuredData,
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
      {additionalStructuredData?.map((data, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
}
