import { firestore } from '../firebase';
import { useState, useEffect, useRef } from 'react';
import LazyLoad from 'react-lazyload';
import '../Timeline.css';

const Timeline = ({ selectedTags }) => {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [lastPost, setLastPost] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInitialPosts = async () => {
      setLoading(true);
      const initialPosts = await firestore
        .collection('posts')
        .where('isArchived', '==', false)
        .orderBy('date', 'desc')
        .limit(3)
        .get();

      const initialPostsData = await Promise.all(
        initialPosts.docs.map(async (doc) => {
          const post = { id: doc.id, ...doc.data() };
          const uploadsSnapshot = await doc.ref.collection('uploads').get();
          post.uploads = uploadsSnapshot.docs.map((doc) => doc.data());
          return post;
        })
      );

      setPosts(initialPostsData);
      setLastPost(initialPosts.docs[initialPosts.docs.length - 1]);
      setLoading(false);
    };

    fetchInitialPosts();
  }, []);

  useEffect(() => {
    const handleScroll = async () => {
      const scrollTop = document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.offsetHeight;

      if (scrollTop + windowHeight >= documentHeight - windowHeight * 0.6) {
        if (!loading && lastPost) {
          setLoading(true);
          const nextPosts = await firestore
            .collection('posts')
            .where('isArchived', '==', false)
            .orderBy('date', 'desc')
            .startAfter(lastPost)
            .limit(3)
            .get();

          const nextPostsData = await Promise.all(
            nextPosts.docs.map(async (doc) => {
              const post = { id: doc.id, ...doc.data() };
              const uploadsSnapshot = await doc.ref.collection('uploads').get();
              post.uploads = uploadsSnapshot.docs.map((doc) => doc.data());
              return post;
            })
          );

          setPosts([...posts, ...nextPostsData]);
          setLastPost(nextPosts.docs[nextPosts.docs.length - 1]);
          setLoading(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [posts, loading, lastPost]);

  const filteredPosts = selectedTags.length === 4 || selectedTags.length === 0
  ? posts
  : posts.filter((post) =>
      post.uploads.some((upload) =>
        upload.tags && upload.tags.some((tag) => selectedTags.includes(tag))
      )
    );

  const handlePostClick = (post) => {
    setSelectedPost(post);
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

  const videoRef = useRef(null);

  const handleMouseOver = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleMouseOut = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <div>
      {filteredPosts.map((post, index) => (
        <div key={post.id} className="post-container">
          <div className="post">
            {post.coverImage && (
              post.coverImage.toLowerCase().includes('.mp4') || post.coverImage.toLowerCase().includes('.mov') ? (
                <div
                  onClick={() => handlePostClick(post)}
                  onMouseOver={handleMouseOver}
                  onMouseOut={handleMouseOut}
                >
                  {index === 0 ? (
                    <video ref={videoRef} src={post.coverImage} muted />
                  ) : (
                    <LazyLoad offset={500}>
                      <video ref={videoRef} src={post.coverImage} muted />
                    </LazyLoad>
                  )}
                </div>
              ) : (
                index === 0 ? (
                  <img
                    src={post.coverImage}
                    alt="Cover"
                    onClick={() => handlePostClick(post)}
                  />
                ) : (
                  <LazyLoad offset={500}>
                    <img
                      src={post.coverImage}
                      alt="Cover"
                      onClick={() => handlePostClick(post)}
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
              <button onClick={() => handlePostClick(post)}>View More</button>
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
          <div className="modal-cover-image">
            {selectedPost.coverImage.toLowerCase().includes('.mp4') || selectedPost.coverImage.toLowerCase().includes('.mov') ? (
              <video src={selectedPost.coverImage} controls />
            ) : (
              <img src={selectedPost.coverImage} alt="Cover" />
            )}
          </div>
        )}
        {selectedPost.uploads.map((upload, index) => (
          <div key={index} className="modal-media-item">
            {upload.url.includes('.jpg') || upload.url.includes('.png') || upload.url.includes('.gif') ? (
              <LazyLoad>
                <img src={upload.url} alt={`Upload ${index + 1}`} />
              </LazyLoad>
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
      {loading && <div>Loading...</div>}
    </div>
  );
};

export default Timeline;