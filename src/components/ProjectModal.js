import { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import LazyLoad from 'react-lazyload';
import FullScreenModal from './FullScreenModal';
import '../Timeline.css';

const ProjectModal = ({ project, closeModal }) => {
  const [posts, setPosts] = useState([]);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [fullScreenVideo, setFullScreenVideo] = useState(null);

  useEffect(() => {
    const fetchProjectPosts = async () => {
      const projectPosts = await firestore
        .collection('posts')
        .where('project', '==', project)
        .orderBy('date', 'desc')
        .get();

      const postsData = await Promise.all(
        projectPosts.docs.map(async (doc) => {
          const post = {
            id: doc.id,
            ...doc.data(),
            uploads: [],
          };
          const uploadsSnapshot = await firestore.collection('posts').doc(post.id).collection('uploads').get();
          post.uploads = uploadsSnapshot.docs.map((doc) => doc.data());
          return post;
        })
      );

      setPosts(postsData);
    };

    fetchProjectPosts();
  }, [project]);

  const openFullScreenImage = (url, link, mimeType, pdfUrl) => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else if (link) {
      const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
      const match = link.match(youtubeRegex);

      if (match) {
        const videoId = match[1];
        setFullScreenVideo(videoId);
      }
    } else {
      setFullScreenImage(url);
    }
  };

  const closeFullScreenContent = () => {
    setFullScreenImage(null);
    setFullScreenVideo(null);
  };

  const renderMedia = (upload, index) => {
    if (upload.mimeType.startsWith('image/')) {
      const imageUrl = window.innerWidth <= 640 ? upload.mobileUrl : window.innerWidth <= 1280 ? upload.laptopUrl : upload.url;
      return (
        <div key={index} className="modal-media-item">
          <img
            src={imageUrl}
            alt={`Upload ${index + 1}`}
            onClick={() => openFullScreenImage(upload.url, upload.link, upload.mimeType, upload.pdfUrl)}
          />
          <div className="modal-media-info">
            {upload.dateTime && <p>{upload.dateTime}</p>}
            {upload.location && (
              <p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(upload.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                Location
                </a>
              </p>
            )}
            {upload.link && <p><a href={upload.link} target="_blank" rel="noopener noreferrer">Video</a></p>}
            {upload.pdfUrl && <p><a href={upload.pdfUrl} target="_blank" rel="noopener noreferrer">PDF</a></p>}
          </div>
        </div>
      );
    } else if (upload.mimeType.startsWith('video/')) {
      return (
        <div key={index} className="modal-media-item">
          <video controls preload="none" onClick={() => openFullScreenImage(null, upload.url, upload.mimeType)}>
            <source src={upload.url} type={upload.mimeType} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={closeModal}>
          &times;
        </span>
        <h2>{project}</h2>
        {posts.map((post) => (
          <div key={post.id} className="project-post">
            <h3>{post.description}</h3>
            <p>{post.date.toDate().toLocaleString()}</p>
            {post.uploads.map((upload, index) => (
              <div key={index} className="project-post-media">
                {renderMedia(upload, index)}
              </div>
            ))}
          </div>
        ))}
      </div>
      {(fullScreenImage || fullScreenVideo) && (
        <FullScreenModal
          fullScreenImage={fullScreenImage}
          fullScreenVideo={fullScreenVideo}
          onClose={closeFullScreenContent}
        />
      )}
    </div>
  );
};

export default ProjectModal;