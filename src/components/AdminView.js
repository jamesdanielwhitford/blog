import { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import { getAuth } from 'firebase/auth';
import { Link } from 'react-router-dom';
import LazyLoad from 'react-lazyload';
import '../AdminView.css';

const AdminView = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    date: new Date(),
    imageUrls: [],
    videoUrls: [],
    tags: [],
    isArchived: false,
    project: '',
    coverImage: null,
  });
  const [editPostId, setEditPostId] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const unsubscribe = firestore.collection('posts').onSnapshot(async (snapshot) => {
      const postsData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const post = { id: doc.id, ...doc.data() };
          const uploadsSnapshot = await doc.ref.collection('uploads').get();
          post.uploads = uploadsSnapshot.docs.map((doc) => doc.data());
          return post;
        })
      );
      setPosts(postsData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];

    setFormData((prevFormData) => ({
      ...prevFormData,
      coverImage: file,
    }));
  };

  const handleTagChange = (tag) => {
    if (formData.tags.includes(tag)) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        tags: prevFormData.tags.filter((t) => t !== tag),
      }));
    } else {
      setFormData((prevFormData) => ({
        ...prevFormData,
        tags: [...prevFormData.tags, tag],
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.description &&
      (formData.imageUrls.length === 0 &&
        formData.videoUrls.length === 0 &&
        e.target.imageUpload.files.length === 0 &&
        e.target.videoUpload.files.length === 0)
    ) {
      setErrorMessage('Please enter a description or upload at least one image or video.');
      return;
    } else {
      setErrorMessage('');
    }

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setErrorMessage('User not authenticated. Please sign in to upload files.');
      return;
    }

    setLoading(true);
    try {
      const postDate = new Date(formData.date);
      const postId = `${postDate.getFullYear()}-${postDate.getMonth() + 1}-${postDate.getDate()}-${postDate.getTime()}`;

      const postRef = firestore.collection('posts').doc(postId);
      const postDoc = await postRef.get();

      let existingPost = {};
      if (postDoc.exists) {
        existingPost = postDoc.data();
      }

      let coverImageUrl = existingPost.coverImage || null;

      if (formData.coverImage) {
        const coverImageRef = firebase.storage().ref(`${postId}/coverImage`);
        await coverImageRef.put(formData.coverImage);
        coverImageUrl = await coverImageRef.getDownloadURL();
      }

      const files = [...e.target.imageUpload.files, ...e.target.videoUpload.files];
      const uploads = files.map(async (file) => {
        const storageRef = firebase.storage().ref(`${postId}/${file.name}`);
        try {
          await storageRef.put(file);
          const downloadUrl = await storageRef.getDownloadURL();
          const uploadData = {
            url: downloadUrl,
            tags: formData.tags,
          };
          const uploadRef = await postRef.collection('uploads').add(uploadData);
          return { id: uploadRef.id, ...uploadData };
        } catch (error) {
          console.error('Error uploading file:', error);
          throw error;
        }
      });

      const uploadedFiles = await Promise.all(uploads);

      const postData = {
        description: formData.description || existingPost.description || '',
        date: postDate,
        coverImage: coverImageUrl,
        isArchived: existingPost.isArchived || false,
        project: formData.project,
      };

      await postRef.set(postData);
      setSuccessMessage('Post saved successfully.');

      setFormData({
        description: '',
        date: new Date(),
        imageUrls: [],
        videoUrls: [],
        tags: [],
        isArchived: false,
        project: '',
        coverImage: null,
      });
      setShowModal(false);
    } catch (error) {
      setErrorMessage('An error occurred. Please try again.');
      console.error('Error submitting form:', error);
    }
    setLoading(false);
  };

  const handleEdit = async (postId) => {
    setEditPostId(postId);

    const postDoc = await firestore.collection('posts').doc(postId).get();
    if (postDoc.exists) {
      const post = postDoc.data();
      setFormData({
        description: post.description,
        date: post.date.toDate(),
        imageUrls: post.imageUrls,
        videoUrls: post.videoUrls,
        tags: post.tags,
        isArchived: post.isArchived || false,
        project: post.project || '',
        coverImage: null,
      });
      setShowModal(true);
    }
  };

  const handleArchive = async (postId, isArchived) => {
    if (window.confirm(`Are you sure you want to ${isArchived ? 'unarchive' : 'archive'} this post?`)) {
      setLoading(true);
      setErrorMessage('');
      try {
        await firestore.collection('posts').doc(postId).update({ isArchived: !isArchived });
        setSuccessMessage(`Post ${isArchived ? 'unarchived' : 'archived'} successfully.`);
      } catch (error) {
        setErrorMessage('An error occurred. Please try again.');
        console.error('Error archiving/unarchiving post:', error);
      }
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      setLoading(true);
      setErrorMessage('');
      try {
        const storageRef = firebase.storage().ref(postId);
        const files = await storageRef.listAll();
        const deletionPromises = files.items.map((file) => file.delete());
        await Promise.all(deletionPromises);
        await storageRef.delete();

        await firestore.collection('posts').doc(postId).delete();

        setSuccessMessage('Post deleted successfully.');
      } catch (error) {
        if (error.code === 'storage/object-not-found') {
          console.warn('Storage folder not found. Deleting post document only.');
        } else {
          setErrorMessage('An error occurred. Please try again.');
          console.error('Error deleting post:', error);
        }

        await firestore.collection('posts').doc(postId).delete();
        setSuccessMessage('Post deleted successfully.');
      }
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div>
        <p>Please sign in to access the admin view.</p>
        <Link to="/signin">
          <button>Sign In</button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

      <button onClick={() => setShowModal(true)}>Upload</button>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowModal(false)}>
              &times;
            </span>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Description"
              />
              <input
                type="date"
                name="date"
                value={formData.date.toISOString().slice(0, 10)}
                onChange={handleFormChange}
              />

              <div>
                <label htmlFor="coverImageUpload">Upload Cover Image:</label>
                <input
                  id="coverImageUpload"
                  type="file"
                  name="coverImage"
                  accept="image/*"
                  onChange={handleCoverImageChange}
                />
              </div>

              <div>
                <label htmlFor="imageUpload">Upload Images:</label>
                <input id="imageUpload" type="file" name="imageUrls" multiple accept="image/*" />
              </div>
              <div>
                <label htmlFor="videoUpload">Upload Videos:</label>
                <input id="videoUpload" type="file" name="videoUrls" multiple accept="video/*" />
              </div>
              <div>
                <label>Tags:</label>
                {['Philosophy', 'Gardens', 'Ceramics', 'Human Computer Interaction'].map((tag) => (
                  <div key={tag}>
                    <input
                      type="checkbox"
                      id={tag}
                      checked={formData.tags.includes(tag)}
                      onChange={() => handleTagChange(tag)}
                    />
                    <label htmlFor={tag}>{tag}</label>
                  </div>
                ))}
              </div>
              <input
                type="text"
                name="project"
                value={formData.project}
                onChange={handleFormChange}
                placeholder="Project"
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Saving...' : editPostId ? 'Update Post' : 'Create Post'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div>
        {posts.map((post) => (
          <div key={post.id} className="post">
            {post.coverImage && (
              <LazyLoad>
                <img
                  src={post.coverImage}
                  alt="Cover"
                  onClick={() => handleEdit(post.id)}
                  className="post-cover-image"
                />
              </LazyLoad>
            )}
            <div className="post-info">
              <h2>{post.description}</h2>
              <p>{post.date.toDate().toLocaleString()}</p>
              <p>Tags: {post.tags ? post.tags.join(', ') : ''}</p>
              <p>Project: {post.project}</p>
            </div>
            <div className="post-actions">
              <button onClick={() => handleEdit(post.id)}>Edit</button>
              <button onClick={() => handleArchive(post.id, post.isArchived || false)}>
                {post.isArchived ? 'Unarchive' : 'Archive'}
              </button>
              <button onClick={() => handleDelete(post.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminView;