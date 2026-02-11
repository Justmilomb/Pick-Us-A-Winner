import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface Winner {
  id: string;
  username: string;
  comment: string;
  platform: 'youtube' | 'instagram' | 'tiktok';
}

export function WinnerCard({ winner, index }: { winner: Winner; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 15,
        delay: index * 0.2
      }}
      className="neo-box p-4 sm:p-6 relative bg-secondary overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-1.5 sm:p-2 bg-black text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest border-l-2 border-b-2 border-white">
        Winner #{index + 1}
      </div>

      <div className="flex flex-col items-center text-center gap-3 sm:gap-4 mt-6">

        <div className="w-full">
          <div className="relative inline-block">
            <h3 className="text-xl sm:text-3xl font-black bg-white inline-block px-4 py-2 border-2 border-black transform -rotate-2 mb-2 truncate max-w-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              @{winner.username}
            </h3>
            <div className="absolute -top-3 -right-3 bg-green-500 border-2 border-black rounded-full p-1 text-white z-10">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>


          <div className="bg-white border-2 border-black p-4 mt-4 text-sm sm:text-base italic relative break-words shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t-2 border-l-2 border-black transform rotate-45"></div>
            "{winner.comment}"
          </div>
        </div>
      </div>
    </motion.div>
  );
}
