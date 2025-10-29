import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const DecisionButton = ({ decision, onSelect, index }) => {
  const colorVariants = {
    amber: 'from-amber-500/20 to-orange-500/20 hover:from-amber-400/30 hover:to-orange-400/30 border-amber-400/30 hover:border-amber-300/50',
    purple: 'from-purple-500/20 to-violet-500/20 hover:from-purple-400/30 hover:to-violet-400/30 border-purple-400/30 hover:border-purple-300/50',
    emerald: 'from-emerald-500/20 to-green-500/20 hover:from-emerald-400/30 hover:to-green-400/30 border-emerald-400/30 hover:border-emerald-300/50',
    cyan: 'from-cyan-500/20 to-blue-500/20 hover:from-cyan-400/30 hover:to-blue-400/30 border-cyan-400/30 hover:border-cyan-300/50',
    indigo: 'from-indigo-500/20 to-purple-500/20 hover:from-indigo-400/30 hover:to-purple-400/30 border-indigo-400/30 hover:border-indigo-300/50',
    slate: 'from-slate-500/20 to-gray-500/20 hover:from-slate-400/30 hover:to-gray-400/30 border-slate-400/30 hover:border-slate-300/50',
    rose: 'from-rose-500/20 to-pink-500/20 hover:from-rose-400/30 hover:to-pink-400/30 border-rose-400/30 hover:border-rose-300/50',
    teal: 'from-teal-500/20 to-cyan-500/20 hover:from-teal-400/30 hover:to-cyan-400/30 border-teal-400/30 hover:border-teal-300/50',
    red: 'from-red-500/20 to-rose-500/20 hover:from-red-400/30 hover:to-rose-400/30 border-red-400/30 hover:border-red-300/50',
    violet: 'from-violet-500/20 to-purple-500/20 hover:from-violet-400/30 hover:to-purple-400/30 border-violet-400/30 hover:border-violet-300/50',
  };

  const buttonVariants = {
    initial: {
      opacity: 0,
      y: 30,
      scale: 0.9,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    hover: {
      scale: 1.05,
      y: -5,
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1,
      },
    },
  };

  const glowVariants = {
    initial: { opacity: 0 },
    hover: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
  };

  return (
    <motion.div
      className="relative group"
      variants={buttonVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
    >
      {/* Glow effect */}
      <motion.div
        className={clsx(
          'absolute inset-0 rounded-full blur-xl opacity-0',
          `bg-gradient-to-r ${colorVariants[decision.color] || colorVariants.purple}`
        )}
        variants={glowVariants}
      />
      
      {/* Button */}
      <motion.button
        onClick={onSelect}
        className={clsx(
          'relative px-6 py-4 md:px-8 md:py-5 rounded-full',
          'bg-gradient-to-r backdrop-blur-md border-2',
          'text-white font-medium text-sm md:text-base',
          'transition-all duration-300',
          'flex flex-col items-center justify-center',
          'min-w-[200px] md:min-w-[240px]',
          'shadow-2xl',
          colorVariants[decision.color] || colorVariants.purple
        )}
      >
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
        
        <span className="relative z-10 font-semibold mb-1">
          {decision.text}
        </span>
        
        {decision.description && (
          <span className="relative z-10 text-xs md:text-sm text-white/70 text-center leading-tight">
            {decision.description}
          </span>
        )}

        {/* Floating particles around button */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              style={{
                left: `${20 + Math.random() * 60}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
              animate={{
                y: [-5, -15, -5],
                opacity: [0.3, 0.8, 0.3],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2 + Math.random(),
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </motion.button>

      {/* Ripple effect on click */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-white/30"
        initial={{ scale: 1, opacity: 0 }}
        whileTap={{ 
          scale: 1.5, 
          opacity: [0, 0.5, 0],
          transition: { duration: 0.4 }
        }}
      />
    </motion.div>
  );
};

export default DecisionButton;