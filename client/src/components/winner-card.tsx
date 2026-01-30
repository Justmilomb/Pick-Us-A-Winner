import { motion } from "framer-motion";
import { User, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Winner {
  id: string;
  username: string;
  avatar?: string;
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
      
      <div className="flex flex-col items-center text-center gap-3 sm:gap-4 mt-4">
        <div className="relative">
          <Avatar className="w-16 h-16 sm:w-24 sm:h-24 border-3 sm:border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <AvatarImage src={winner.avatar} />
            <AvatarFallback className="bg-white text-lg sm:text-2xl font-bold font-display">
              {winner.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-green-500 border-2 border-black rounded-full p-0.5 sm:p-1 text-white">
             <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="w-full">
          <h3 className="text-lg sm:text-2xl font-black bg-white inline-block px-2 border-2 border-black transform -rotate-2 mb-2 truncate max-w-full">
            @{winner.username}
          </h3>
          <div className="bg-white border-2 border-black p-2 sm:p-3 mt-2 text-xs sm:text-sm italic relative break-words">
             <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-white border-t-2 border-l-2 border-black transform rotate-45"></div>
            "{winner.comment}"
          </div>
        </div>
      </div>
    </motion.div>
  );
}