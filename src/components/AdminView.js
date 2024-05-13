import { useState, useEffect } from 'react';
import { firestore, auth } from '../firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/storage';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import LazyLoad from 'react-lazyload';
import '../AdminView.css';
import EXIF from 'exif-js';


const AdminView = () => {
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
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageLinks, setImageLinks] = useState({});
  const [imagePDFs, setImagePDFs] = useState({});
  const navigate = useNavigate();
  const [projectNames, setProjectNames] = useState([]);


  useEffect(() => {
    const fetchProjectNames = async () => {
      const projectsSnapshot = await firestore.collection('posts').get();
      const projects = [...new Set(projectsSnapshot.docs.map((doc) => doc.data().project))];
      setProjectNames(projects);
    };

    fetchProjectNames();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        // User is not authenticated, redirect to the sign-in page
        navigate('/signin');
      }
    });

    return unsubscribe;
  }, [navigate]);

  useEffect(() => {
    const unsubscribe = firestore
      .collection('posts')
      .orderBy('date', 'desc')
      .onSnapshot(async (snapshot) => {
        const postsData = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const post = {
              id: doc.id,
              description: doc.data().description,
              date: doc.data().date.toDate(), // Convert Firestore Timestamp to Date object
              coverImage: doc.data().coverImage,
              coverImageThumbnail: doc.data().coverImageThumbnail,
              mobileCoverImage: doc.data().mobileCoverImage, // Add this line
              laptopCoverImage: doc.data().laptopCoverImage,
              coverMimeType: doc.data().coverMimeType,
              isArchived: doc.data().isArchived,
              project: doc.data().project,
              tags: doc.data().tags,
            };
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
  
    if (name === 'project' && value === 'new') {
      setFormData((prevFormData) => ({
        ...prevFormData,
        project: '',
        newProject: '',
      }));
    } else {
      setFormData((prevFormData) => ({
        ...prevFormData,
        [name]: name === 'date' ? new Date(value) : value,
      }));
    }
  };

  const handleImagePDFChange = (index, pdf) => {
    setImagePDFs((prevPDFs) => ({
      ...prevPDFs,
      [index]: pdf,
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



  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const imagePromises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            file: file,
            url: event.target.result,
            dateTime: '',
            location: '',
          });
        };
        reader.readAsDataURL(file);
      });
    });
  
    Promise.all(imagePromises).then((images) => {
      setSelectedImages((prevImages) => [...prevImages, ...images]);
    });
  };

  const handleImageLinkChange = (index, link) => {
    setImageLinks((prevLinks) => ({
      ...prevLinks,
      [index]: link,
    }));
  };
  
  const handleImageDateChange = (index, dateTime) => {
    setSelectedImages((prevImages) => {
      const updatedImages = [...prevImages];
      updatedImages[index].dateTime = dateTime;
      return updatedImages;
    });
  };
  
  const handleImageLocationChange = (index, location) => {
    setSelectedImages((prevImages) => {
      const updatedImages = [...prevImages];
      updatedImages[index].location = location;
      return updatedImages;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!formData.description && selectedImages.length === 0) {
      setErrorMessage('Please enter a description or upload at least one image.');
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
      let coverImageThumbnailUrl = existingPost.coverImageThumbnail || null;
      let mobileCoverImageUrl = existingPost.mobileCoverImage || null;
      let laptopCoverImageUrl = existingPost.laptopCoverImage || null;
      let coverMimeType = null;
  
      if (selectedImages.length > 0) {
        const coverImage = selectedImages[0].file;
        const coverImageRef = firebase.storage().ref(`${postId}/coverImage`);
        await coverImageRef.put(coverImage);
        coverImageUrl = await coverImageRef.getDownloadURL();
  
        const thumbnailRef = firebase.storage().ref(`${postId}/coverImageThumbnail`);
        const thumbnailBlob = await resizeImage(coverImage, 300, 300);
        await thumbnailRef.put(thumbnailBlob);
        coverImageThumbnailUrl = await thumbnailRef.getDownloadURL();
  
        const mobileCoverImageRef = firebase.storage().ref(`${postId}/mobileCoverImage`);
        const mobileCoverImageBlob = await resizeImage(coverImage, 640, 360);
        await mobileCoverImageRef.put(mobileCoverImageBlob);
        mobileCoverImageUrl = await mobileCoverImageRef.getDownloadURL();
  
        const laptopCoverImageRef = firebase.storage().ref(`${postId}/laptopCoverImage`);
        const laptopCoverImageBlob = await resizeImage(coverImage, 1280, 720);
        await laptopCoverImageRef.put(laptopCoverImageBlob);
        laptopCoverImageUrl = await laptopCoverImageRef.getDownloadURL();
  
        coverMimeType = coverImage.type;
      }
  
      const uploads = selectedImages.map(async (image, index) => {
        const storageRef = firebase.storage().ref(`${postId}/${image.file.name}`);
        const metadata = {
          customMetadata: {
            dateTime: image.dateTime,
            link: imageLinks[index] || '',
          },
        };
  
        try {
          await storageRef.put(image.file, metadata);
          const downloadUrl = await storageRef.getDownloadURL();
  
          const mobileRef = firebase.storage().ref(`${postId}/${image.file.name}_mobile`);
          const laptopRef = firebase.storage().ref(`${postId}/${image.file.name}_laptop`);
  
          const mobileBlob = await resizeImage(image.file, 640, 360);
          await mobileRef.put(mobileBlob, metadata);
          const mobileUrl = await mobileRef.getDownloadURL();
  
          const laptopBlob = await resizeImage(image.file, 1280, 720);
          await laptopRef.put(laptopBlob, metadata);
          const laptopUrl = await laptopRef.getDownloadURL();
  
          metadata.customMetadata.mobileUrl = mobileUrl;
          metadata.customMetadata.laptopUrl = laptopUrl;
  
          await storageRef.updateMetadata(metadata);
  
          const uploadData = {
            url: downloadUrl,
            mobileUrl: mobileUrl,
            laptopUrl: laptopUrl,
            dateTime: image.dateTime,
            location: image.location,
            link: imageLinks[index] || '',
            tags: formData.tags,
            mimeType: image.file.type,
          };
  
          const pdfFile = imagePDFs[index];
          if (pdfFile) {
            const pdfRef = firebase.storage().ref(`${postId}/${image.file.name}_pdf`);
            await pdfRef.put(pdfFile);
            const pdfUrl = await pdfRef.getDownloadURL();
            uploadData.pdfUrl = pdfUrl;
          }
  
          const uploadRef = await postRef.collection('uploads').add(uploadData);
          return { id: uploadRef.id, ...uploadData };
        } catch (error) {
          console.error('Error uploading file:', error);
          throw error;
        }
      });
  
      const postData = {
        description: formData.description || existingPost.description || '',
        date: postDate,
        coverImage: coverImageUrl,
        coverImageThumbnail: coverImageThumbnailUrl,
        mobileCoverImage: mobileCoverImageUrl,
        laptopCoverImage: laptopCoverImageUrl,
        coverMimeType: coverMimeType,
        isArchived: existingPost.isArchived || false,
        project: formData.project === 'new' ? formData.newProject : formData.project,
        tags: formData.tags,
      };
  
      await Promise.all(uploads);
      console.log('All uploads completed successfully');
  
      await postRef.set(postData);
      setSuccessMessage('Post saved successfully.');
  
      setFormData({
        description: '',
        date: new Date(),
        imageUrls: [],
        tags: [],
        isArchived: false,
        project: '',
      });
  
      setSelectedImages([]);
  
      setShowModal(false);
    } catch (error) {
      console.error('Error uploading files:', error);
      setErrorMessage('An error occurred while uploading files. Please try again.');
    }
    setLoading(false);
  };

  const resizeImage = async (file, maxWidth, maxHeight) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }

          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            resolve(blob);
          }, file.type);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // const generateVideoThumbnail = async (file) => {
  //   return new Promise((resolve) => {
  //     const video = document.createElement('video');
  //     video.src = URL.createObjectURL(file);
  //     video.addEventListener('loadedmetadata', () => {
  //       const canvas = document.createElement('canvas');
  //       canvas.width = video.videoWidth;
  //       canvas.height = video.videoHeight;
  //       const ctx = canvas.getContext('2d');
  //       ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  //       canvas.toBlob((blob) => {
  //         resolve(blob);
  //       }, 'image/jpeg');
  //     });
  //   });
  // };

  const handleEdit = async (postId) => {
    setEditPostId(postId);
  
    const postDoc = await firestore.collection('posts').doc(postId).get();
    if (postDoc.exists) {
      const post = postDoc.data();
      setFormData({
        description: post.description,
        date: post.date.toDate(), // Convert Firestore Timestamp to Date object
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

  const handleSignOut = async () => {
    const auth = getAuth();
    console.log('Signing out...'); // Add this line
    try {
      await signOut(auth);
      console.log('User signed out successfully'); // Add this line
      window.location.href = '/'; // Redirect to the home page after sign out
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div>
    <div className="admin-header">
      <div className="upload-button-container">
        <button className="upload-button" onClick={() => setShowModal(true)}>
          Upload
        </button>
      </div>
      <button className="sign-out-button" onClick={handleSignOut}>
        Sign Out
      </button>
    </div>

      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

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
        <select
    name="project"
    value={formData.project}
    onChange={handleFormChange}
  >
    <option value="">Select a project</option>
    {projectNames.map((project) => (
      <option key={project} value={project}>
        {project}
      </option>
    ))}
    <option value="new">Add new project</option>
  </select>
  {formData.project === 'new' && (
    <input
      type="text"
      name="newProject"
      value={formData.newProject}
      onChange={handleFormChange}
      placeholder="Enter new project name"
    />
  )}


      <div>
        <label htmlFor="imageUpload">Upload Images:</label>
        <input id="imageUpload" type="file" name="imageUrls" multiple accept="image/*" onChange={handleImageChange} />
      </div>
      <div className="selected-images">
  {selectedImages.map((image, index) => (
    <div key={index} className="selected-image">
      <img src={image.url} alt={`Selected ${index}`} />
      <input
        type="date"
        placeholder="Date"
        value={image.dateTime}
        onChange={(e) => handleImageDateChange(index, e.target.value)}
      />
      <input
        type="text"
        placeholder="Location"
        value={image.location}
        onChange={(e) => handleImageLocationChange(index, e.target.value)}
      />
      <input
        type="text"
        placeholder="Link (e.g., YouTube URL)"
        value={imageLinks[index] || ''}
        onChange={(e) => handleImageLinkChange(index, e.target.value)}
      />
            <input
        type="file"
        accept="application/pdf"
        onChange={(e) => handleImagePDFChange(index, e.target.files[0])}
      />
    </div>
  ))}
</div>


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
            <LazyLoad offset={500}>
              <img
                src={window.innerWidth <= 640 ? post.mobileCoverImage : post.laptopCoverImage}
                alt="Cover"
                onClick={() => handleEdit(post.id)}
                className="post-cover-image"
                onError={(e) => {
                  console.error('Error loading cover image:', e.target.src);
                }}
              />
            </LazyLoad>
          )}
          <div className="post-info">
            <h2>{post.description}</h2>
            <p>{post.date.toLocaleString()}</p>
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