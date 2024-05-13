import { firestore } from '../firebase';
import { useState, useEffect, useCallback } from 'react';
import LazyLoad from 'react-lazyload';
import YouTubePlayer from './YouTubePlayer';
import ProjectModal from './ProjectModal';
import '../Timeline.css';

const LoadingIndicator = () => {
  return <div className="loading-indicator">Loading...</div>;
};

const Timeline = ({ selectedTags }) => {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [fullScreenLink, setFullScreenLink] = useState(null);
  const [fullScreenVideo, setFullScreenVideo] = useState(null);

  const openProjectModal = (project) => {
    setSelectedProject(project);
    document.body.classList.add('modal-open');
  };

  const closeProjectModal = () => {
    setSelectedProject(null);
    document.body.classList.remove('modal-open');
  };

  useEffect(() => {
    const fetchInitialPosts = async () => {
      setLoading(true);
      const initialPosts = await firestore
        .collection('posts')
        .where('isArchived', '==', false)
        .orderBy('date', 'desc')
        .limit(5)
        .get();

      const initialPostsData = await Promise.all(
        initialPosts.docs.map(async (doc) => {
          const post = {
            id: doc.id,
            ...doc.data(),
            uploads: [],
          };
          return post;
        })
      );

      setPosts(initialPostsData);
      setLoading(false);
    };

    fetchInitialPosts();
  }, []);

  const fetchNextPost = useCallback(async () => {
    if (!loading && posts.length > 0 && hasMorePosts) {
      setLoading(true);
      const lastPostDate = posts[posts.length - 1].date;
      const nextPost = await firestore
        .collection('posts')
        .where('isArchived', '==', false)
        .orderBy('date', 'desc')
        .startAfter(lastPostDate)
        .limit(1)
        .get();

      if (!nextPost.empty) {
        const nextPostData = nextPost.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          uploads: [],
        }));

        setPosts([...posts, ...nextPostData]);
      } else {
        setHasMorePosts(false);
      }
      setLoading(false);
    }
  }, [loading, posts, hasMorePosts]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.offsetHeight;

      if (scrollTop + windowHeight >= documentHeight - windowHeight * 0.5 && !loading) {
        fetchNextPost();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchNextPost, loading]);

  const filteredPosts = selectedTags.length === 4 || selectedTags.length === 0
    ? posts
    : posts.filter((post) =>
        post.tags && post.tags.some((tag) => selectedTags.includes(tag))
      );

  const handlePostClick = async (post, index) => {
    if (!post.uploads || post.uploads.length === 0) {
      const uploadsSnapshot = await firestore.collection('posts').doc(post.id).collection('uploads').get();
      post.uploads = uploadsSnapshot.docs.map((doc) => doc.data());
    }
    setSelectedPost(post);
    setCurrentPostIndex(index);
    document.body.classList.add('modal-open');
  };

  const closeModal = () => {
    setSelectedPost(null);
    document.body.classList.remove('modal-open');
  };

  const handleShare = async (post) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.description,
          text: post.description,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      const url = window.location.href;
      navigator.clipboard.writeText(url).then(
        function () {
          alert('Link copied to clipboard!');
        },
        function (err) {
          console.error('Could not copy link: ', err);
        }
      );
    }
  };
  const openFullScreenImage = (url, link, mimeType, pdfUrl) => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else if (link) {
      const youtubeRegex = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
      const match = link.match(youtubeRegex);
  
      if (match) {
        const videoId = match[1];
        console.log('YouTube Video ID:', videoId);
        setFullScreenVideo(videoId);
      } else {
        console.log('Not a YouTube video link');
        setFullScreenLink(link);
      }
    } else {
      console.log('Opening image:', url);
      setFullScreenImage(url);
    }
  };
  const closeFullScreenImage = () => {
    setFullScreenImage(null);
  };

  const closeFullScreenContent = () => {
    setFullScreenImage(null);
    setFullScreenVideo(null);
  };

  const preloadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve();
      img.onerror = () => reject();
    });
  };


  useEffect(() => {
    if (selectedPost) {
      const imagesToPreload = [
        selectedPost.coverImage,
        ...selectedPost.uploads.map((upload) => upload.url),
      ];

      Promise.all(imagesToPreload.map((url) => preloadImage(url)))
        .then(() => console.log('Images preloaded'))
        .catch(() => console.log('Error preloading images'));
    }
  }, [selectedPost]);

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
                  {upload.location}
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
  <div>
    {filteredPosts.map((post, index) => (
      <div key={post.id} className="post-container">
        <div className="post">
          {post.coverImage && (
            post.coverMimeType && post.coverMimeType.startsWith('video/') ? (
              <div onClick={() => handlePostClick(post, index)}>
                <LazyLoad offset={500}>
                  <video
                    src={window.innerWidth <= 640 ? post.mobileCoverImage : post.laptopCoverImage}
                    poster={post.coverImageThumbnail}
                    preload="none"
                    width="640"
                    height="360"
                  />
                  <div className="play-button"></div>
                </LazyLoad>
              </div>
            ) : (
              <LazyLoad offset={500}>
                <img
                  src={window.innerWidth <= 640 ? post.mobileCoverImage : post.laptopCoverImage}
                  alt="Cover"
                  onClick={() => handlePostClick(post, index)}
                  width="640"
                  height="360"
                />
              </LazyLoad>
            )
          )}
          <div className="post-info">
            <p className="post-date">{post.date.toDate().toLocaleString()}</p>
            <p className="post-description">{post.description}</p>
            <p className="post-project">
              <a href="#" onClick={() => openProjectModal(post.project)}>
                {post.project}
              </a>
            </p>
          </div>
          <div className="post-actions">
            {/* <button onClick={() => handleShare(post)}>Share</button>
            <button onClick={() => handlePostClick(post, index)}>View More</button> */}
          </div>
        </div>
      </div>
    ))}

    {selectedPost && (
      <div className="modal">
        <div className="modal-content">
          <span className="close" onClick={closeModal}>&times;</span>
          <div className="modal-header">
            <h2 className="modal-description">{selectedPost.description}</h2>
            <p className="modal-date">{selectedPost.date.toDate().toLocaleString()}</p>
            <p className="modal-project">
              <a href="#" onClick={() => openProjectModal(selectedPost.project)}>
                {selectedPost.project}
              </a>
            </p>
          </div>
          <div className="modal-body">
            {selectedPost.uploads && selectedPost.uploads.map((upload, index) => (
              <div key={index} className="modal-media-item">
                {renderMedia(upload, index)}
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    {(fullScreenImage || fullScreenVideo || fullScreenLink) && (
      <div className="full-screen-modal" onClick={closeFullScreenContent}>
        <div className="full-screen-content-container">
          {fullScreenImage && <img src={fullScreenImage} alt="Full Screen" />}
          {fullScreenVideo && (
            <>
              <YouTubePlayer videoId={fullScreenVideo} />
              <span className="full-screen-modal-close" onClick={closeFullScreenContent}>
                &times;
              </span>
            </>
          )}
          {fullScreenLink && (
            <div className="full-screen-link-container">
              <iframe src={fullScreenLink} width="100%" height="100%" />
              <span className="full-screen-modal-close" onClick={closeFullScreenContent}>
                &times;
              </span>
            </div>
          )}
        </div>
      </div>
    )}

    {selectedProject && (
      <ProjectModal
        project={selectedProject}
        closeModal={closeProjectModal}
        openFullScreenImage={openFullScreenImage}
      />
    )}

    {loading && <LoadingIndicator />}
    {!loading && !hasMorePosts && <div className="no-more-posts">No more posts to load.</div>}
  </div>
);
};

export default Timeline;