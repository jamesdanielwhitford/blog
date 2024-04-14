// Initialize Firebase (make sure to replace the placeholders with your own configuration values)
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};
  firebase.initializeApp(firebaseConfig);
  
  // Get references to Firebase services
  const db = firebase.firestore();
  const storage = firebase.storage();
  
  // Function to retrieve and display blog posts
  function displayBlogPosts() {
    const timelineSection = document.getElementById('timeline');
  
    db.collection('posts').orderBy('date', 'desc').get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const post = doc.data();
        const postElement = document.createElement('div');
        postElement.classList.add('post');
        postElement.innerHTML = `
          <h2>${post.title}</h2>
          <p>${post.description}</p>
          <p>Date: ${post.date.toDate().toLocaleDateString()}</p>
          <div class="tags">${post.tags.map(tag => `<span>${tag}</span>`).join('')}</div>
          <div class="images">${post.imageUrls.map(url => `<img src="${url}" alt="Post Image">`).join('')}</div>
          <div class="videos">${post.videoUrls.map(url => `<iframe src="${url}" frameborder="0" allowfullscreen></iframe>`).join('')}</div>
          <button class="view-full-size">View Full Size</button>
          <button class="share">Share</button>
        `;
        timelineSection.appendChild(postElement);
      });
    });
  }
  
  // Function to handle user authentication state changes
  function handleAuthStateChanged(user) {
    const adminControls = document.getElementById('admin-controls');
  
    if (user) {
      // User is signed in, show admin controls
      adminControls.style.display = 'block';
    } else {
      // User is signed out, hide admin controls
      adminControls.style.display = 'none';
    }
  }
  
  // Function to handle tag filtering
  function handleTagFiltering() {
    const tagFilterButtons = document.querySelectorAll('.tag-filter');
  
    tagFilterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const selectedTag = button.dataset.tag;
        // Filter the displayed blog posts based on the selected tag
        // You can implement this by querying the Firestore database with the selected tag
        // and updating the displayed posts accordingly
      });
    });
  }
  
  // Function to handle post sharing
  function handlePostSharing() {
    const shareButtons = document.querySelectorAll('.share');
  
    shareButtons.forEach(button => {
      button.addEventListener('click', () => {
        const postElement = button.closest('.post');
        const postId = postElement.dataset.postId;
        const shareUrl = `https://yourdomain.com/post/${postId}`;
        // Implement the sharing functionality using the Web Share API or by copying the share URL to the clipboard
      });
    });
  }
  
  // Call the necessary functions when the DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    firebase.auth().onAuthStateChanged(handleAuthStateChanged);
    displayBlogPosts();
    handleTagFiltering();
    handlePostSharing();
  });