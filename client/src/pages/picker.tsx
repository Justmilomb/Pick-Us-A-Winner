import Layout from "@/components/layout";
import { SEO } from "@/components/seo";
import { ListPickerComponent } from "@/components/tools/ListPickerComponent";
import { motion } from "framer-motion";
import { AdBanner } from "@/components/AdBanner";
import { Zap } from "lucide-react";
import { InstagramFunnel } from "@/components/tools/InstagramFunnel";
import { RelatedTools } from "@/components/RelatedTools";

export default function PickerPage() {
    const faqStructuredData = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "How does the Random Name Picker work?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Our random name picker uses a secure algorithm to select a winner from your list. Simply paste your names and click the button."
                }
            },
            {
                "@type": "Question",
                "name": "How many names can I add?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You can add thousands of names to the list. There is no strict limit, making it perfect for large raffles and giveaways."
                }
            }
        ]
    };

    return (
        <Layout>
            <SEO
                title="Random Name Picker | Free Raffle & Contest Winner Generator"
                description="Pick a random winner from a list of names. Free, fast, and fair random name picker for raffles, contests, and giveaways. No registration required."
                url="/picker"
                keywords="random name picker, random picker, raffle generator, contest winner picker, list randomizer, pick a winner"
                structuredData={faqStructuredData}
            />

            <div className="max-w-6xl mx-auto space-y-12 pb-12">
                {/* Header */}
                <div className="text-center space-y-4 pt-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 bg-[#A733F4] text-white border-2 border-black px-4 py-1 font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#000] transform rotate-1"
                    >
                        <Zap className="w-5 h-5" /> Instant Results
                    </motion.div>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase italic tracking-tighter">
                        Random Name <span className="text-primary text-stroke-sm">Picker</span>
                    </h1>
                    <p className="text-lg md:text-xl font-medium text-muted-foreground max-w-2xl mx-auto px-4">
                        The fairest way to draw a winner from a list. Perfect for raffles, contests, and giveaways.
                    </p>
                </div>

                {/* Main Tool Area */}
                <div className="px-4">
                    <ListPickerComponent />
                </div>

                <InstagramFunnel />

                <section className="container mx-auto px-4">
                    <AdBanner type="adsense" className="w-full" />
                </section>

                {/* SEO Content Section */}
                <div className="grid md:grid-cols-2 gap-8 px-4 py-8 bg-white border-y-4 border-black">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black uppercase">Why use this Name Picker?</h2>
                        <p className="text-lg leading-relaxed">
                            This <strong>Random Name Picker</strong> is designed to be the fastest and most secure way to pick a winner online.
                            Unlike other tools, we run everything in your browser so your data stays private.
                        </p>
                        <h3 className="text-xl font-bold uppercase mt-6">Key Features:</h3>
                        <ul className="list-disc pl-5 space-y-2 font-medium">
                            <li>100% Free and Ad-supported</li>
                            <li>No limit on number of names</li>
                            <li>Option to remove winners after selection</li>
                            <li>Fun animations and interface</li>
                            <li>Works on Mobile and Desktop</li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black uppercase">Start a Raffle</h2>
                        <ol className="list-decimal pl-5 space-y-4 text-lg font-medium">
                            <li>
                                <strong>Enter Names:</strong> Paste your list of names into the box. One name per line.
                            </li>
                            <li>
                                <strong>Configure:</strong> Check "Remove winner" if you plan to pick multiple people from the same list.
                            </li>
                            <li>
                                <strong>Pick:</strong> Click "PICK RANDOM WINNER" to start the selection process.
                            </li>
                            <li>
                                <strong>Celebration:</strong> We'll announce the winner with confetti!
                            </li>
                        </ol>
                        <p className="mt-4 p-4 bg-primary text-white border-2 border-black font-bold">
                            Looking for an Instagram giveaway picker? <a href="/tool" className="underline hover:text-yellow-300">Click here</a>.
                        </p>
                        <RelatedTools excludePath="/picker" max={3} className="mt-8 pt-6 border-t-2 border-black" />
                    </div>
                </div>

            </div>
        </Layout>
    );
}
