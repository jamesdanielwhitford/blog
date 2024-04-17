import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Timeline from './components/Timeline';
import AdminView from './components/AdminView';
import Navbar from './components/Navbar';
import { useState, useEffect } from 'react';
import { auth } from './firebase';
import GoogleSignInButton from './components/GoogleSignInButton';

function App() {
  const [selectedTag, setSelectedTag] = useState(null);
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

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Router>
      <div>
        <nav>
          <ul>
            {user && window.location.pathname === '/admin' && (
              <>
                <li>
                  <Link to="/">User View</Link>
                </li>
                <li>
                  <button onClick={handleSignOut}>Sign Out</button>
                </li>
              </>
            )}
          </ul>
        </nav>

        <Routes>
          <Route path="/admin" element={<AdminView user={user} />} />
          <Route path="/signin" element={<SignInForm />} />
          <Route
            path="/"
            element={
              <>
                <Navbar selectedTag={selectedTag} setSelectedTag={setSelectedTag} />
                <Timeline selectedTag={selectedTag} />
              </>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  return (
    <form onSubmit={handleSignIn}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Sign In</button>
      <GoogleSignInButton />
    </form>
  );
}

export default App;