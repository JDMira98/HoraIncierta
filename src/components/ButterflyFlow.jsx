import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import storyData from '../data/story.json';

const backgroundVariants = {
  zoomIn: {
    initial: { scale: 1.08, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.12, opacity: 0 },
  },
  zoomOut: {
    initial: { scale: 1.18, opacity: 0 },
    animate: { scale: 1.02, opacity: 1 },
    exit: { scale: 0.92, opacity: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
};

const textVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const choiceVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (index) => ({ opacity: 1, y: 0, transition: { delay: 0.08 * index } }),
};

const FONDOS_BASE_PATH = '/Elementos Web/fondos/';

const resolveAssetPath = (rawPath) => {
  if (!rawPath) {
    return null;
  }

  if (/^https?:\/\//i.test(rawPath) || rawPath.startsWith('/')) {
    return rawPath;
  }

  return `${FONDOS_BASE_PATH}${rawPath}`;
};

const resolveBackgroundMedia = (background = {}) => {
  const candidate = background.src ?? background.asset ?? background.image ?? null;
  const src = resolveAssetPath(candidate);

  if (!src) {
    return null;
  }

  const extension = src.split('?')[0]?.split('.')?.pop()?.toLowerCase();

  if (extension === 'mp4' || extension === 'webm' || extension === 'ogg') {
    return {
      type: 'video',
      src,
      loop: background.loop ?? true,
      muted: background.muted ?? true,
      poster: resolveAssetPath(background.poster ?? background.thumbnail ?? null),
    };
  }

  return {
    type: 'image',
    src,
  };
};

const buildStepIndex = (chapters) => {
  const map = new Map();
  const order = [];
  const chapterByStep = new Map();

  chapters.forEach((chapter, chapterIndex) => {
    (chapter.steps ?? []).forEach((step, idx) => {
      map.set(step.id, { ...step, chapterId: chapter.id, chapterIndex, stepIndex: idx });
      order.push(step.id);
      chapterByStep.set(step.id, chapter);
    });
  });

  return { map, order, chapterByStep };
};

const resolveVideoConfig = (choice, settings) => {
  if (!choice?.video360) {
    return null;
  }

  if (typeof choice.video360 === 'object' && choice.video360 !== null) {
    return choice.video360;
  }

  return settings?.videoProvider?.default ?? null;
};

const ButterflyFlow = () => {
  const { meta, chapters = [], settings, epilogue } = storyData;
  const { map: stepMap, order: stepOrder, chapterByStep } = useMemo(
    () => buildStepIndex(chapters),
    [chapters]
  );

  const [currentStepId, setCurrentStepId] = useState(() => meta?.startStepId ?? stepOrder[0] ?? null);
  const [typedText, setTypedText] = useState('');
  const [textComplete, setTextComplete] = useState(false);
  const [audioComplete, setAudioComplete] = useState(true);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [videoOverlay, setVideoOverlay] = useState(null);
  const [activeChoice, setActiveChoice] = useState(null);
  const [isEpilogue, setIsEpilogue] = useState(false);
  const [choiceTimeLeft, setChoiceTimeLeft] = useState(null);
  const audioRef = useRef(null);
  const choiceTimerRef = useRef(null);

  const clearChoiceTimer = useCallback(() => {
    if (choiceTimerRef.current) {
      clearInterval(choiceTimerRef.current);
      choiceTimerRef.current = null;
    }
    setChoiceTimeLeft(null);
  }, []);

  const currentStep = currentStepId ? stepMap.get(currentStepId) : null;
  const currentChapter = currentStepId ? chapterByStep.get(currentStepId) : null;
  const totalSteps = stepOrder.length;
  const currentIndex = currentStep ? stepOrder.indexOf(currentStep.id) : -1;
  const canRevealChoices = Boolean(currentStep?.choices?.length) && textComplete && audioComplete;

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setAudioBlocked(false);

    if (!currentStep?.audio?.src) {
      setAudioComplete(true);
      return;
    }

    if (!isAudioEnabled) {
      setAudioComplete(true);
      return;
    }

    setAudioComplete(false);
    const audio = new Audio(currentStep.audio.src);
    audio.volume = currentStep.audio.volume ?? 1;
    audio.loop = currentStep.audio.loop ?? false;

    const handleEnded = () => {
      setAudioComplete(true);
    };

    const handleError = () => {
      setAudioComplete(true);
      setAudioBlocked(true);
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    audioRef.current = audio;

    const attemptPlay = () => {
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            setAudioBlocked(false);
          })
          .catch(() => {
            setAudioBlocked(true);
            setAudioComplete(true);
          });
      }
    };

    attemptPlay();

    return () => {
      audio.pause();
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [currentStep, isAudioEnabled]);

  useEffect(() => {
    if (!currentStep) {
      setTypedText('');
      setTextComplete(true);
      return;
    }

    const fullText = currentStep.text ?? '';
    const speed = currentStep.typewriter?.speed ?? settings?.typewriter?.defaultSpeed ?? 30;
    const endDelay = currentStep.typewriter?.endDelay ?? settings?.typewriter?.endDelay ?? 400;

    if (!fullText.length) {
      setTypedText('');
      setTextComplete(true);
      return;
    }

    setTypedText('');
    setTextComplete(false);

    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      setTypedText(fullText.slice(0, index));
      if (index >= fullText.length) {
        clearInterval(interval);
        setTimeout(() => {
          setTextComplete(true);
        }, endDelay);
      }
    }, Math.max(speed, 10));

    return () => {
      clearInterval(interval);
    };
  }, [currentStep, settings]);

  useEffect(() => {
    setVideoOverlay(null);
    setActiveChoice(null);
  }, [currentStepId]);

  const goToStep = useCallback((nextStepId) => {
    clearChoiceTimer();

    if (!nextStepId) {
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (nextStepId === epilogue?.id) {
      setIsEpilogue(true);
      setCurrentStepId(null);
      return;
    }

    if (!stepMap.has(nextStepId)) {
      console.warn(`Paso destino no encontrado: ${nextStepId}`);
      return;
    }

    setIsEpilogue(false);
    setCurrentStepId(nextStepId);
  }, [clearChoiceTimer, epilogue, stepMap]);

  const handleChoice = useCallback((choice) => {
    if (!choice) {
      return;
    }

    clearChoiceTimer();

    const videoConfig = resolveVideoConfig(choice, settings);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (videoConfig) {
      setActiveChoice(choice);
      setVideoOverlay({
        ...videoConfig,
        nextStepId: choice.nextStepId,
        label: choice.label,
      });
      return;
    }

    goToStep(choice.nextStepId);
  }, [clearChoiceTimer, goToStep, settings]);

  useEffect(() => {
    clearChoiceTimer();
    setChoiceTimeLeft(null);

    if (!canRevealChoices || !currentStep?.choices?.length) {
      return;
    }

    const timeoutMs = currentStep.choiceTimerMs ?? settings?.choiceTimerMs ?? 7000;
    const startedAt = performance.now();
    setChoiceTimeLeft(timeoutMs);

    const updateTimer = () => {
      const elapsed = performance.now() - startedAt;
      const remaining = Math.max(timeoutMs - elapsed, 0);
      setChoiceTimeLeft(remaining);

      if (remaining <= 0) {
        const fallbackId = currentStep.defaultChoiceId;
        const fallbackChoice = currentStep.choices.find((choice) => choice.id === fallbackId)
          ?? currentStep.choices[0];
        clearChoiceTimer();
        if (fallbackChoice) {
          handleChoice(fallbackChoice);
        }
      }
    };

    if (typeof window === 'undefined') {
      return undefined;
    }

    choiceTimerRef.current = window.setInterval(updateTimer, 100);

    return () => {
      clearChoiceTimer();
    };
  }, [canRevealChoices, clearChoiceTimer, currentStep, handleChoice, settings]);

  const handleSkip = () => {
    if (!currentStep?.skip) {
      return;
    }
    goToStep(currentStep.skip.nextStepId);
  };

  const handleRestart = () => {
    clearChoiceTimer();
    setIsEpilogue(false);
    setCurrentStepId(meta?.startStepId ?? stepOrder[0] ?? null);
  };

  const handleToggleAudio = () => {
    setIsAudioEnabled((prev) => {
      const next = !prev;
      if (!next) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setAudioBlocked(false);
        setAudioComplete(true);
      }
      return next;
    });
  };

  const handleRetryAudio = () => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current
      .play()
      .then(() => {
        setAudioBlocked(false);
        setAudioComplete(false);
      })
      .catch(() => {
        setAudioBlocked(true);
        setAudioComplete(true);
      });
  };


  const accentColor = currentChapter?.theme?.accent ?? '#ffffff';
  const activeBackground = currentStep?.background ?? {};
  const backgroundMedia = resolveBackgroundMedia(activeBackground);
  const hasBackgroundImage = backgroundMedia?.type === 'image';
  const hasBackgroundVideo = backgroundMedia?.type === 'video';
  const chapterTitle = currentChapter?.title ?? meta?.title ?? 'Hora Incierta';
  const choiceTimeoutMs = currentStep?.choiceTimerMs ?? settings?.choiceTimerMs ?? 7000;
  const choiceCountdownSeconds = choiceTimeLeft !== null ? Math.ceil(choiceTimeLeft / 1000) : null;
  const choiceProgress = choiceTimeLeft !== null && choiceTimeoutMs > 0
    ? Math.max(choiceTimeLeft / choiceTimeoutMs, 0)
    : null;
  const audioButtonClasses = isAudioEnabled
    ? 'border-white/60 bg-white/15 text-white'
    : 'border-white/20 bg-white/5 text-white/60';
  const audioStatusMessage = (() => {
    if (!currentStep?.audio?.src) {
      return null;
    }
    if (!isAudioEnabled) {
      return 'Audio desactivado';
    }
    if (audioBlocked) {
      return 'Reintenta el sonido';
    }
    return 'Audio activo';
  })();
  const audioStatusClass = !currentStep?.audio?.src
    ? 'text-white/40'
    : !isAudioEnabled
      ? 'text-white/40'
      : audioBlocked
        ? 'text-red-400'
        : 'text-white/50';

  if (isEpilogue && epilogue) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-black text-white">
        <motion.h1 className="mb-4 text-center text-3xl font-semibold uppercase tracking-[0.35em]">
          {epilogue.title}
        </motion.h1>
        <motion.p className="mb-8 max-w-md text-center text-sm text-white/70">
          {epilogue.text}
        </motion.p>
        <div className="flex flex-wrap justify-center gap-3">
          {(epilogue.actions ?? []).map((action) => (
            <motion.button
              key={action.id}
              type="button"
              className="rounded-full border border-white/25 bg-white/10 px-6 py-3 text-xs uppercase tracking-[0.3em] text-white transition hover:border-white/60 hover:bg-white/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (action.id === 'restart') {
                  handleRestart();
                }
              }}
            >
              {action.label}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-black text-white">
      <AnimatePresence mode="wait">
        {currentStep && (
          <motion.div
            key={`background-${currentStep.id}`}
            className="absolute inset-0 overflow-hidden"
            variants={backgroundVariants[activeBackground.animation] ?? backgroundVariants.zoomIn}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 1.4, ease: 'easeInOut' }}
            style={{
              backgroundColor: currentChapter?.theme?.backgroundColor ?? '#000000',
            }}
          >
            {hasBackgroundVideo && backgroundMedia?.src && (
              <video
                key={`video-${backgroundMedia.src}`}
                className="absolute inset-0 h-full w-full object-cover"
                src={backgroundMedia.src}
                autoPlay
                muted={backgroundMedia.muted ?? true}
                loop={backgroundMedia.loop ?? true}
                playsInline
                poster={backgroundMedia.poster ?? undefined}
              />
            )}

            {hasBackgroundImage && backgroundMedia?.src && (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${backgroundMedia.src})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      <div className="relative z-20 flex h-full w-full flex-col px-6 py-8 md:px-12">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/50">{chapterTitle}</p>
            {currentStep?.sequence && (
              <p className="text-[10px] uppercase tracking-[0.4em] text-white/30">
                Secuencia {currentStep.sequence}
              </p>
            )}
          </div>
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-end gap-2">
              <motion.button
                type="button"
                className={`rounded-full border px-3 py-3 transition-colors duration-200 ${audioButtonClasses}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleToggleAudio}
                aria-pressed={isAudioEnabled}
                aria-label={isAudioEnabled ? 'Desactivar audio' : 'Activar audio'}
                style={{ borderColor: accentColor }}
              >
                {isAudioEnabled ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <VolumeX className="h-5 w-5" />
                )}
              </motion.button>
              {audioStatusMessage && (
                <span className={`text-[9px] uppercase tracking-[0.3em] ${audioStatusClass}`}>
                  {audioStatusMessage}
                </span>
              )}
              {audioBlocked && isAudioEnabled && currentStep?.audio?.src && (
                <motion.button
                  type="button"
                  className="text-[10px] uppercase tracking-[0.3em] text-white/60 underline transition hover:text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRetryAudio}
                >
                  Reintentar audio
                </motion.button>
              )}
            </div>
            {totalSteps > 0 && currentIndex >= 0 && (
              <div className="text-right text-[10px] uppercase tracking-[0.3em] text-white/50">
                {currentIndex + 1} / {totalSteps}
              </div>
            )}
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center gap-6">
          <motion.div variants={textVariants} initial="initial" animate="animate" exit="exit">
            {currentStep?.speaker && (
              <span className="mb-3 inline-block text-xs uppercase tracking-[0.4em] text-white/50">
                {currentStep.speaker}
              </span>
            )}
            <p className="text-left text-lg leading-relaxed text-white md:text-2xl">
              {typedText}
              {!textComplete && <span className="ml-1 animate-pulse">▮</span>}
            </p>
          </motion.div>
        </main>

        <footer className="mt-4 flex flex-col items-center gap-4">
          <AnimatePresence>
            {canRevealChoices && (
              <motion.div
                key={`choices-${currentStep.id}`}
                className="flex w-full flex-col items-center justify-center gap-3 md:flex-row"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
              >
                {currentStep.choices.map((choice, idx) => (
                  <motion.button
                    key={choice.id}
                    custom={idx}
                    variants={choiceVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full max-w-xs rounded-full border bg-white/10 px-6 py-3 text-xs uppercase tracking-[0.35em] text-white transition hover:bg-white/20"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    style={{ borderColor: accentColor ?? '#ffffff' }}
                    onClick={() => handleChoice(choice)}
                  >
                    {choice.label}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {currentStep?.skip && (
            <motion.button
              type="button"
              className="text-[10px] uppercase tracking-[0.3em] text-white/40 transition hover:text-white/70"
              onClick={handleSkip}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {currentStep.skip.label ?? 'Omitir'}
            </motion.button>
          )}
        </footer>
      </div>

      <AnimatePresence>
        {videoOverlay && (
          <motion.div
            key="video-overlay"
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/15 bg-black">
              <div className="relative w-full pb-[56.25%]">
                <iframe
                  title={videoOverlay.title ?? 'Video 360°'}
                  src={`https://www.youtube.com/embed/${videoOverlay.id}?enablejsapi=1&rel=0&playsinline=1`}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-white/10 px-4 py-3 text-xs uppercase tracking-[0.3em] text-white/60">
                <span>{activeChoice?.label}</span>
                <button
                  type="button"
                  className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-white transition hover:border-white/60 hover:bg-white/20"
                  onClick={() => {
                    const next = videoOverlay.nextStepId;
                    setVideoOverlay(null);
                    setActiveChoice(null);
                    setAudioComplete(true);
                    goToStep(next);
                  }}
                >
                  Continuar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {choiceCountdownSeconds !== null && (
        <motion.div
          key="choice-timer-overlay"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-6 pb-8 md:px-12"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <div className="flex w-full flex-col gap-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
              <motion.div
                className="h-full"
                style={{ backgroundColor: accentColor, transformOrigin: 'left' }}
                animate={{ scaleX: choiceProgress ?? 1 }}
                initial={{ scaleX: 1 }}
                transition={{ duration: 0.2, ease: 'linear' }}
              />
            </div>
            <span className="text-[9px] uppercase tracking-[0.35em] text-white/60">
              Selección automática en {choiceCountdownSeconds}s
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ButterflyFlow;
