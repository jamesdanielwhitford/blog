import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import YouTubePlayer from './YouTubePlayer';

const FullScreenModal = ({ fullScreenImage, fullScreenVideo, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleImageClick = () => {
    if (fullScreenImage) {
      onClose();
    }
  };

  return createPortal(
    <div className="full-screen-modal" ref={modalRef}>
      <div className="full-screen-content-container">
        {fullScreenImage && (
          <img src={fullScreenImage} alt="Full Screen" onClick={handleImageClick} />
        )}
        {fullScreenVideo && (
          <>
            <YouTubePlayer videoId={fullScreenVideo} />
            <span className="full-screen-modal-close" onClick={onClose}>
              &times;
            </span>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default FullScreenModal;