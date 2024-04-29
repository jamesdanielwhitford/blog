import { firestore } from '../firebase';
import { useState, useEffect } from 'react';
import '../Timeline.css';

const Timeline = ({ selectedTags }) => {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    const unsubscribe = firestore
      .collection('posts')
      .where('isArchived', '==', false)
      .onSnapshot(async (snapshot) => {
        const postsData = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const post = { id: doc.id, ...doc.data() };
            const uploadsSnapshot = await doc.ref.collection('uploads').get();
            post.uploads = uploadsSnapshot.docs.map((doc) => doc.data());
            return post;
          })
        );
        setPosts(postsData);
      });

    return unsubscribe;
  }, []);

  const filteredPosts = selectedTags.length === 0
    ? posts
    : posts.filter((post) =>
        post.uploads.some((upload) => upload.tags.some((tag) => selectedTags.includes(tag)))
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
      // Fallback for browsers that don't support the Web Share API
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

  return (
    <div>
      {filteredPosts.map((post) => (
        <div key={post.id} className="post-container">
          <div className="post">
            {post.coverImage && (
              post.coverImage.toLowerCase().includes('.mp4') || post.coverImage.toLowerCase().includes('.mov') ? (
                <div
                  onClick={() => handlePostClick(post)}
                  onMouseOver={(e) => e.currentTarget.children[0].play()}
                  onMouseOut={(e) => e.currentTarget.children[0].pause()}
                >
                  <video src={post.coverImage} muted />
                </div>
              ) : (
                <img
                  src={post.coverImage}
                  alt="Cover"
                  onClick={() => handlePostClick(post)}
                />
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
            <h2 className="modal-description">{selectedPost.description}</h2>
            <p className="modal-date">{selectedPost.date.toDate().toLocaleString()}</p>
            <div className="modal-media">
              {selectedPost.uploads.map((upload, index) => (
                <div key={index}>
                  {upload.url.includes('.jpg') || upload.url.includes('.png') || upload.url.includes('.gif') ? (
                    <img src={upload.url} alt={`Upload ${index + 1}`} loading="lazy" />
                  ) : (
                    <video controls>
                      <source src={upload.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timeline;