import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

// Import pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Team from "./pages/Team";
import Projects from "./pages/Projects";
import Landing from './pages/Landing';

function App() {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const checkAuth = async () => {
			try {
				const response = await axios.get("http://localhost:5000/auth/login/success", {
					withCredentials: true,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					}
				});
				if (response.data.user) {
					setUser(response.data.user);
				}
			} catch (error) {
				// Only set error if it's not a 401 (unauthorized)
				if (error.response?.status !== 401) {
					console.error("Auth check error:", error);
					setError(error.response?.data?.message || "Authentication failed");
				}
			} finally {
				setLoading(false);
			}
		};

		checkAuth();
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
				path="/"
				element={user ? <Navigate to="/dashboard" replace /> : <Landing />}
			/>
		</Routes>
	);
}

export default App;
