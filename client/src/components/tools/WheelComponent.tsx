import { useState, useRef, useEffect } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { Trash2, Plus, Shuffle, Trophy, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import confetti from "canvas-confetti";

interface WheelComponentProps {
    initialSegments?: string[];
}

const COLORS = [
    "#FFDA44", // Yellow
    "#A733F4", // Purple
    "#FF338D", // Pink
    "#33FF57", // Green
    "#33C1FF", // Blue
    "#FF5733", // Orange
];

export function WheelComponent({ initialSegments = ["Alice", "Bob", "Charlie", "David", "Eve", "Frank"] }: WheelComponentProps) {
    const [segments, setSegments] = useState<string[]>(initialSegments);
    const [rotation, setRotation] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState<string | null>(null);
    const [newSegment, setNewSegment] = useState("");
    const [soundEnabled, setSoundEnabled] = useState(true);
    const controls = useAnimation();
    const wheelRef = useRef<HTMLDivElement>(null);

    // Sound placeholders - in a real app, use useSound or Audio API
    const playClick = () => { if (soundEnabled) { /* play tick */ } };
    const playWin = () => { if (soundEnabled) { /* play cheer */ } };

    const spinWheel = () => {
        if (isSpinning || segments.length < 2) return;

        setIsSpinning(true);
        setWinner(null);

        // Random rotation between 5 and 10 full spins (1800 - 3600 degrees) + random offset
        const spins = 5 + Math.random() * 5;
        const extraDegrees = Math.random() * 360;
        const totalRotation = rotation + (spins * 360) + extraDegrees;

        controls.start({
            rotate: totalRotation,
            transition: {
                duration: 5,
                type: "spring",
                stiffness: 50,
                damping: 20,
                mass: 1,
                ease: "easeOut"
            }
        }).then(() => {
            setRotation(totalRotation % 360);
            setIsSpinning(false);
            calculateWinner(totalRotation);
        });
    };

    const calculateWinner = (finalRotation: number) => {
        // Normalize rotation to 0-360
        const normalizedRotation = finalRotation % 360;

        // The pointer is usually at the right (0 degrees) or top (270 degrees)
        // Assuming pointer is at the RIGHT (0 degrees in CSS rotation)
        // The wheel rotates CLOCKWISE.
        // So if the wheel rotates 90deg, the segment at 270deg (initial) is now at 0deg.
        // effective angle = (360 - normalizedRotation) % 360

        // Let's assume 0deg is at 3 o'clock.
        // Segment 0 starts at 0deg to S degrees.
        const segmentSize = 360 / segments.length;

        // We need to find which segment is at the pointer (let's say pointer is at 0/360 - right side).
        // If we rotate 10 degrees, the segment that was at 350 is now at 0.
        const pointerAngle = 360 - (normalizedRotation % 360);

        // Calculate index
        // We need to account for the pointer position deviation if necessary, but 0 is standard.
        // Actually typically standard CSS rotation starts at 12 o'clock if we don't offset.
        // But SVG arcs usually start 0 at 3 o'clock. 
        // Let's do a simple calculation:
        const winningIndex = Math.floor(pointerAngle / segmentSize) % segments.length;

        const winName = segments[winningIndex];
        setWinner(winName);
        playWin();
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    };

    const addSegment = () => {
        if (newSegment.trim()) {
            setSegments([...segments, newSegment.trim()]);
            setNewSegment("");
        }
    };

    const removeSegment = (index: number) => {
        const newSegments = [...segments];
        newSegments.splice(index, 1);
        setSegments(newSegments);
    };

    const shuffleSegments = () => {
        setSegments([...segments].sort(() => Math.random() - 0.5));
    };

    // SVG Helper to create pie slices
    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    return (
        <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Configuration Panel */}
            <div className="neo-box p-6 order-2 lg:order-1 space-y-6">
                <div className="flex items-center justify-between border-b-2 border-black pb-4">
                    <h2 className="text-2xl font-black uppercase">Entries</h2>
                    <div className="flex gap-2">
                        <Button size="icon" variant="outline" className="border-2 border-black" onClick={shuffleSegments} title="Shuffle">
                            <Shuffle className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="outline" className="border-2 border-black" onClick={() => setSoundEnabled(!soundEnabled)} title="Toggle Sound">
                            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Input
                        value={newSegment}
                        onChange={(e) => setNewSegment(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addSegment()}
                        placeholder="Add a name..."
                        className="neo-input"
                    />
                    <Button onClick={addSegment} className="neo-btn-secondary p-3">
                        <Plus className="w-6 h-6" />
                    </Button>
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                    {segments.map((segment, i) => (
                        <motion.div
                            layout
                            key={i + segment} // simple key
                            className="flex items-center justify-between p-3 bg-white border-2 border-black shadow-sm group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full border border-black" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                <span className="font-bold truncate max-w-[180px]">{segment}</span>
                            </div>
                            <button onClick={() => removeSegment(i)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Wheel Display */}
            <div className="order-1 lg:order-2 flex flex-col items-center">
                <div className="relative w-full max-w-[500px] aspect-square flex items-center justify-center mb-8">
                    {/* Pointer */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 w-12 h-12 flex items-center justify-center">
                        <div className="w-0 h-0 border-t-[15px] border-t-transparent border-l-[30px] border-l-black border-b-[15px] border-b-transparent drop-shadow-md"></div>
                    </div>

                    {/* Helper container for fixing rotation origin if needed */}
                    <motion.div
                        ref={wheelRef}
                        className="w-full h-full rounded-full border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden relative bg-white"
                        initial={{ rotate: 0 }}
                        animate={controls}
                    >
                        <svg viewBox="-1 -1 2 2" className="w-full h-full transform -rotate-0">
                            {segments.length === 0 && (
                                <text x="0" y="0" textAnchor="middle" dominantBaseline="middle" fontSize="0.2">Add Names</text>
                            )}
                            {segments.length === 1 && (
                                <circle cx="0" cy="0" r="1" fill={COLORS[0]} />
                            )}
                            {segments.length > 1 && segments.map((segment, i) => {
                                const percent = 1 / segments.length;
                                const startAngle = i * percent;
                                const endAngle = (i + 1) * percent;

                                const [startX, startY] = getCoordinatesForPercent(startAngle);
                                const [endX, endY] = getCoordinatesForPercent(endAngle);

                                // Large arc flag
                                const largeArcFlag = percent > 0.5 ? 1 : 0;

                                const pathData = [
                                    `M 0 0`,
                                    `L ${startX} ${startY}`,
                                    `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                                    `Z`
                                ].join(' ');

                                // Calculate text position (mid-angle)
                                const midAngle = startAngle + (percent / 2);
                                const [textX, textY] = getCoordinatesForPercent(midAngle);

                                return (
                                    <g key={i}>
                                        <path d={pathData} fill={COLORS[i % COLORS.length]} stroke="black" strokeWidth="0.01" />
                                        <text
                                            x={textX * 0.6}
                                            y={textY * 0.6}
                                            fill="black"
                                            fontSize="0.1"
                                            fontWeight="bold"
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            transform={`rotate(${midAngle * 360}, ${textX * 0.6}, ${textY * 0.6})`}
                                            style={{ pointerEvents: 'none', userSelect: 'none' }}
                                        >
                                            {segment.length > 10 ? segment.substring(0, 10) + '...' : segment}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    </motion.div>
                </div>

                <Button
                    onClick={spinWheel}
                    disabled={isSpinning || segments.length < 2}
                    className="neo-btn-primary text-2xl py-8 px-12 w-full max-w-[300px]"
                >
                    {isSpinning ? "Spinning..." : "SPIN IT!"}
                </Button>
            </div>

            {/* Winner Modal/Overlay */}
            {winner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 max-w-md w-full text-center space-y-6 relative">
                        <button onClick={() => setWinner(null)} className="absolute top-2 right-2 p-2 hover:bg-slate-100">
                            ✕
                        </button>

                        <div className="inline-block p-4 rounded-full bg-yellow-400 border-2 border-black mb-4 animate-bounce">
                            <Trophy className="w-12 h-12" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-bold uppercase text-muted-foreground">We have a winner!</h3>
                            <p className="text-4xl md:text-5xl font-black text-primary break-words">
                                {winner}
                            </p>
                        </div>

                        <div className="pt-4 flex gap-4 justify-center">
                            <Button onClick={() => setWinner(null)} variant="outline" className="border-2 border-black font-bold">
                                Close
                            </Button>
                            <Button onClick={() => { setWinner(null); spinWheel(); }} className="neo-btn-primary">
                                Spin Again
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
