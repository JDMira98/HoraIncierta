import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getIconByName } from '../utils/iconMap';

const InteractiveIcons = ({ icons = [], accentColor = '#ffffff' }) => {
  const [activeIconId, setActiveIconId] = useState(null);

  const positionedIcons = useMemo(
    () =>
      icons.map((icon) => ({
        ...icon,
        position: {
          x: icon.position?.x ?? 50,
          y: icon.position?.y ?? 50,
        },
      })),
    [icons]
  );

  if (!positionedIcons.length) {
    return null;
  }

  const activeIcon = positionedIcons.find((icon) => icon.id === activeIconId);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 hidden md:block">
      <motion.div
        className="pointer-events-none absolute left-1/2 top-10 w-[min(92%,420px)] -translate-x-1/2 rounded-3xl border border-white/15 bg-black/70 px-6 py-4 text-center text-white shadow-lg backdrop-blur"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{ boxShadow: `0 0 24px ${accentColor}20`, borderColor: `${accentColor}40` }}
      >
        <p className="text-[11px] uppercase tracking-[0.35em] text-white/50">Elegí con cuidado</p>
        <p className="mt-2 text-sm leading-relaxed text-white/80">
          Toca el símbolo que te llame. Una vez lo despiertes, los demás se disuelven:
          no hay camino de regreso.
        </p>
      </motion.div>

      {positionedIcons.map((icon) => {
        const IconComponent = getIconByName(icon.icon);
        return (
          <motion.button
            key={icon.id}
            type="button"
            className="pointer-events-auto absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-lg backdrop-blur"
            style={{
              left: `${icon.position.x}%`,
              top: `${icon.position.y}%`,
              boxShadow: `0 0 20px ${accentColor}25`,
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setActiveIconId((prev) => (prev === icon.id ? null : icon.id));
            }}
          >
            <IconComponent className="h-5 w-5" />
          </motion.button>
        );
      })}

      <AnimatePresence>
        {activeIcon && (
          <motion.div
            key={activeIcon.id}
            className="pointer-events-none absolute bottom-12 left-1/2 z-20 w-[min(90%,400px)] -translate-x-1/2 rounded-3xl border border-white/20 bg-black/70 p-6 text-center text-white backdrop-blur"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ boxShadow: `0 0 25px ${accentColor}25` }}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">Elemento interactivo</p>
            <h3 className="mt-2 text-lg font-semibold">{activeIcon.label}</h3>
            <p className="mt-2 text-sm text-white/70">{activeIcon.description}</p>
            {activeIcon.mock && (
              <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-white/40">Mock en espera de recurso real</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InteractiveIcons;
