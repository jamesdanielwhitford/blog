import { firestore } from '../firebase';
import { useState, useEffect, useCallback } from 'react';
import LazyLoad from 'react-lazyload';
import '../Timeline.css';

const LoadingIndicator = () => {
  return <div className="loading-indicator">Loading...</div>;
};

const Timeline = ({ selectedTags }) => {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  useEffect(() => {
    const fetchInitialPost = async () => {
      setLoading(true);
      const initialPost = await firestore
        .collection('posts')
        .where('isArchived', '==', false)
        .orderBy('date', 'desc')
        .limit(1)
        .get();

      const initialPostData = await Promise.all(
        initialPost.docs.map(async (doc) => {
          const post = { id: doc.id, ...doc.data() };
          const uploadsSnapshot = await doc.ref.collection('uploads').get();
          post.uploads = uploadsSnapshot.docs.map((doc) => doc.data());
          return post;
        })
      );

      setPosts(initialPostData);
      setLoading(false);
    };

    fetchInitialPost();
  }, []);

  useEffect(() => {
    const fetchSecondPost = async () => {
      if (posts.length === 1) {
        setLoading(true);
        const lastPostDate = posts[0].date;
        const secondPost = await firestore
          .collection('posts')
          .where('isArchived', '==', false)
          .orderBy('date', 'desc')
          .startAfter(lastPostDate)
          .limit(1)
          .get();

        if (!secondPost.empty) {
          const secondPostData = await Promise.all(
            secondPost.docs.map(async (doc) => {
              const post = { id: doc.id, ...doc.data() };
              const uploadsSnapshot = await doc.ref.collection('uploads').get();
              post.uploads = uploadsSnapshot.docs.map((doc) => doc.data());
              return post;
            })
          );

          setPosts([...posts, ...secondPostData]);
        }
        setLoading(false);
      }
    };

    fetchSecondPost();
  }, [posts]);

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
        const nextPostData = await Promise.all(
          nextPost.docs.map(async (doc) => {
            const post = { id: doc.id, ...doc.data() };
            const uploadsSnapshot = await doc.ref.collection('uploads').get();
            post.uploads = uploadsSnapshot.docs.map((doc) => doc.data());
            return post;
          })
        );

        setPosts([...posts, ...nextPostData]);
      } else {
        setHasMorePosts(false);
      }
      setLoading(false);
    }
  }, [loading, posts, hasMorePosts]);

  useEffect(() => {
    const handleScroll = async () => {
      const scrollTop = document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.offsetHeight;

      if (scrollTop + windowHeight >= documentHeight - windowHeight * 0.6) {
        await fetchNextPost();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [fetchNextPost]);

  const filteredPosts = selectedTags.length === 4 || selectedTags.length === 0
    ? posts
    : posts.filter((post) =>
        post.uploads.some((upload) =>
          upload.tags && upload.tags.some((tag) => selectedTags.includes(tag))
        )
      );

  const handlePostClick = async (post, index) => {
    if (!post.uploads) {
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

  const openFullScreenImage = (imageUrl) => {
    setFullScreenImage(imageUrl);
  };

  const closeFullScreenImage = () => {
    setFullScreenImage(null);
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

  return (
    <div>
      {filteredPosts.map((post, index) => (
        <div key={post.id} className="post-container">
          <div className="post">
            {post.coverImage && (
              post.coverImage.toLowerCase().includes('.mp4') || post.coverImage.toLowerCase().includes('.mov') ? (
                <div onClick={() => handlePostClick(post, index)}>
                  {index <= currentPostIndex + 1 ? (
                    <video src={post.coverImage} muted />
                  ) : (
                    <LazyLoad offset={500}>
                      <video src={post.coverImage} muted />
                    </LazyLoad>
                  )}
                  <div className="play-button"></div>
                </div>
              ) : (
                index <= currentPostIndex + 1 ? (
                  <img
                    src={post.coverImage}
                    alt="Cover"
                    onClick={() => handlePostClick(post, index)}
                  />
                ) : (
                  <LazyLoad offset={500}>
                    <img
                      src={post.coverImage}
                      alt="Cover"
                      onClick={() => handlePostClick(post, index)}
                    />
                  </LazyLoad>
                )
              )
            )}
            <div className="post-info">
              <p className="post-date">{post.date.toDate().toLocaleString()}</p>
              <p className="post-description">{post.description}</p>
              <p className="post-project">{post.project}</p>
            </div>
            <div className="post-actions">
              <button onClick={() => handleShare(post)}>Share</button>
              <button onClick={() => handlePostClick(post, index)}>View More</button>
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
              <p className="modal-project">{selectedPost.project}</p>
            </div>
            <div className="modal-body">
              {selectedPost.coverImage && (
                <div className="modal-cover-image" onClick={() => openFullScreenImage(selectedPost.coverImage)}>
                  {selectedPost.coverImage.toLowerCase().includes('.mp4') || selectedPost.coverImage.toLowerCase().includes('.mov') ? (
                    <video src={selectedPost.coverImage} controls />
                  ) : (
                    <img src={selectedPost.coverImage} alt="Cover" />
                  )}
                </div>
              )}
              {selectedPost.uploads && selectedPost.uploads.map((upload, index) => (
                <div key={index} className="modal-media-item">
                  {upload.url.includes('.jpg') || upload.url.includes('.png') || upload.url.includes('.gif') ? (
                    <div onClick={() => openFullScreenImage(upload.url)}>
                      <LazyLoad>
                        <img src={upload.url} alt={`Upload ${index + 1}`} />
                      </LazyLoad>
                    </div>
                  ) : (
                    <LazyLoad>
                      <video controls>
                        <source src={upload.url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </LazyLoad>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {fullScreenImage && (
        <div className="full-screen-modal" onClick={closeFullScreenImage}>
          <div className="full-screen-image-container">
            <img src={fullScreenImage} alt="Full Screen" />
          </div>
        </div>
      )}

      {loading && <LoadingIndicator />}
      {!loading && !hasMorePosts && <div className="no-more-posts">No more posts to load.</div>}
    </div>
  );
};

export default Timeline;