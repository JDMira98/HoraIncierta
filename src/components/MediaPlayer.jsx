import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { getImageAsset } from '../utils/assets';

const fallbackGradients = {
  video: 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900',
  image: 'bg-gradient-to-br from-slate-900 via-gray-900 to-black',
};

const MediaPlayer = ({ media }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!media) {
    return <Fallback type="image" />;
  }

  const mediaType = media.kind ?? media.type ?? 'image';
  const posterImage = media.poster ? getImageAsset(media.poster) : null;
  const resolvedSrc = mediaType === 'image' || mediaType === 'panorama' ? getImageAsset(media.src) : media.src;

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoaded(false);
    setHasError(true);
  };

  if (hasError) {
    return <Fallback type={mediaType} />;
  }

  if (mediaType === 'video') {
    return (
      <div className="relative w-full overflow-hidden">
        {!isLoaded && <Loader type="video" />}
        <motion.video
          ref={videoRef}
          className="h-full w-full object-cover"
          style={{ transform: media.parallax ? `translateY(${scrollY * 0.35}px)` : 'none' }}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 1.05 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          autoPlay={media.autoplay ?? true}
          muted={media.muted ?? true}
          loop={media.loop ?? true}
          playsInline
          poster={posterImage ?? undefined}
          onLoadedData={handleLoad}
          onError={handleError}
        >
          {resolvedSrc && <source src={resolvedSrc} type="video/mp4" />}
        </motion.video>
      </div>
    );
  }

  if (mediaType === 'image' || mediaType === 'panorama') {
    return (
      <div className="relative w-full overflow-hidden">
        {!isLoaded && <Loader type="image" />}
        <motion.img
          className="h-full w-full object-cover"
          style={{ transform: media.parallax ? `translateY(${scrollY * 0.25}px) scale(1.05)` : 'none' }}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? (media.parallax ? 1.05 : 1) : 1.1 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          src={resolvedSrc}
          alt={media.alt ?? 'Visual escena'}
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    );
  }

  return <Fallback type={mediaType} />;
};

const Loader = ({ type }) => (
  <motion.div
    className={`absolute inset-0 ${fallbackGradients[type] || fallbackGradients.image} flex items-center justify-center`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div
      className="h-12 w-12 rounded-full border-4 border-white/20 border-t-white"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, ease: 'linear', duration: 1 }}
    />
  </motion.div>
);

const Fallback = ({ type }) => (
  <div className={`relative w-full overflow-hidden ${fallbackGradients[type] || fallbackGradients.image}`}>
    <motion.div
      className="absolute inset-0 opacity-40"
      animate={{
        background: [
          'radial-gradient(circle at 20% 20%, rgba(120, 119, 198, 0.35) 0%, transparent 55%)',
          'radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.35) 0%, transparent 55%)',
          'radial-gradient(circle at 50% 40%, rgba(119, 255, 198, 0.35) 0%, transparent 55%)',
        ],
      }}
      transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
    />
    <div className="relative z-10 flex h-full min-h-[220px] w-full flex-col items-center justify-center gap-3 p-6 text-center text-white/70">
      <span className="text-xs uppercase tracking-[0.3em]">Recurso pendiente</span>
      <p className="text-sm">El medio se mostrará aquí cuando esté disponible.</p>
    </div>
  </div>
);

export default MediaPlayer;