import Layout from "@/components/layout";
import { SEO } from "@/components/seo";
import { Link } from "wouter";
import { Link2 } from "lucide-react";

export default function PressPage() {
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://pickusawinner.com/" },
      { "@type": "ListItem", position: 2, name: "Press & Media", item: "https://pickusawinner.com/press" },
    ],
  };

  return (
    <Layout>
      <SEO
        title="Press & Media"
        description="Media kit, logos, and link to us. PickUsAWinner - the fairest Instagram giveaway winner picker. Free for creators."
        url="/press"
        keywords="pick us a winner, giveaway tool, instagram picker, press, media kit"
        additionalStructuredData={[breadcrumbData]}
      />

      <div className="max-w-4xl mx-auto py-16 px-4">
        <h1 className="text-4xl md:text-6xl font-black uppercase italic mb-6">
          Press & <span className="text-primary">Media</span>
        </h1>
        <p className="text-xl font-bold text-muted-foreground mb-12">
          Link to us, use our logos, or reach out for press inquiries.
        </p>

        <section className="space-y-8 mb-16">
          <h2 className="text-2xl font-black uppercase flex items-center gap-2">
            <Link2 className="w-6 h-6" /> Link to Us
          </h2>
          <p className="text-lg font-medium leading-relaxed">
            We appreciate backlinks from creators, blogs, and media. If you mention PickUsAWinner, please link to{" "}
            <a href="https://pickusawinner.com" className="text-primary font-bold underline hover:no-underline">
              https://pickusawinner.com
            </a>{" "}
            or our main tool at{" "}
            <Link href="/tool" className="text-primary font-bold underline hover:no-underline">
              /tool
            </Link>
            .
          </p>
          <div className="bg-slate-100 border-2 border-black p-4 font-mono text-sm">
            &lt;a href="https://pickusawinner.com"&gt;PickUsAWinner - Free Instagram Giveaway Picker&lt;/a&gt;
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black uppercase">Contact</h2>
          <p className="text-lg font-medium">
            For press inquiries or partnership opportunities, visit our{" "}
            <Link href="/giveaway-generator" className="text-primary font-bold underline hover:no-underline">
              homepage
            </Link>{" "}
            or use the contact options in the footer.
          </p>
        </section>
      </div>
    </Layout>
  );
}
