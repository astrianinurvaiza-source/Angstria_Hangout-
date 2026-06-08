import React from 'react';
import { Coffee } from 'lucide-react';
import { motion } from 'motion/react';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ fullScreen }) => {
  const content = (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        animate={{ 
          rotate: [0, 10, -10, 0],
          y: [0, -10, 0]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 1.5,
          ease: "easeInOut"
        }}
        className="text-cafe-brown"
      >
        <Coffee size={48} />
      </motion.div>
      <p className="text-cafe-mocha font-medium animate-pulse">Brewing your content...</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-cafe-beige flex items-center justify-center z-[100]">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-12">
      {content}
    </div>
  );
};

export default LoadingSpinner;
