import Layout from "@/components/layout";
import { SEO } from "@/components/seo";
import { Link } from "wouter";
import { Link2, Download } from "lucide-react";

export default function PressPage() {
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://giveaway-engine.com/" },
      { "@type": "ListItem", position: 2, name: "Press & Media", item: "https://giveaway-engine.com/press" },
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
            <a href="https://giveaway-engine.com" className="text-primary font-bold underline hover:no-underline">
              https://giveaway-engine.com
            </a>{" "}
            or our main tool at{" "}
            <Link href="/tool" className="text-primary font-bold underline hover:no-underline">
              /tool
            </Link>
            .
          </p>
          <div className="bg-slate-100 border-2 border-black p-4 font-mono text-sm">
            &lt;a href="https://giveaway-engine.com"&gt;PickUsAWinner - Free Instagram Giveaway Picker&lt;/a&gt;
          </div>
        </section>

        <section className="space-y-8 mb-16">
          <h2 className="text-2xl font-black uppercase flex items-center gap-2">
            <Download className="w-6 h-6" /> Brand Assets
          </h2>
          <p className="text-lg font-medium leading-relaxed">
            Use our logo and branding when writing about PickUsAWinner. Please do not alter the logo or imply endorsement.
          </p>
          <div className="p-6 border-2 border-black bg-white space-y-6">
            <img
              src="/pickusawinner-logo.png"
              alt="Pick Us A Winner - #1 Winner Picker"
              className="max-w-sm h-auto"
            />
            <a
              href="/pickusawinner-logo.png"
              download="pickusawinner-logo.png"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-bold border-2 border-black hover:bg-primary hover:border-primary transition-colors"
            >
              <Download className="w-5 h-5" />
              Download Logo (PNG)
            </a>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-black uppercase">Contact</h2>
          <p className="text-lg font-medium">
            For press inquiries or partnership opportunities, visit our{" "}
            <Link href="/" className="text-primary font-bold underline hover:no-underline">
              homepage
            </Link>{" "}
            or use the contact options in the footer.
          </p>
        </section>
      </div>
    </Layout>
  );
}
