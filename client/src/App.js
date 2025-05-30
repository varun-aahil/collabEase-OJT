import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, onIdTokenChanged } from "firebase/auth";
import { auth } from "./firebase";
import './styles/DarkMode.css';

// Import pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Team from "./pages/Team";
import Projects from "./pages/Projects";
import Landing from './pages/Landing';
import Profile from './pages/Profile';
import Settings from './components/Settings';

function App() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [theme, setTheme] = useState(() => {
		// Get theme from localStorage or default to 'light'
		return localStorage.getItem('theme') || 'light';
	});

	// Update theme in localStorage and apply to document
	useEffect(() => {
		localStorage.setItem('theme', theme);
		document.documentElement.className = theme === 'dark' ? 'dark-theme' : '';
	}, [theme]);

	// Listen for auth state changes and set user
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			if (user) {
				// Get the ID token
				try {
					const token = await user.getIdToken();
					// Store the token in localStorage
					localStorage.setItem('authToken', token);
					console.log('Auth token saved to localStorage');
				} catch (error) {
					console.error('Error getting auth token:', error);
				}
				
				setUser({
					id: user.uid,
					email: user.email,
					displayName: user.displayName,
					photoURL: user.photoURL
				});
			} else {
				// Clear the token when user logs out
				localStorage.removeItem('authToken');
				setUser(null);
			}
			setLoading(false);
		}, (error) => {
			console.error("Auth state change error:", error);
			setError(error.message);
			setLoading(false);
		});

		// Cleanup subscription
		return () => unsubscribe();
	}, []);

	// Listen for token changes and update localStorage
	useEffect(() => {
		const unsubscribeToken = onIdTokenChanged(auth, async (user) => {
			if (user) {
				// Update the token when it changes
				try {
					const token = await user.getIdToken();
					localStorage.setItem('authToken', token);
					console.log('Auth token refreshed in localStorage');
				} catch (error) {
					console.error('Error refreshing auth token:', error);
				}
			}
		});

		// Force token refresh every 45 minutes
		const intervalId = setInterval(async () => {
			const user = auth.currentUser;
			if (user) {
				try {
					const token = await user.getIdToken(true);
					localStorage.setItem('authToken', token);
					console.log('Auth token force refreshed');
				} catch (error) {
					console.error('Error force refreshing token:', error);
				}
			}
		}, 45 * 60 * 1000);

		return () => {
			unsubscribeToken();
			clearInterval(intervalId);
		};
	}, []);

	if (loading) {
		return (
			<div className="loading">
				<div className="spinner"></div>
				<p>Loading...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="error-container">
				<p className="error-message">{error}</p>
				<button onClick={() => window.location.reload()}>Retry</button>
			</div>
		);
	}

	return (
		<div className={`app-container ${theme}-theme`}>
			<Routes>
				<Route
					path="/login"
					element={user ? <Navigate to="/dashboard" replace /> : <Login setUser={setUser} />}
				/>
				<Route
					path="/register"
					element={user ? <Navigate to="/dashboard" replace /> : <Register setUser={setUser} />}
				/>
				<Route
					path="/dashboard"
					element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/login" replace />}
				/>
				<Route
					path="/team"
					element={user ? <Team user={user} setUser={setUser} /> : <Navigate to="/login" replace />}
				/>
				<Route
					path="/projects"
					element={user ? <Projects user={user} setUser={setUser} /> : <Navigate to="/login" replace />}
				/>
				<Route
					path="/profile"
					element={user ? <Profile user={user} setUser={setUser} /> : <Navigate to="/login" replace />}
				/>
				<Route
					path="/settings"
					element={user ? <Settings user={user} setUser={setUser} theme={theme} setTheme={setTheme} /> : <Navigate to="/login" replace />}
				/>
				<Route
					path="/"
					element={user ? <Navigate to="/dashboard" replace /> : <Landing />}
				/>
			</Routes>
		</div>
	);
}

export default App;
