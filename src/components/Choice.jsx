import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { getIconByName } from '../utils/iconMap';

const glowVariants = {
  initial: { opacity: 0 },
  hover: { opacity: 0.4 },
};

const Choice = ({
  decision,
  onSelect,
  index = 0,
  accentColor = '#ffffff',
  disabled = false,
  isSelected = false,
}) => {
  const Icon = getIconByName(decision.icon);

  return (
    <motion.button
      type="button"
      onClick={disabled ? undefined : onSelect}
      layout
      className={clsx(
        'relative overflow-hidden rounded-full border-2 px-7 py-4 text-center text-sm uppercase tracking-[0.2em] text-white transition-all duration-300 backdrop-blur',
        'flex items-center gap-3',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        isSelected && !disabled ? 'ring-2 ring-inset ring-white/60' : null
      )}
      style={{
        borderColor: disabled ? 'rgba(255,255,255,0.15)' : `${accentColor}55`,
        backgroundColor: isSelected ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
        boxShadow: isSelected && !disabled ? `0 0 24px ${accentColor}33` : 'none',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
      whileHover={disabled ? undefined : { scale: 1.05 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      aria-disabled={disabled}
      disabled={disabled}
    >
      <motion.div
        className="absolute inset-0"
        initial="initial"
        whileHover={disabled ? undefined : 'hover'}
        variants={glowVariants}
        style={{
          background: `radial-gradient(circle at center, ${accentColor}55, transparent)`,
          opacity: isSelected ? 0.35 : undefined,
        }}
      />
      <div className="relative z-10 flex items-center gap-3">
        {Icon && <Icon className="h-4 w-4" />}
        <span className="text-xs font-medium md:text-sm">{decision.text ?? decision.label}</span>
      </div>
      {isSelected && (
        <span className="absolute right-4 top-1/2 z-10 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/80">
          Elegida
        </span>
      )}
    </motion.button>
  );
};

export default Choice;
