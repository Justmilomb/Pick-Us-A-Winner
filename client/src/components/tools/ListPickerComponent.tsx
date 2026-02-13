import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Shuffle, Trophy, Trash2, RefreshCcw } from "lucide-react";
import confetti from "canvas-confetti";
import { Checkbox } from "@/components/ui/checkbox";

interface ListPickerComponentProps {
    initialNames?: string;
}

export function ListPickerComponent({ initialNames = "" }: ListPickerComponentProps) {
    const [inputVal, setInputVal] = useState(initialNames);
    const [winner, setWinner] = useState<string | null>(null);
    const [isPicking, setIsPicking] = useState(false);
    const [removeWinner, setRemoveWinner] = useState(false);
    const [recentWinners, setRecentWinners] = useState<string[]>([]);

    const getNames = () => {
        return inputVal
            .split("\n")
            .map(n => n.trim())
            .filter(n => n.length > 0);
    };

    const pickWinner = () => {
        const names = getNames();
        if (names.length < 1) return;

        setIsPicking(true);
        setWinner(null);

        // Animation simulation
        let count = 0;
        const maxCount = 20;
        const interval = setInterval(() => {
            const randomIdx = Math.floor(Math.random() * names.length);
            setWinner(names[randomIdx]);
            count++;
            if (count >= maxCount) {
                clearInterval(interval);
                finalizeWinner(names);
            }
        }, 100);
    };

    const finalizeWinner = (currentNames: string[]) => {
        const randomIdx = Math.floor(Math.random() * currentNames.length);
        const winningName = currentNames[randomIdx];

        setWinner(winningName);
        setIsPicking(false);
        setRecentWinners([winningName, ...recentWinners]);

        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });

        if (removeWinner) {
            const newNames = [...currentNames];
            newNames.splice(randomIdx, 1);
            setInputVal(newNames.join("\n"));
        }
    };

    const clearList = () => {
        if (confirm("Are you sure you want to clear the list?")) {
            setInputVal("");
            setWinner(null);
            setRecentWinners([]);
        }
    };

    const nameCount = getNames().length;

    return (
        <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Input Panel */}
            <div className="neo-box p-6 order-2 lg:order-1 space-y-6">
                <div className="flex items-center justify-between border-b-2 border-black pb-4">
                    <Label className="text-2xl font-black uppercase flex items-center gap-2">
                        Enter Names <span className="bg-black text-white px-2 py-0.5 text-sm rounded-none">{nameCount}</span>
                    </Label>
                    <Button variant="ghost" size="sm" onClick={clearList} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4 mr-2" /> Clear
                    </Button>
                </div>

                <Textarea
                    placeholder="Enter names here (one per line)...&#10;Alice&#10;Bob&#10;Charlie"
                    className="neo-input min-h-[300px] font-mono text-base resize-none"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                />

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="remove-winner"
                        checked={removeWinner}
                        onCheckedChange={(c) => setRemoveWinner(c === true)}
                        className="w-5 h-5 border-2 border-black data-[state=checked]:bg-primary data-[state=checked]:text-white"
                    />
                    <label
                        htmlFor="remove-winner"
                        className="text-sm font-bold uppercase leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                        Remove winner from list after picking
                    </label>
                </div>
            </div>

            {/* Action / Result Panel */}
            <div className="order-1 lg:order-2 space-y-8">
                <div className="bg-[#A733F4] p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-white text-center space-y-6 relative overflow-hidden">
                    {/* Decorative patterns */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

                    <div className="relative z-10 min-h-[160px] flex flex-col items-center justify-center">
                        {winner ? (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                key={winner} // Re-animate on new winner
                                className="space-y-2"
                            >
                                <span className="inline-block text-sm font-bold uppercase bg-white text-black px-3 py-1 mb-2 transform -rotate-2">
                                    The Winner Is
                                </span>
                                <p className="text-5xl md:text-6xl font-black uppercase break-all leading-tight drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                                    {winner}
                                </p>
                            </motion.div>
                        ) : (
                            <div className="text-center opacity-50">
                                <Trophy className="w-16 h-16 mx-auto mb-2" />
                                <p className="text-xl font-bold uppercase">Ready to Pick</p>
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={pickWinner}
                        disabled={isPicking || nameCount < 1}
                        className="w-full bg-white text-black text-2xl font-black py-8 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all relative z-20"
                    >
                        {isPicking ? (
                            <RefreshCcw className="w-8 h-8 animate-spin" />
                        ) : (
                            "PICK RANDOM WINNER"
                        )}
                    </Button>
                </div>

                {recentWinners.length > 0 && (
                    <div className="neo-box p-6 bg-white">
                        <h3 className="text-lg font-black uppercase mb-4 border-b-2 border-slate-100 pb-2">Recent Winners</h3>
                        <ul className="space-y-2">
                            {recentWinners.map((w, i) => (
                                <li key={i} className="flex items-center gap-2 text-lg font-medium">
                                    <span className="text-muted-foreground text-sm font-bold w-6">#{recentWinners.length - i}</span>
                                    {w}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
