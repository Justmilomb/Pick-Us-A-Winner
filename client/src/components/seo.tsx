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
  additionalStructuredData?: object[];
}

const defaultTitle = "PickUsAWinner - Instagram Giveaway Generator | No Signup, No Login";
const defaultDescription =
  "Instagram giveaway generator & comment picker tool. Pick random winners from Instagram comments. Free to configure. One-time payment (£2.50) for credits. No signup, no subscription.";
const defaultImage = "https://pickusawinner.com/social-image.jpg?v=4";
const baseUrl = "https://pickusawinner.com";

export function SEO({
  title,
  description = defaultDescription,
  keywords = "instagram giveaways tool, instagram giveaway tool, instagram giveaway generator, instagram comments tool, instagram comment picker tool, no login giveaway tool, no signup, one-time payment, random winner selector, pick us a winner, giveaway generator, comment picker",
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
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={fullTitle} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={fullTitle} />

      <link rel="canonical" href={fullUrl} />

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
