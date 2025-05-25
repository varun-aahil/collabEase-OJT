import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

// Import pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Team from "./pages/Team";
import Projects from "./pages/Projects";
import Landing from './pages/Landing';
import Profile from './pages/Profile';

function App() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				setUser({
					id: user.uid,
					email: user.email,
					displayName: user.displayName,
					photoURL: user.photoURL
				});
			} else {
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
				path="/"
				element={user ? <Navigate to="/dashboard" replace /> : <Landing />}
			/>
		</Routes>
	);
}

export default App;
