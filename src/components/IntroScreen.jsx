import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Headphones } from 'lucide-react';
import Texturas from '../images/Texturas.png';

const IntroScreen = ({ onStart }) => {
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowCta(true);
    }, 2600);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const backdropStyle = useMemo(
    () => ({
      backgroundImage: `url(${Texturas})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }),
    []
  );

  return (
    <div className="relative flex min-h-screen flex-col bg-black text-white overflow-y-auto overflow-x-hidden md:overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-60" style={backdropStyle} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black via-black/70 to-black" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="safe-bottom relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-10 text-center sm:px-8 sm:py-12"
      >
        <motion.span
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 0.75, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="uppercase tracking-[0.3em] text-xs text-white/60 sm:text-sm"
        >
          Hora Incierta
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.65 }}
          className="mt-6 text-3xl font-semibold leading-relaxed sm:text-4xl sm:leading-snug md:text-5xl"
        >
          Un recorrido entre los últimos suspiros y lo que viene después
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.65 }}
          className="mt-6 max-w-xl text-sm text-white/70 sm:text-base md:text-lg"
        >
          Permite que la historia te envuelva antes de decidir. Cada elección abre un sendero
          distinto. Respira, observa y deja que la incertidumbre marque el ritmo.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.75 }}
          className="mt-12 flex flex-col items-center gap-6 sm:mt-14"
        >
          <div className="relative flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28">
            <motion.div
              className="absolute inset-0 rounded-full border border-white/20"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 4.4, ease: 'easeInOut' }}
            />

            <motion.div
              className="absolute inset-3 rounded-full border border-red-500/40"
              animate={{ opacity: [0.2, 0.65, 0.2], scale: [1, 0.92, 1] }}
              transition={{ repeat: Infinity, duration: 3.4, ease: 'easeInOut', repeatDelay: 0.3 }}
            />

            <motion.div
              className="absolute h-1 w-16 bg-gradient-to-r from-transparent via-white/70 to-transparent"
              animate={{ opacity: [0.15, 0.75, 0.15] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            />

            <motion.div
              className="absolute h-16 w-1 bg-gradient-to-b from-transparent via-red-500/70 to-transparent"
              animate={{ opacity: [0.1, 0.75, 0.1] }}
              transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut', delay: 0.4 }}
            />

            <motion.span
              className="relative text-xs uppercase tracking-[0.35em] text-white/70"
              animate={{ opacity: [0.4, 0.95, 0.4] }}
              transition={{ repeat: Infinity, duration: 3.6, ease: 'easeInOut', delay: 0.2 }}
            >
              Mori
            </motion.span>
          </div>

          <p className="max-w-md text-sm uppercase tracking-[0.35em] text-white/50">
            Esperando a que el velo se levante
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.65 }}
          className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-xs text-white/80 backdrop-blur sm:mt-5 sm:text-sm"
        >
          <Headphones size={18} className="text-white/60" />
          <span>Usa audífonos. El sonido te guiará hacia el otro lado.</span>
        </motion.div>

        <AnimatePresence>
          {showCta && (
            <motion.button
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.55 }}
              onClick={onStart}
              className="mt-3 mb-10 inline-flex w-full max-w-xs items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-xs font-medium tracking-[0.18em] text-white transition hover:border-white/40 hover:bg-white/15 sm:mt-12 sm:max-w-sm sm:px-8 sm:text-sm sm:tracking-[0.25em]"
            >
              Comenzar recorrido
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default IntroScreen;
