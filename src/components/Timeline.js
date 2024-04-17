import { firestore } from '../firebase';
import { useState, useEffect } from 'react';
import { TwitterShareButton } from 'react-share';

const Timeline = ({ selectedTag }) => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const unsubscribe = firestore
      .collection('posts')
      .where('isArchived', '==', false)
      .onSnapshot((snapshot) => {
        const postsData = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((post) => !post.isArchived);
        setPosts(postsData);
      });

    return unsubscribe;
  }, []);

  const filteredPosts = selectedTag
    ? posts.filter((post) => post.tags.includes(selectedTag))
    : posts;

  return (
    <div>
      {filteredPosts.map((post) => (
        <div key={post.id}>
          <h2>{post.description}</h2>
          <p>{post.date.toDate().toLocaleString()}</p>
          <p>Tags: {post.tags.join(', ')}</p>
          {Array.isArray(post.imageUrls) &&
            post.imageUrls.map((imageUrl, index) => (
              <img
                key={`${post.id}-${index}`}
                src={imageUrl}
                alt={`${post.description} ${index + 1}`}
                loading="lazy"
              />
            ))}
          {Array.isArray(post.videoUrls) &&
            post.videoUrls.map((videoUrl, index) => (
              <video key={`${post.id}-${index}`} controls>
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ))}
          <TwitterShareButton
            url={window.location.href}
            title={post.description}
            hashtags={post.tags}
          >
            Share on Twitter
          </TwitterShareButton>
        </div>
      ))}
    </div>
  );
};

export default Timeline;