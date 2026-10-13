'use client';

import {useState} from 'react';

const VIDEO_ID = 'qhrWJ07YRuk';

// Facade: no carga el iframe de YouTube (ni sus cookies) hasta que el usuario pulsa reproducir.
export default function VideoPromo() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="video-promo" aria-label="Video promocional de Neuro Convergencia">
      {playing ? (
        <iframe
          className="video-promo-frame"
          src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&rel=0`}
          title="Video promocional de Neuro Convergencia"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button type="button" className="video-promo-facade" onClick={() => setPlaying(true)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`}
            alt=""
            className="video-promo-thumb"
            loading="lazy"
          />
          <span className="video-promo-play" aria-hidden="true">▶</span>
          <span className="video-promo-label">Ver video de presentación</span>
        </button>
      )}
      <p className="video-promo-note">Al reproducir se carga contenido de YouTube (Google).</p>
    </div>
  );
}
