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
const ICONOS_BASE_PATH = '/Elementos Web/Iconos/';

const resolveAssetPath = (rawPath, { fallbackDir } = {}) => {
  if (!rawPath) {
    return null;
  }

  const trimmedPath = rawPath.trim();

  if (/^https?:\/\//i.test(trimmedPath) || trimmedPath.startsWith('data:') || trimmedPath.startsWith('blob:')) {
    return trimmedPath;
  }

  let normalizedPath = trimmedPath;

  if (
    fallbackDir
    && !normalizedPath.startsWith('/')
    && !normalizedPath.startsWith('./')
    && !normalizedPath.startsWith('../')
    && !normalizedPath.includes('/')
  ) {
    const normalizedFallback = fallbackDir.endsWith('/') ? fallbackDir : `${fallbackDir}/`;
    normalizedPath = `${normalizedFallback}${normalizedPath}`;
  }

  if (!normalizedPath.startsWith('/')) {
    normalizedPath = `/${normalizedPath}`;
  }

  const baseUrl = (import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '/';
  const sanitizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const encodedPath = encodeURI(normalizedPath);

  return `${sanitizedBase}${encodedPath}` || encodedPath;
};

const resolveBackgroundMedia = (background = {}) => {
  const candidate = background.src ?? background.asset ?? background.image ?? null;
  const src = resolveAssetPath(candidate, { fallbackDir: FONDOS_BASE_PATH });

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
      poster: resolveAssetPath(background.poster ?? background.thumbnail ?? null, {
        fallbackDir: FONDOS_BASE_PATH,
      }),
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

const resolveVideoConfig = (source, settings) => {
  if (!source) {
    return null;
  }

  if (source.provider && settings?.videoProvider?.[source.provider]) {
    return settings.videoProvider[source.provider];
  }

  const candidate = source.video360 ?? source.video ?? source.videoConfig;

  if (typeof candidate === 'object' && candidate !== null) {
    return candidate;
  }

  if (typeof candidate === 'string' && settings?.videoProvider?.[candidate]) {
    return settings.videoProvider[candidate];
  }

  if (candidate === true) {
    return settings?.videoProvider?.default ?? null;
  }

  if (source.id && source.type) {
    return {
      type: source.type,
      id: source.id,
      title: source.title,
      autoplay: source.autoplay,
      muted: source.muted,
      controls: source.controls,
      params: source.params,
    };
  }

  if (source.src) {
    return {
      type: source.type ?? 'url',
      src: source.src,
      title: source.title,
      autoplay: source.autoplay,
      muted: source.muted,
      controls: source.controls,
      params: source.params,
    };
  }

  return null;
};

const ButterflyFlow = () => {
  const { meta, chapters = [], settings, epilogue } = storyData;
  const { map: stepMap, order: stepOrder, chapterByStep } = useMemo(
    () => buildStepIndex(chapters),
    [chapters]
  );

  const sequenceMenuChapters = useMemo(
    () =>
      chapters.map((chapter) => {
        const accent = chapter.theme?.accent ?? '#ffffff';
        const steps = (chapter.steps ?? []).map((step, idx) => {
          const rawText = typeof step.text === 'string' ? step.text.replace(/\s+/g, ' ').trim() : '';
          const preview = rawText.length > 90 ? `${rawText.slice(0, 90)}…` : rawText;
          return {
            id: step.id,
            sequence: step.sequence ?? `${idx + 1}`,
            speaker: step.speaker,
            preview,
          };
        });

        return {
          id: chapter.id,
          title: chapter.title ?? chapter.id,
          accent,
          steps,
        };
      }),
    [chapters]
  );

  const [currentStepId, setCurrentStepId] = useState(() => meta?.startStepId ?? stepOrder[0] ?? null);
  const [typedText, setTypedText] = useState('');
  const [textComplete, setTextComplete] = useState(false);
  const [audioComplete, setAudioComplete] = useState(true);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [videoOverlay, setVideoOverlay] = useState(null);
  const [activeChoice, setActiveChoice] = useState(null);
  const [isEpilogue, setIsEpilogue] = useState(false);
  const [choiceTimeLeft, setChoiceTimeLeft] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);
  const [isTypewriterReady, setIsTypewriterReady] = useState(true);
  const [showAudioGuidanceHint, setShowAudioGuidanceHint] = useState(false);
  const [isSequenceMenuOpen, setIsSequenceMenuOpen] = useState(false);
  const audioRef = useRef(null);
  const ambientAudioRef = useRef(null);
  const activeAmbientSourceRef = useRef(null);
  const choiceTimerRef = useRef(null);
  const typewriterTimerRef = useRef(null);
  const typewriterFallbackTimerRef = useRef(null);
  const hasTriggeredAutoMediaRef = useRef(false);
  const autoLaunchTimerRef = useRef(null);

  const stopAmbientAudio = useCallback(() => {
    if (ambientAudioRef.current) {
      ambientAudioRef.current.pause();
      ambientAudioRef.current.src = '';
      ambientAudioRef.current = null;
    }
    activeAmbientSourceRef.current = null;
  }, []);

  const clearChoiceTimer = useCallback(() => {
    if (choiceTimerRef.current) {
      clearInterval(choiceTimerRef.current);
      choiceTimerRef.current = null;
    }
    setChoiceTimeLeft(null);
  }, []);

  const clearAutoLaunchTimer = useCallback(() => {
    if (autoLaunchTimerRef.current) {
      clearTimeout(autoLaunchTimerRef.current);
      autoLaunchTimerRef.current = null;
    }
  }, []);

  const currentStep = currentStepId ? stepMap.get(currentStepId) : null;
  const currentChapter = currentStepId ? chapterByStep.get(currentStepId) : null;
  const totalSteps = stepOrder.length;
  const currentIndex = currentStep ? stepOrder.indexOf(currentStep.id) : -1;
  const iconVideoOptions = useMemo(() => {
    const icons = currentStep?.interactiveIcons ?? [];
    return icons.map((icon) => ({
      ...icon,
      asset: resolveAssetPath(icon.icon ?? icon.asset ?? icon.src ?? null, {
        fallbackDir: ICONOS_BASE_PATH,
      }),
    }));
  }, [currentStep]);
  const hasIconVideos = iconVideoOptions.length > 0;

  useEffect(() => {
    if (typewriterTimerRef.current) {
      clearTimeout(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }

    if (typewriterFallbackTimerRef.current) {
      clearTimeout(typewriterFallbackTimerRef.current);
      typewriterFallbackTimerRef.current = null;
    }

    if (!currentStep) {
      setTypedText('');
      setTextComplete(true);
      setAudioDuration(null);
      setIsTypewriterReady(true);
      setShowAudioGuidanceHint(false);
      return;
    }

    setTypedText('');
    setTextComplete(false);
    setAudioDuration(null);
    setIsTypewriterReady(!currentStep.audio?.src);
    setShowAudioGuidanceHint(false);
  }, [currentStep]);

  const hasChoices = Boolean(currentStep?.choices?.length) && !hasIconVideos;
  const canRevealChoices = hasChoices && textComplete && audioComplete;
  const canInteractWithIcons = hasIconVideos && textComplete && audioComplete;

  useEffect(() => {
    if (audioBlocked && showAudioGuidanceHint) {
      setShowAudioGuidanceHint(false);
    }
    if (audioBlocked && !isTypewriterReady) {
      setIsTypewriterReady(true);
    }

    if (!currentStep?.audio?.src) {
      if (typewriterFallbackTimerRef.current) {
        clearTimeout(typewriterFallbackTimerRef.current);
        typewriterFallbackTimerRef.current = null;
      }
      if (!isTypewriterReady) {
        setIsTypewriterReady(true);
      }
      if (showAudioGuidanceHint) {
        setShowAudioGuidanceHint(false);
      }
      return;
    }

    if (audioDuration) {
      if (typewriterFallbackTimerRef.current) {
        clearTimeout(typewriterFallbackTimerRef.current);
        typewriterFallbackTimerRef.current = null;
      }
      if (!isTypewriterReady) {
        setIsTypewriterReady(true);
      }
      if (isAudioEnabled && !audioBlocked && !showAudioGuidanceHint) {
        setShowAudioGuidanceHint(true);
      }
      if (!isAudioEnabled && showAudioGuidanceHint) {
        setShowAudioGuidanceHint(false);
      }
      return;
    }

    if (typewriterFallbackTimerRef.current) {
      clearTimeout(typewriterFallbackTimerRef.current);
      typewriterFallbackTimerRef.current = null;
    }

    if (typeof window === 'undefined') {
      setIsTypewriterReady(true);
      return;
    }

    typewriterFallbackTimerRef.current = window.setTimeout(() => {
      setIsTypewriterReady(true);
      typewriterFallbackTimerRef.current = null;
      if (isAudioEnabled && !audioBlocked && !showAudioGuidanceHint) {
        setShowAudioGuidanceHint(true);
      }
    }, 800);

    return () => {
      if (typewriterFallbackTimerRef.current) {
        clearTimeout(typewriterFallbackTimerRef.current);
        typewriterFallbackTimerRef.current = null;
      }
    };
  }, [audioBlocked, audioDuration, currentStep, isAudioEnabled, isTypewriterReady, showAudioGuidanceHint]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      stopAmbientAudio();
      if (typewriterTimerRef.current) {
        clearTimeout(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }
      if (typewriterFallbackTimerRef.current) {
        clearTimeout(typewriterFallbackTimerRef.current);
        typewriterFallbackTimerRef.current = null;
      }
    };
  }, [stopAmbientAudio]);

  useEffect(() => {
    if (isEpilogue) {
      stopAmbientAudio();
      return;
    }

    const ambientConfig = currentChapter?.ambient;
    const ambientSrc = ambientConfig?.src ? resolveAssetPath(ambientConfig.src) : null;

    if (!ambientSrc) {
      stopAmbientAudio();
      return;
    }

    if (activeAmbientSourceRef.current !== ambientSrc) {
      stopAmbientAudio();
      const ambientAudio = new Audio(ambientSrc);
      ambientAudio.loop = ambientConfig.loop ?? true;
      ambientAudio.volume = ambientConfig.volume ?? 0.4;
      ambientAudio.preload = 'auto';
      ambientAudioRef.current = ambientAudio;
      activeAmbientSourceRef.current = ambientSrc;
    }

    const ambientAudio = ambientAudioRef.current;

    if (!ambientAudio) {
      return;
    }

    ambientAudio.volume = ambientConfig?.volume ?? 0.4;

    const shouldPlayAmbient = ambientConfig?.autoplay !== false;

    if (shouldPlayAmbient && ambientAudio.paused) {
      const playPromise = ambientAudio.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.catch(() => {});
      }
    }

    return () => {
      if (!ambientConfig?.src) {
        stopAmbientAudio();
      }
    };
  }, [currentChapter, isEpilogue, stopAmbientAudio]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }

    setAudioBlocked(false);

    const audioConfig = currentStep?.audio;

    if (!audioConfig?.src) {
      setAudioComplete(true);
      setShowAudioGuidanceHint(false);
      return;
    }

    const audioSrc = resolveAssetPath(audioConfig.src);

    if (!audioSrc) {
      setAudioComplete(true);
      setShowAudioGuidanceHint(false);
      return;
    }

    const audio = new Audio(audioSrc);
    audio.preload = 'auto';
    audio.volume = audioConfig.volume ?? 1;
    audio.loop = audioConfig.loop ?? false;

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setAudioDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setAudioComplete(true);
    };

    const handleError = () => {
      setAudioComplete(true);
      setAudioBlocked(true);
      setShowAudioGuidanceHint(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    audioRef.current = audio;
    audio.load();

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
            setShowAudioGuidanceHint(false);
          });
      }
    };

    if (isAudioEnabled) {
      setAudioComplete(false);
      audio.currentTime = 0;
      attemptPlay();
    } else {
      setAudioComplete(true);
      setShowAudioGuidanceHint(false);
    }

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audioRef.current = null;
    };
  }, [currentStep, isAudioEnabled]);

  useEffect(() => {
    if (!currentStep) {
      setTypedText('');
      setTextComplete(true);
      return;
    }

    if (showAudioGuidanceHint && isAudioEnabled && currentStep.audio?.src) {
      setTypedText('');
      setTextComplete(true);
      return;
    }

    if (!isTypewriterReady) {
      return;
    }

    const fullText = typeof currentStep.text === 'string' ? currentStep.text : '';

    if (!fullText.length) {
      setTypedText('');
      setTextComplete(true);
      return;
    }

    const baseSpeed = currentStep.typewriter?.speed ?? settings?.typewriter?.defaultSpeed ?? 22;
    const defaultEndDelay = currentStep.typewriter?.endDelay ?? settings?.typewriter?.endDelay ?? 400;
    const charCount = fullText.length;
    const canSyncWithAudio = isAudioEnabled && !audioBlocked && audioDuration && audioDuration > 0;
    const durationMs = canSyncWithAudio ? audioDuration * 1000 : null;
    const stepSpeed = durationMs ? Math.max(durationMs / Math.max(charCount, 1), 10) : Math.max(baseSpeed, 10);
    const resolvedEndDelay = durationMs ? Math.min(defaultEndDelay, 250) : defaultEndDelay;

    if (typewriterTimerRef.current) {
      clearTimeout(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }

    let index = 0;
    let cancelled = false;

    const typeNext = () => {
      if (cancelled) {
        return;
      }

      index += 1;
      setTypedText(fullText.slice(0, index));

      if (index >= charCount) {
        typewriterTimerRef.current = setTimeout(() => {
          if (!cancelled) {
            setTextComplete(true);
          }
        }, resolvedEndDelay);
        return;
      }

      typewriterTimerRef.current = setTimeout(typeNext, stepSpeed);
    };

    setTypedText('');
    setTextComplete(false);
    typeNext();

    return () => {
      cancelled = true;
      if (typewriterTimerRef.current) {
        clearTimeout(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }
    };
  }, [audioBlocked, audioDuration, currentStep, isAudioEnabled, isTypewriterReady, settings, showAudioGuidanceHint]);

  useEffect(() => {
    setVideoOverlay(null);
    setActiveChoice(null);
    hasTriggeredAutoMediaRef.current = false;
    clearAutoLaunchTimer();
  }, [clearAutoLaunchTimer, currentStepId]);

  useEffect(() => {
    if (!isSequenceMenuOpen) {
      return undefined;
    }

    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsSequenceMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSequenceMenuOpen]);

  useEffect(() => {
    if (videoOverlay) {
      setIsSequenceMenuOpen(false);
    }
  }, [videoOverlay]);

  useEffect(() => {
    if (!currentStep) {
      clearAutoLaunchTimer();
      hasTriggeredAutoMediaRef.current = false;
      return undefined;
    }

    const mediaConfig = currentStep.media;

    if (!mediaConfig?.autoLaunch) {
      clearAutoLaunchTimer();
      hasTriggeredAutoMediaRef.current = false;
      return undefined;
    }

    if (!textComplete || !audioComplete) {
      clearAutoLaunchTimer();
      hasTriggeredAutoMediaRef.current = false;
      return undefined;
    }

    if (videoOverlay) {
      clearAutoLaunchTimer();
      return undefined;
    }

    if (hasTriggeredAutoMediaRef.current) {
      return undefined;
    }

    const resolvedVideo = resolveVideoConfig(mediaConfig, settings);

    if (!resolvedVideo) {
      return undefined;
    }

    const hasValidMedia = Boolean(
      (resolvedVideo.type === 'youtube' && resolvedVideo.id)
      || resolvedVideo.src
    );

    if (!hasValidMedia) {
      return undefined;
    }

    const triggerOverlay = () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      clearChoiceTimer();
      setActiveChoice(null);
      setVideoOverlay({
        ...resolvedVideo,
        label: mediaConfig.label ?? resolvedVideo.label ?? resolvedVideo.title ?? 'Recurso',
        continueLabel: mediaConfig.continueLabel ?? 'Continuar',
        nextStepId: mediaConfig.nextStepId ?? currentStep.skip?.nextStepId ?? null,
        origin: 'step',
        autoplay: mediaConfig.autoplay ?? resolvedVideo.autoplay ?? true,
        muted: mediaConfig.muted ?? resolvedVideo.muted,
        controls: mediaConfig.controls ?? resolvedVideo.controls,
        params: mediaConfig.params ?? resolvedVideo.params,
      });
    };

    const delaySeconds = Number(mediaConfig.seconds ?? mediaConfig.delaySeconds ?? 0);
    const delayMs = Number.isFinite(delaySeconds) && delaySeconds > 0 ? delaySeconds * 1000 : 0;

    hasTriggeredAutoMediaRef.current = true;

    if (delayMs > 0) {
      if (typeof window === 'undefined') {
        triggerOverlay();
        return () => {
          clearAutoLaunchTimer();
        };
      }

      autoLaunchTimerRef.current = window.setTimeout(() => {
        autoLaunchTimerRef.current = null;
        triggerOverlay();
      }, delayMs);

      return () => {
        clearAutoLaunchTimer();
      };
    }

    triggerOverlay();
    return () => {
      clearAutoLaunchTimer();
    };
  }, [audioComplete, clearAutoLaunchTimer, clearChoiceTimer, currentStep, settings, textComplete, videoOverlay]);

  const goToStep = useCallback((nextStepId) => {
    clearChoiceTimer();
    clearAutoLaunchTimer();

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
  }, [clearAutoLaunchTimer, clearChoiceTimer, epilogue, stepMap]);

  const handleSelectStep = useCallback((stepId) => {
    setIsSequenceMenuOpen(false);
    if (!stepId || stepId === currentStepId) {
      return;
    }
    goToStep(stepId);
  }, [currentStepId, goToStep]);

  const handleSecretSequenceDoubleClick = useCallback(() => {
    if (currentIndex <= 0) {
      return;
    }

    const previousStepId = stepOrder[currentIndex - 1];

    if (!previousStepId) {
      return;
    }

    goToStep(previousStepId);
  }, [currentIndex, goToStep, stepOrder]);

  const handleChoice = useCallback((choice) => {
    if (!choice) {
      return;
    }

    clearChoiceTimer();
    clearAutoLaunchTimer();

    const videoConfig = resolveVideoConfig(choice, settings);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (videoConfig) {
      setActiveChoice(choice);
      const hasValidMedia = Boolean(
        (videoConfig.type === 'youtube' && videoConfig.id)
        || videoConfig.src
      );

      if (!hasValidMedia) {
        goToStep(choice.nextStepId);
        return;
      }

      setVideoOverlay({
        ...videoConfig,
        nextStepId: choice.nextStepId,
        label: choice.label,
        continueLabel: choice.continueLabel ?? 'Continuar',
        origin: 'choice',
        autoplay: choice.autoplay ?? videoConfig.autoplay,
        muted: choice.muted ?? videoConfig.muted,
        controls: choice.controls ?? videoConfig.controls,
        params: choice.params ?? videoConfig.params,
      });
      return;
    }

    goToStep(choice.nextStepId);
  }, [clearAutoLaunchTimer, clearChoiceTimer, goToStep, settings]);

  const handleIconVideo = useCallback((iconOption) => {
    if (!iconOption) {
      return;
    }

    clearChoiceTimer();
    clearAutoLaunchTimer();

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const videoConfig = resolveVideoConfig(iconOption.video ?? iconOption, settings);
    const fallbackNextStep = iconOption.nextStepId ?? currentStep?.skip?.nextStepId ?? null;

    const hasValidMedia = Boolean(
      videoConfig
      && ((videoConfig.type === 'youtube' && videoConfig.id) || videoConfig.src)
    );

    if (!hasValidMedia) {
      if (fallbackNextStep) {
        goToStep(fallbackNextStep);
      }
      return;
    }

    setActiveChoice({
      id: iconOption.id,
      label: iconOption.label,
      subtitle: iconOption.subtitle,
      origin: 'icon',
    });
    setVideoOverlay({
      ...videoConfig,
      nextStepId: fallbackNextStep,
      label: iconOption.label ?? videoConfig.label ?? videoConfig.title,
      continueLabel: iconOption.continueLabel ?? videoConfig.continueLabel ?? 'Continuar',
      origin: 'icon',
      autoplay: iconOption.autoplay ?? videoConfig.autoplay ?? true,
      muted: iconOption.muted ?? videoConfig.muted,
      controls: iconOption.controls ?? videoConfig.controls,
      params: iconOption.params ?? videoConfig.params,
    });
  }, [clearAutoLaunchTimer, clearChoiceTimer, currentStep, goToStep, settings]);

  useEffect(() => {
    clearChoiceTimer();
    setChoiceTimeLeft(null);

    if (!canRevealChoices || !hasChoices) {
      return;
    }

    const timeoutMs = currentStep.choiceTimerMs ?? settings?.choiceTimerMs ?? 15000;
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
  }, [canRevealChoices, clearChoiceTimer, currentStep, handleChoice, hasChoices, settings]);

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
      if (next) {
        if (currentStep?.audio?.src) {
          if (typewriterTimerRef.current) {
            clearTimeout(typewriterTimerRef.current);
            typewriterTimerRef.current = null;
          }
          if (typewriterFallbackTimerRef.current) {
            clearTimeout(typewriterFallbackTimerRef.current);
            typewriterFallbackTimerRef.current = null;
          }
          setAudioDuration(null);
          setIsTypewriterReady(false);
          setTypedText('');
          setTextComplete(false);
        }
        setShowAudioGuidanceHint(false);
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setAudioBlocked(false);
        setAudioComplete(true);
        setShowAudioGuidanceHint(false);
        if (currentStep?.audio?.src) {
          if (typewriterTimerRef.current) {
            clearTimeout(typewriterTimerRef.current);
            typewriterTimerRef.current = null;
          }
          if (typewriterFallbackTimerRef.current) {
            clearTimeout(typewriterFallbackTimerRef.current);
            typewriterFallbackTimerRef.current = null;
          }
          setAudioDuration(null);
          setIsTypewriterReady(true);
          setTypedText('');
          setTextComplete(false);
        }
      }
      return next;
    });
  };

  const handleRetryAudio = () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (typewriterTimerRef.current) {
      clearTimeout(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }
    if (typewriterFallbackTimerRef.current) {
      clearTimeout(typewriterFallbackTimerRef.current);
      typewriterFallbackTimerRef.current = null;
    }

    if (currentStep?.audio?.src) {
      setAudioDuration(null);
      setIsTypewriterReady(false);
      setTypedText('');
      setTextComplete(false);
    }

    setShowAudioGuidanceHint(false);

    audio.currentTime = 0;
    audio.load();
    setAudioComplete(false);

    audio
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
  const choiceTimeoutMs = hasChoices
    ? currentStep?.choiceTimerMs ?? settings?.choiceTimerMs ?? 15000
    : 0;
  const choiceCountdownSeconds = choiceTimeLeft !== null ? Math.ceil(choiceTimeLeft / 1000) : null;
  const choiceProgress = choiceTimeLeft !== null && choiceTimeoutMs > 0
    ? Math.max(choiceTimeLeft / choiceTimeoutMs, 0)
    : null;
  const isSkipVisible = Boolean(currentStep?.skip) && (!hasChoices || hasIconVideos);
  const showCountdown = hasChoices && choiceCountdownSeconds !== null;
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
  const shouldShowAudioGuidance = showAudioGuidanceHint && isAudioEnabled && Boolean(currentStep?.audio?.src);
  const overlayAutoplay = videoOverlay?.autoplay !== false;
  const overlayShouldMute = videoOverlay?.muted ?? false;
  const overlayControls = videoOverlay?.controls ?? true;
  const overlayEmbedSrc = useMemo(() => {
    if (!videoOverlay) {
      return null;
    }

    if (videoOverlay.type === 'youtube' && videoOverlay.id) {
      const params = new URLSearchParams({
        enablejsapi: '1',
        rel: '0',
        playsinline: '1',
      });

      if (overlayAutoplay) {
        params.set('autoplay', '1');
        if (overlayShouldMute) {
          params.set('mute', '1');
        }
      }

      if (!overlayControls) {
        params.set('controls', '0');
      }

      if (typeof videoOverlay.start === 'number') {
        params.set('start', String(videoOverlay.start));
      }

      if (videoOverlay.params && typeof videoOverlay.params === 'object') {
        Object.entries(videoOverlay.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.set(key, String(value));
          }
        });
      }

      return `https://www.youtube.com/embed/${videoOverlay.id}?${params.toString()}`;
    }

    if (videoOverlay.src) {
      return videoOverlay.src;
    }

    return null;
  }, [overlayAutoplay, overlayControls, overlayShouldMute, videoOverlay]);

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

      <div className="relative z-20 flex h-full w-full flex-col px-4 py-8 sm:px-6 sm:py-6 md:px-12 md:py-8">
        <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
          <div className="space-y-1 text-left">
            <p className="text-[9px] uppercase tracking-[0.35em] text-white/60 sm:text-[10px]">{chapterTitle}</p>
            {currentStep?.sequence && (
              <p
                className="text-[9px] uppercase tracking-[0.35em] text-white/40 sm:text-[10px] select-none"
                onDoubleClick={handleSecretSequenceDoubleClick}
              >
                Secuencia {currentStep.sequence}
              </p>
            )}
            <motion.button
              type="button"
              className="pointer-events-auto mt-3 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[9px] uppercase tracking-[0.3em] text-white/80 transition hover:border-white/55 hover:bg-white/15 hover:text-white"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSequenceMenuOpen(true)}
              disabled={Boolean(videoOverlay)}
              style={{ borderColor: accentColor, opacity: videoOverlay ? 0.5 : 1 }}
            >
              <span>Mapa de secuencias</span>
            </motion.button>
          </div>
          <div className="flex flex-col gap-2 self-end text-right md:flex-row md:items-start md:gap-4 md:self-auto">
            <div className="flex flex-col items-end gap-2 md:items-end mr-2">
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
              <div className="text-right text-[9px] uppercase tracking-[0.3em] text-white/50 sm:text-[10px]">
                {currentIndex + 1} / {totalSteps}
              </div>
            )}
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center gap-6">
          <motion.div variants={textVariants} initial="initial" animate="animate" exit="exit">
            {currentStep?.speaker && (
              <span className="mb-3 inline-block text-[11px] uppercase tracking-[0.35em] text-white/55 sm:text-xs">
                {currentStep.speaker}
              </span>
            )}
            {shouldShowAudioGuidance ? (
              <div className="flex h-16 items-center justify-start">
                <motion.div
                  className="flex items-center gap-1 text-4xl font-semibold tracking-widest text-white md:text-5xl"
                  role="status"
                  aria-live="polite"
                >
                  {[0, 1, 2].map((dotIndex) => (
                    <motion.span
                      key={dotIndex}
                      initial={{ opacity: 0.2 }}
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: dotIndex * 0.25,
                      }}
                    >
                      ·
                    </motion.span>
                  ))}
                </motion.div>
              </div>
            ) : (
              <p className="text-left text-base leading-relaxed text-white sm:text-lg md:text-2xl">
                {typedText}
                {!textComplete && <span className="ml-1 animate-pulse">▮</span>}
              </p>
            )}
          </motion.div>
        </main>

        <footer className="mt-2 mb-8 flex w-full flex-col items-center gap-4 footer-safe pointer-events-auto z-20 px-2">
          <AnimatePresence>
            {canInteractWithIcons && (
              <motion.div
                key={`icon-message-${currentStep.id}`}
                className="w-full max-w-full rounded-3xl border border-white/15 bg-black/55 px-3 py-3 text-center text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:max-w-2xl sm:px-4 sm:py-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={{ boxShadow: `0 0 24px ${accentColor}22`, borderColor: `${accentColor}55` }}
              >
                <p className="text-[10px] uppercase tracking-[0.32em] text-white/60 sm:text-[11px]">Elección única</p>
                <p className="mt-2 text-[13px] leading-relaxed text-white/85 sm:text-sm">
                  Toca el ícono que quieras despertar. Cuando lo elijas, el pasillo se cierra: no habrá vuelta atrás.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {canInteractWithIcons && (
              <motion.div
                key={`icon-grid-${currentStep.id}`}
                className="w-full max-w-full overflow-x-auto rounded-3xl border border-white/10 bg-black/40 p-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] sm:max-w-3xl sm:overflow-visible sm:p-4"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
              >
                <div className="flex w-max gap-2 pb-1 pr-2 sm:grid sm:w-full sm:max-w-full sm:grid-cols-4 sm:gap-3 sm:pb-0 sm:pr-0">
                  {iconVideoOptions.map((icon, idx) => (
                    <motion.button
                      key={icon.id ?? idx}
                      type="button"
                      className="group flex min-w-[136px] flex-col items-center gap-1.5 rounded-2xl border border-white/15 bg-white/8 px-3 py-3 text-center text-white/80 shadow-[0_0_18px_rgba(0,0,0,0.28)] backdrop-blur-sm transition hover:border-white/40 hover:bg-white/12 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:min-w-0 sm:gap-3 sm:px-3.5 sm:py-4"
                      style={{ boxShadow: `0 0 28px ${accentColor}22` }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleIconVideo(icon)}
                    >
                      <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-black/50 shadow-inner sm:h-16 sm:w-16 md:h-20 md:w-20">
                        {icon.asset ? (
                          <img
                            src={icon.asset}
                            alt={icon.label ?? 'Recurso 360°'}
                            className="relative z-10 h-full w-full object-contain"
                          />
                        ) : (
                          <span className="relative z-10 text-[11px] uppercase tracking-[0.35em] text-white/70 sm:text-xs">
                            360°
                          </span>
                        )}
                        <motion.div
                          className="pointer-events-none absolute inset-0 rounded-full border border-white/25"
                          initial={{ opacity: 0.25, scale: 0.95 }}
                          animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.95, 1.05, 0.95] }}
                          transition={{ repeat: Infinity, duration: 3.6, ease: 'easeInOut', delay: idx * 0.12 }}
                          style={{ boxShadow: `0 0 18px ${accentColor}2f` }}
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] uppercase tracking-[0.22em] text-white sm:text-[10px]">
                          {icon.label}
                        </p>
                        {icon.subtitle && (
                          <p className="text-[8px] text-white/60 sm:text-[9px]">
                            {icon.subtitle}
                          </p>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {showCountdown && (
            <div className="flex w-full max-w-sm flex-col items-center gap-2 rounded-3xl bg-white/6 px-4 py-3 text-center backdrop-blur-sm">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                <motion.div
                  className="h-full"
                  style={{ backgroundColor: accentColor, transformOrigin: 'left' }}
                  animate={{ scaleX: choiceProgress ?? 1 }}
                  initial={{ scaleX: 1 }}
                  transition={{ duration: 0.2, ease: 'linear' }}
                />
              </div>
              <span className="text-[9px] uppercase tracking-[0.35em] text-white/70">
                Selección automática en {choiceCountdownSeconds}s
              </span>
            </div>
          )}

          <AnimatePresence>
            {canRevealChoices && (
              <motion.div
                key={`choices-${currentStep.id}`}
                className="flex w-full flex-col items-center justify-center gap-3 sm:gap-4 md:flex-row"
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
                    className="w-full max-w-sm rounded-full border-2 border-white/25 bg-white/5 px-6 py-3 sm:py-4 text-sm uppercase tracking-[0.3em] text-white/90 transition hover:border-white/60 hover:bg-white/15 touch-manipulation"
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

          {isSkipVisible && (
            <motion.button
              type="button"
              className="w-full max-w-[220px] rounded-full border border-white/25 bg-transparent px-4 py-2.5 text-[10px] uppercase tracking-[0.3em] text-white/65 transition hover:border-white/50 hover:text-white"
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
        {isSequenceMenuOpen && (
          <motion.div
            key="sequence-menu"
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 px-4 py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="flex w-full max-w-5xl flex-col gap-6 overflow-hidden rounded-3xl border border-white/15 bg-black/65 p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-white/40">Navegación</p>
                  <h2 className="text-lg font-semibold uppercase tracking-[0.3em] text-white">Mapa de Secuencias</h2>
                </div>
                <motion.button
                  type="button"
                  className="self-start rounded-full border border-white/25 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-white/80 transition hover:border-white/60 hover:text-white"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsSequenceMenuOpen(false)}
                >
                  Cerrar
                </motion.button>
              </div>

              <div className="max-h-[65vh] overflow-y-auto pr-1">
                <div className="grid gap-4 sm:grid-cols-2">
                  {sequenceMenuChapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur"
                      style={{ boxShadow: `0 0 25px ${chapter.accent}20` }}
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p
                          className="text-[10px] uppercase tracking-[0.35em] text-white/60"
                          style={{ color: chapter.accent }}
                        >
                          {chapter.title}
                        </p>
                        <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">
                          {chapter.steps.length} pasos
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        {chapter.steps.map((step) => {
                          const isActiveStep = step.id === currentStepId;
                          return (
                            <motion.button
                              key={step.id}
                              type="button"
                              className="group rounded-2xl border px-4 py-3 text-left transition"
                              style={{
                                borderColor: isActiveStep ? chapter.accent : `${chapter.accent}55`,
                                backgroundColor: isActiveStep ? `${chapter.accent}22` : 'rgba(255,255,255,0.04)',
                              }}
                              whileHover={{ scale: isActiveStep ? 1 : 1.02 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleSelectStep(step.id)}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] uppercase tracking-[0.35em] text-white/70">
                                  Secuencia {step.sequence}
                                </span>
                                {isActiveStep && (
                                  <span className="text-[9px] uppercase tracking-[0.3em] text-white/60">
                                    Actual
                                  </span>
                                )}
                              </div>
                              {step.speaker && (
                                <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-white/50">
                                  {step.speaker}
                                </p>
                              )}
                              {step.preview && (
                                <p className="mt-1 text-[11px] leading-relaxed text-white/70">
                                  {step.preview}
                                </p>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {videoOverlay && overlayEmbedSrc && (
          <motion.div
            key="video-overlay"
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 px-3 sm:px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}
          >
            <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-black/80 text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-lg">
              <div
                className="relative w-full"
                style={{ aspectRatio: '16 / 9', minHeight: '240px' }}
              >
                <iframe
                  title={videoOverlay.title ?? 'Video 360°'}
                  src={overlayEmbedSrc}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; magnetometer; picture-in-picture; web-share; vr; xr-spatial-tracking"
                  allowtransparency="true"
                  webkitallowfullscreen="true"
                  mozallowfullscreen="true"
                  frameBorder="0"
                  allowFullScreen
                />
              </div>
              <div className="safe-bottom flex flex-col gap-3 border-t border-white/10 bg-black/60 px-4 py-4 text-[11px] tracking-[0.25em] text-white/70 sm:flex-row sm:items-center sm:justify-between sm:text-xs">
                <div className="flex w-full flex-col gap-1 text-left sm:items-end sm:text-right">
                  <span className="truncate pr-2 uppercase">
                    {videoOverlay.label ?? activeChoice?.label ?? videoOverlay.title ?? ''}
                  </span>
                  {activeChoice?.subtitle && (
                    <span className="text-[10px] font-normal tracking-[0.18em] text-white/55 sm:text-[11px]">
                      {activeChoice.subtitle}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <button
                    type="button"
                    className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-white transition hover:border-white/60 hover:bg-white/20"
                    onClick={() => {
                      const next = videoOverlay.nextStepId;
                      setVideoOverlay(null);
                      setActiveChoice(null);
                      setAudioComplete(true);
                      clearAutoLaunchTimer();
                      if (next) {
                        goToStep(next);
                      }
                    }}
                  >
                    {videoOverlay.continueLabel ?? 'Continuar'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Countdown moved inside footer to avoid overlap */}
    </div>
  );
};

export default ButterflyFlow;
