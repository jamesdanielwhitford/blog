import { firestore } from '../firebase';
import { useState, useEffect } from 'react';
import { TwitterShareButton } from 'react-share';
import Modal from 'react-modal';
import '../Timeline.css';

const Timeline = ({ selectedTags }) => {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedPost(null);
    setIsModalOpen(false);
  };

  return (
    <div>
    {filteredPosts.map((post) => (
      <div key={post.id} className="post-container">
        <div className="post">
          {post.coverImage && (
            <img
              src={post.coverImage}
              alt="Cover"
              onClick={() => handlePostClick(post)}
            />
          )}
          <h2>{post.description}</h2>
          <p>{post.date.toDate().toLocaleString()}</p>
          <button onClick={() => handlePostClick(post)}>View More</button>
          <TwitterShareButton
            url={window.location.href}
            title={post.description}
            hashtags={post.uploads.flatMap((upload) => upload.tags)}
          >
            Share on Twitter
          </TwitterShareButton>
        </div>
      </div>
    ))}

      <Modal isOpen={isModalOpen} onRequestClose={closeModal}>
        {selectedPost && (
          <div>
            <h2>{selectedPost.description}</h2>
            <p>{selectedPost.date.toDate().toLocaleString()}</p>
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
                <p>Tags: {upload.tags.join(', ')}</p>
              </div>
            ))}
          </div>
        )}
        <button onClick={closeModal}>Close</button>
      </Modal>
    </div>
  );
};

export default Timeline;