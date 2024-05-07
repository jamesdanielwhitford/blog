import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Timeline from './components/Timeline';
import AdminView from './components/AdminView';
import Navbar from './components/Navbar';
import { useState, useEffect } from 'react';
import { auth } from './firebase';
import GoogleSignInButton from './components/GoogleSignInButton';

function App() {
  const [selectedTags, setSelectedTags] = useState(['Philosophy', 'Gardens', 'Ceramics', 'Human Computer Interaction']);

  useEffect(() => {
    console.log('Selected tags:', selectedTags); // Add this line for debugging
  }, [selectedTags]);  
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // const handleSignOut = async () => {
  //   try {
  //     await auth.signOut();
  //   } catch (error) {
  //     console.error('Error signing out:', error);
  //   }
  // };

  return (
    <Router>
      <div>
        <nav>

        </nav>

        <Routes>
          <Route path="/admin" element={<AdminView user={user} />} />
          <Route path="/signin" element={<SignInForm />} />
          <Route
            path="/"
            element={
              <>
                <Navbar selectedTags={selectedTags} setSelectedTags={setSelectedTags} />
                <Timeline selectedTags={selectedTags} />
              </>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

function SignInForm() {
  return (
    <div className="sign-in-container">
      <GoogleSignInButton />
    </div>
  );
}
export default App;