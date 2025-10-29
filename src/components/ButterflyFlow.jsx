import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull } from 'lucide-react';
import storyData from '../data/story.json';
import Scene from './Scene';

const generateStepKey = (chapterId) => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${chapterId}-${crypto.randomUUID()}`;
  }
  return `${chapterId}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`;
};

const ButterflyFlow = () => {
  const { meta, chapters } = storyData;
  const chapterMap = useMemo(() => {
    const map = new Map();
    chapters.forEach((chapter) => {
      map.set(chapter.id, chapter);
    });
    return map;
  }, [chapters]);

  const [path, setPath] = useState(() => [
    {
      chapterId: meta.startChapterId,
      key: generateStepKey(meta.startChapterId),
    },
  ]);
  const [isIntroVisible, setIsIntroVisible] = useState(true);
  const sceneRefs = useRef(new Map());
  const decisionRefs = useRef(new Map());
  const liveRegionRef = useRef(null);

  useEffect(() => {
    const lastStep = path[path.length - 1];
    const node = sceneRefs.current.get(lastStep.key);
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [path]);

  const currentStep = path[path.length - 1];
  const currentChapter = currentStep ? chapterMap.get(currentStep.chapterId) : null;

  useEffect(() => {
    if (!liveRegionRef.current || !currentChapter) {
      return;
    }
    liveRegionRef.current.textContent = `Explorando ${currentChapter.title}`;
  }, [currentChapter]);

  const visitedCount = useMemo(() => {
    const unique = new Set(path.map((step) => step.chapterId));
    return unique.size;
  }, [path]);

  const progress = Math.min(visitedCount / chapters.length, 1);
  const percentProgress = Math.round(progress * 100);

  const decisionDestinations = useMemo(() => {
    const map = new Map();
    path.forEach((step) => {
      if (step.from) {
        map.set(step.from, step.chapterId);
      }
    });
    return map;
  }, [path]);

  const handleDecision = (fromChapterId, nextChapterId) => {
    if (!chapterMap.has(nextChapterId)) {
      console.warn(`Capítulo destino no encontrado: ${nextChapterId}`);
      return;
    }

    setPath((prevPath) => {
      const lastStep = prevPath[prevPath.length - 1];
      if (!lastStep || lastStep.chapterId !== fromChapterId) {
        return prevPath;
      }

      if (nextChapterId === lastStep.chapterId) {
        return prevPath;
      }

      return [
        ...prevPath,
        {
          chapterId: nextChapterId,
          key: generateStepKey(nextChapterId),
          from: fromChapterId,
        },
      ];
    });
  };

  const handleRestart = () => {
    sceneRefs.current = new Map();
    decisionRefs.current = new Map();
    setPath([
      {
        chapterId: meta.startChapterId,
        key: generateStepKey(meta.startChapterId),
      },
    ]);
    setIsIntroVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBeginExperience = () => {
    setIsIntroVisible(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJumpToStep = (stepKey) => {
    const node = sceneRefs.current.get(stepKey);
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const registerDecisionAnchor = useCallback((stepKey, node) => {
    if (node) {
      decisionRefs.current.set(stepKey, node);
    } else {
      decisionRefs.current.delete(stepKey);
    }
  }, []);

  const handleGoToDecision = () => {
    const lastStep = path[path.length - 1];
    if (!lastStep) {
      return;
    }
    const node = decisionRefs.current.get(lastStep.key);
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-black text-white">
      <motion.div
        className="pointer-events-none fixed top-0 left-0 right-0 z-40 h-1 origin-left bg-white/20"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: progress }}
        transition={{ ease: 'easeOut', duration: 0.8 }}
      />

      <div ref={liveRegionRef} aria-live="polite" className="sr-only" />

      <motion.button
        onClick={handleRestart}
        className="fixed bottom-6 right-6 z-40 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white backdrop-blur hover:border-white/40 hover:bg-white/20"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Reiniciar recorrido
      </motion.button>

      <AnimatePresence>
        {isIntroVisible && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="relative mb-8 flex h-24 w-24 items-center justify-center"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <motion.div
                className="absolute inset-0 rounded-full border border-white/10"
                style={{ boxShadow: '0 0 40px rgba(255,255,255,0.2)' }}
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, ease: 'linear', duration: 18 }}
              />
              <motion.div
                className="absolute inset-[12%] rounded-full border border-white/10"
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, ease: 'linear', duration: 24 }}
              />
              <motion.div
                className="absolute inset-[28%] rounded-full bg-white/5"
                animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.3, 0.15] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="relative flex h-12 w-12 items-center justify-center"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Skull className="h-8 w-8 text-white" />
              </motion.div>
            </motion.div>
            <motion.h1
              className="mb-3 font-display text-3xl uppercase tracking-[0.3em] text-white md:text-5xl"
              initial={{ opacity: 0, letterSpacing: '0.6em' }}
              animate={{ opacity: 1, letterSpacing: '0.3em' }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            >
              {meta.title}
            </motion.h1>
            {meta.subtitle && (
              <motion.p
                className="mb-4 text-xs uppercase tracking-[0.4em] text-white/60 md:text-sm"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
              >
                {meta.subtitle}
              </motion.p>
            )}
            <motion.p
              className="max-w-xl px-8 text-center text-sm text-white/70 md:text-base"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              {meta.description}
            </motion.p>
            <motion.p
              className="mt-6 text-[10px] uppercase tracking-[0.35em] text-white/40"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
            >
              Preparando el tránsito entre memorias y ausencia
            </motion.p>
            <motion.button
              type="button"
              onClick={handleBeginExperience}
              className="mt-8 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-xs uppercase tracking-[0.3em] text-white backdrop-blur hover:border-white/60 hover:bg-white/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Comenzar recorrido
            </motion.button>
            <motion.p
              className="mt-4 text-[10px] uppercase tracking-[0.3em] text-white/40"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
            >
              6 capítulos · decisiones ramificadas · experiencia guiada
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {currentChapter && (
        <motion.div
          className="sticky top-6 z-30 mx-auto mt-6 w-full max-w-5xl px-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="rounded-3xl border border-white/10 bg-black/60 p-6 backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/50">Recorrido interactivo</p>
                <h2 className="mt-2 text-lg font-semibold text-white md:text-xl">{currentChapter.title}</h2>
                <p className="text-xs text-white/50">
                  Capítulo {currentChapter.order} de {chapters.length} · {percentProgress}% completado
                </p>
              </div>
              <div className="flex w-full flex-col items-start gap-3 md:w-auto md:items-end">
                <p className="text-xs text-white/60">
                  {visitedCount} de {chapters.length} capítulos visitados
                </p>
                <div className="flex flex-wrap gap-2">
                  {path.map((step, idx) => {
                    const chapter = chapterMap.get(step.chapterId);
                    const isCurrent = idx === path.length - 1;
                    const label = chapter ? chapter.title : step.chapterId;
                    const chipClasses = isCurrent
                      ? 'border-white/40 bg-white/20 text-white'
                      : 'border-white/15 bg-white/5 text-white/60 hover:border-white/40 hover:bg-white/10 hover:text-white';
                    return (
                      <motion.button
                        key={step.key}
                        type="button"
                        onClick={() => handleJumpToStep(step.key)}
                        className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em] transition-colors duration-200 ${chipClasses}`}
                        whileHover={isCurrent ? undefined : { scale: 1.03 }}
                        whileTap={isCurrent ? undefined : { scale: 0.97 }}
                        aria-current={isCurrent ? 'step' : undefined}
                      >
                        {idx + 1}. {label}
                      </motion.button>
                    );
                  })}
                </div>
                {currentChapter.decisions?.length ? (
                  <motion.button
                    type="button"
                    onClick={handleGoToDecision}
                    className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[10px] uppercase tracking-[0.3em] text-white transition-colors hover:border-white/60 hover:bg-white/20"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    Ir a la decisión
                  </motion.button>
                ) : (
                  <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                    Desenlace sin decisiones restantes
                  </span>
                )}
              </div>
            </div>
            <p className="mt-4 text-xs text-white/60">
              {currentChapter.decisions?.length ? 'Explorá el capítulo y elegí una opción para avanzar.' : 'Has llegado al desenlace del recorrido interactivo.'}
            </p>
          </div>
        </motion.div>
      )}

      <div className="relative">
        {path.map((step, index) => {
          const chapter = chapterMap.get(step.chapterId);
          if (!chapter) {
            return null;
          }

          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: index === 0 ? 0.2 : 0 }}
              ref={(node) => {
                if (node) {
                  sceneRefs.current.set(step.key, node);
                } else {
                  sceneRefs.current.delete(step.key);
                }
              }}
            >
              <Scene
                chapter={chapter}
                index={index}
                totalChapters={chapters.length}
                onDecision={handleDecision}
                isActive={index === path.length - 1}
                selectedDecision={decisionDestinations.get(step.chapterId)}
                stepKey={step.key}
                onRegisterDecisionAnchor={registerDecisionAnchor}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ButterflyFlow;