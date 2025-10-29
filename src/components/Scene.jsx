import React, { forwardRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import MediaPlayer from './MediaPlayer';
import AudioLayer from './AudioLayer';
import InteractiveIcons from './InteractiveIcons';
import Choice from './Choice';
import { getImageAsset } from '../utils/assets';
import { getIconByName } from '../utils/iconMap';

const Scene = forwardRef(({
  chapter,
  index,
  onDecision,
  isActive,
  totalChapters,
  selectedDecision,
  stepKey,
  onRegisterDecisionAnchor,
}, ref) => {
  const backgroundImage = useMemo(() => getImageAsset(chapter.backgroundImage), [chapter.backgroundImage]);
  const textureImage = useMemo(() => getImageAsset(chapter.textureOverlay), [chapter.textureOverlay]);

  const accentColor = chapter.ambient?.color ?? '#ffffff';
  const selectedNextChapterId = selectedDecision ?? null;
  const chosenDecision = useMemo(() => {
    if (!selectedNextChapterId || !chapter.decisions?.length) {
      return null;
    }
    return chapter.decisions.find((decision) => decision.nextChapterId === selectedNextChapterId) ?? null;
  }, [chapter.decisions, selectedNextChapterId]);

  const renderBlock = (block) => {
    switch (block.type) {
      case 'narration':
        return (
          <motion.div
            key={block.id}
            className="space-y-4 rounded-3xl border border-white/10 bg-black/30 p-6 backdrop-blur-md"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true, margin: '-20%' }}
          >
            {block.title && (
              <h3 className="text-left text-lg font-semibold uppercase tracking-[0.3em] text-white/80">
                {block.title}
              </h3>
            )}
            <p className="text-left text-base leading-relaxed text-white/80 md:text-lg">
              {block.body}
            </p>
          </motion.div>
        );

      case 'visual-transition': {
        const Icon = getIconByName(block.icon ?? 'Sparkles');
        return (
          <motion.div
            key={block.id}
            className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true, margin: '-20%' }}
          >
            <div className="rounded-full bg-white/10 p-3">
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white md:text-lg">{block.headline}</h3>
              <p className="text-sm text-white/70 md:text-base">{block.body}</p>
            </div>
          </motion.div>
        );
      }

      case 'audio-sequence':
        return (
          <AudioLayer
            key={block.id}
            title={block.label}
            description={block.description}
            clips={block.clips}
            accentColor={accentColor}
            isActive={isActive}
          />
        );

      case 'media':
        return (
          <motion.div
            key={block.id}
            className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true, margin: '-20%' }}
          >
            <MediaPlayer media={block.media} />
            {block.media?.caption && (
              <div className="border-t border-white/5 p-4 text-center text-sm text-white/60">
                {block.media.caption}
              </div>
            )}
          </motion.div>
        );

      case 'icon-focus': {
        const Icon = getIconByName(block.icon ?? 'Sparkles');
        return (
          <motion.div
            key={block.id}
            className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-black/30 p-6 text-center backdrop-blur"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            viewport={{ once: true, margin: '-20%' }}
          >
            <div className="rounded-full bg-white/10 p-4">
              <Icon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{block.label}</h3>
              <p className="text-sm text-white/70 md:text-base">{block.body}</p>
            </div>
          </motion.div>
        );
      }

      case 'gallery':
        return (
          <motion.div
            key={block.id}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true, margin: '-20%' }}
          >
            <h3 className="mb-5 text-left text-base font-semibold text-white/80 uppercase tracking-[0.3em]">
              {block.label}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {block.items?.map((item) => {
                const Icon = getIconByName(item.icon ?? 'Sparkles');
                return (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div className="mb-3 flex items-center gap-3 text-white">
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium uppercase tracking-[0.2em]">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-sm text-white/70">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        );

      case 'interactive-doors':
        return (
          <motion.div
            key={block.id}
            className="rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true, margin: '-20%' }}
          >
            <p className="mb-6 text-sm text-white/70 md:text-base">{block.description}</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {block.doors?.map((door, idx) => (
                <Choice
                  key={door.id}
                  decision={{
                    id: door.id,
                    text: door.label,
                    nextChapterId: door.nextChapterId,
                    icon: door.icon,
                  }}
                  index={idx}
                  accentColor={accentColor}
                  onSelect={() => onDecision(chapter.id, door.nextChapterId)}
                  disabled={!isActive}
                  isSelected={selectedNextChapterId === door.nextChapterId}
                />
              ))}
            </div>
          </motion.div>
        );

      case 'credits':
        return (
          <motion.div
            key={block.id}
            className="rounded-3xl border border-white/10 bg-black/30 p-6 text-left backdrop-blur"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            viewport={{ once: true, margin: '-10%' }}
          >
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
              {block.label}
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              {block.items?.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const decisionSectionRef = useCallback(
    (node) => {
      if (!stepKey || !onRegisterDecisionAnchor) {
        return;
      }
      onRegisterDecisionAnchor(stepKey, node);
    },
    [stepKey, onRegisterDecisionAnchor]
  );

  return (
    <section ref={ref} className="relative min-h-screen w-full">
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        initial={{ scale: 1.1, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      {textureImage && (
        <motion.div
          className="absolute inset-0 mix-blend-screen opacity-40"
          style={{
            backgroundImage: `url(${textureImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
        />
      )}

      <div className="gradient-overlay" />

      <InteractiveIcons icons={chapter.icons} accentColor={accentColor} />

      <motion.div
        className="relative z-20 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-24 sm:px-6 lg:px-10"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        viewport={{ once: true, margin: '-30%' }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-left">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70">
            {isActive ? 'Capítulo activo' : 'Capítulo visitado'}
          </span>
          {!isActive && chosenDecision && (
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/50">
              Elegiste: {chosenDecision.text ?? chosenDecision.label}
            </span>
          )}
        </div>
        <div className="mb-10 flex flex-col gap-4 text-left">
          <span className="text-xs uppercase tracking-[0.4em] text-white/60">
            Capítulo {chapter.order} de {totalChapters}
          </span>
          <h2 className="text-3xl font-display uppercase tracking-[0.2em] text-white md:text-5xl">
            {chapter.title}
          </h2>
          {chapter.tagline && (
            <p className="max-w-2xl text-sm text-white/70 md:text-lg">
              {chapter.tagline}
            </p>
          )}
        </div>

        {isActive && (
          <motion.div
            className="mb-8 rounded-3xl border border-white/10 bg-black/40 p-5 text-sm text-white/70 backdrop-blur"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            Explorá los elementos interactivos de este capítulo y elegí una opción para continuar el recorrido.
          </motion.div>
        )}

        <div className="mt-8 space-y-10 sm:space-y-12">
          {chapter.contentBlocks?.map((block) => renderBlock(block))}
        </div>

        {chapter.decisions?.length > 0 && (
          <motion.div
            ref={decisionSectionRef}
            className="mt-16 flex flex-wrap items-center justify-center gap-5 sm:mt-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {chapter.decisions.map((decision, idx) => (
              <Choice
                key={decision.id}
                decision={decision}
                index={idx}
                accentColor={accentColor}
                onSelect={() => onDecision(chapter.id, decision.nextChapterId)}
                disabled={!isActive}
                isSelected={selectedNextChapterId === decision.nextChapterId}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
});

Scene.displayName = 'Scene';

export default Scene;