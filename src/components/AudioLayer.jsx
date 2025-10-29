import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Square } from 'lucide-react';

const synthFrequencies = [220, 261.63, 329.63, 392];

const AudioLayer = ({ title, description, clips = [], accentColor = '#ffffff', isActive = true }) => {
  const [activeClipId, setActiveClipId] = useState(null);
  const audioElementRef = useRef(null);
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);

  const playableClips = useMemo(() => clips.filter(Boolean), [clips]);

  useEffect(() => {
    return () => {
      stopCurrentClip();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isActive && activeClipId) {
      stopCurrentClip();
    }
  }, [isActive, activeClipId]);

  const stopCurrentClip = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = '';
      audioElementRef.current = null;
    }

    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }

    setActiveClipId(null);
  };

  const playMockTone = async (clipId) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    const frequency = synthFrequencies[clipId.length % synthFrequencies.length];
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);

    gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, audioContextRef.current.currentTime + 0.4);
    gainNode.gain.linearRampToValueAtTime(0.0, audioContextRef.current.currentTime + 4);

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.start();
    oscillator.stop(audioContextRef.current.currentTime + 4.2);

    oscillatorRef.current = oscillator;
    gainNodeRef.current = gainNode;
  };

  const playClip = async (clip) => {
    if (!clip) return;

    if (!isActive) {
      return;
    }

    const isCurrentlyActive = activeClipId === clip.id;

    stopCurrentClip();

    if (isCurrentlyActive) {
      return;
    }

    setActiveClipId(clip.id);

    if (clip.src && !clip.mock) {
      const audio = new Audio(clip.src);
      audio.loop = true;
      audio.volume = 0.75;
      audio
        .play()
        .catch(() => {
          console.warn('No se pudo reproducir el audio. Probablemente se requiera interacción del usuario.');
        });
      audioElementRef.current = audio;
    } else {
      await playMockTone(clip.id);
    }
  };

  if (!playableClips.length) {
    return null;
  }

  return (
    <motion.div
      className="space-y-4 rounded-3xl border border-white/10 bg-black/35 p-6 backdrop-blur"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      viewport={{ once: true, margin: '-20%' }}
    >
      <div className="flex flex-col gap-2 text-left">
        <span className="text-xs uppercase tracking-[0.3em] text-white/60">Capa sonora</span>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description && <p className="text-sm text-white/65">{description}</p>}
      </div>

      <div className="flex flex-col gap-3">
        {playableClips.map((clip) => {
          const isClipActive = activeClipId === clip.id;
          return (
            <motion.button
              type="button"
              key={clip.id}
              onClick={() => playClip(clip)}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/80 transition-all hover:border-white/30 hover:bg-white/10"
              style={{
                borderColor: isClipActive ? `${accentColor}60` : 'rgba(255,255,255,0.1)',
                backgroundColor: isClipActive ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div>
                <p className="font-medium uppercase tracking-[0.2em] text-xs md:text-sm">{clip.label}</p>
                {clip.mock && (
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Mock interactivo</p>
                )}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15">
                {isClipActive ? (
                  <Square className="h-4 w-4 text-white" />
                ) : (
                  <Play className="h-4 w-4 text-white" />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {activeClipId && (
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/40">
          Reproduciendo: {activeClipId}
        </p>
      )}
    </motion.div>
  );
};

export default AudioLayer;
