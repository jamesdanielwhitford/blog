// YouTubePlayer.js
import React, { useEffect, useRef } from 'react';

const YouTubePlayer = ({ videoId }) => {
  const playerRef = useRef(null);

  useEffect(() => {
    if (!window.YT) {
      console.error('YouTube Player API script not loaded');
      return;
    }

    const onPlayerReady = (event) => {
      console.log('YouTube player is ready');
      event.target.playVideo();
    };

    const onPlayerError = (event) => {
      console.error('YouTube player error:', event.data);
    };

    playerRef.current = new window.YT.Player('youtube-player', {
      height: '100%',
      width: '100%',
      videoId,
      events: {
        'onReady': onPlayerReady,
        'onError': onPlayerError,
      },
    });
  }, [videoId]);

  return <div id="youtube-player" />;
};

export default YouTubePlayer;