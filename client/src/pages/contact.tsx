import { useState } from "react";
import Layout from "@/components/layout";
import { SEO } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, Mail } from "lucide-react";

type ContactFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const SUBJECT_OPTIONS = [
  "General Inquiry",
  "Bug Report",
  "Feature Request",
  "Partnership",
  "Other",
];

export default function ContactPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<ContactFormData>>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    toast({
      title: "Contact form disabled",
      description: "Please email support@pickusawinner.com directly.",
    });
  }

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://pickusawinner.com/" },
      { "@type": "ListItem", position: 2, name: "Contact", item: "https://pickusawinner.com/contact" },
    ],
  };

  return (
    <Layout>
      <SEO
        title="Contact Us"
        description="Get in touch with PickUsAWinner. Support, feedback, partnerships. We typically respond within 24-48 hours."
        url="/contact"
        keywords="contact pickusawinner, support, feedback, partnership, instagram giveaway"
        additionalStructuredData={[breadcrumbData]}
      />

      <div className="max-w-4xl mx-auto py-16 px-4">
        <h1 className="text-4xl md:text-6xl font-black uppercase italic mb-6">
          Contact <span className="text-primary">Us</span>
        </h1>
        <p className="text-xl font-bold text-muted-foreground mb-12">
          Have a question, feedback, or partnership idea? Please contact us directly by email.
        </p>

        <div className="grid md:grid-cols-2 gap-12">
          <section className="space-y-6">
            <h2 className="text-2xl font-black uppercase flex items-center gap-2">
              <Mail className="w-6 h-6" /> Get in Touch
            </h2>
            <p className="text-lg font-medium leading-relaxed">
              The contact form is temporarily unavailable. For all inquiries, email us directly at{" "}
              <a
                href="mailto:support@pickusawinner.com"
                className="text-primary font-bold underline hover:no-underline"
              >
                support@pickusawinner.com
              </a>
              .
            </p>
            <div className="bg-slate-100 border-2 border-black p-6 space-y-2">
              <p className="font-bold">PickUsAWinner Support</p>
              <p className="text-muted-foreground">support@pickusawinner.com</p>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="p-6 border-4 border-black bg-slate-100 shadow-neo space-y-6 opacity-70">
            <div className="border-2 border-black bg-white p-4 font-bold text-sm">
              Contact form is temporarily unavailable. Please email{" "}
              <a href="mailto:support@pickusawinner.com" className="underline text-primary">
                support@pickusawinner.com
              </a>{" "}
              directly.
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="font-bold">Name</Label>
              <Input
                id="name"
                value={formData.name ?? ""}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="Your name"
                className="border-2 border-black"
                disabled={true}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email ?? ""}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder="you@example.com"
                className="border-2 border-black"
                disabled={true}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject" className="font-bold">Subject</Label>
              <Select
                value={formData.subject ?? ""}
                onValueChange={(v) => setFormData((p) => ({ ...p, subject: v }))}
                disabled={true}
              >
                <SelectTrigger className="border-2 border-black">
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECT_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="font-bold">Message</Label>
              <Textarea
                id="message"
                value={formData.message ?? ""}
                onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                placeholder="How can we help?"
                rows={5}
                className="border-2 border-black resize-none"
                disabled={true}
              />
            </div>

            <Button
              type="submit"
              disabled={true}
              className="w-full font-black uppercase border-2 border-black bg-primary text-white hover:bg-primary/90 hover:border-primary"
            >
              <Send className="w-5 h-5 mr-2" />
              Contact Form Disabled
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
