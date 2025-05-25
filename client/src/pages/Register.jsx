import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from "firebase/auth";
import { auth } from "../firebase";
import "../styles/Register.css";

function Register({ setUser }) {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: ""
	});
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		try {
			const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
			const user = userCredential.user;
			
			// Update the user's display name
			await updateProfile(user, {
				displayName: formData.username
			});

			setUser({
				id: user.uid,
				email: user.email,
				displayName: formData.username,
				photoURL: user.photoURL
			});
			navigate("/dashboard", { replace: true });
		} catch (error) {
			console.error("Signup error:", error);
			setError(error.message || "Registration failed. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleSignIn = async () => {
		setError("");
		setLoading(true);
		try {
			const provider = new GoogleAuthProvider();
			const userCredential = await signInWithPopup(auth, provider);
			const user = userCredential.user;
			setUser({
				id: user.uid,
				email: user.email,
				displayName: user.displayName,
				photoURL: user.photoURL
			});
			navigate("/dashboard", { replace: true });
		} catch (error) {
			console.error("Google sign-in error:", error);
			setError(error.message || "Google sign-in failed. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="container">
			<h1 className="heading">Sign up Form</h1>
			<div className="form_container">
				<div className="left">
					<img className="img" src="./images/signup.jpg" alt="signup" />
				</div>
				<div className="right">
					<h2 className="from_heading">Create Account</h2>
					{error && <div className="error">{error}</div>}
					<input 
						type="text" 
						className="input" 
						placeholder="Username" 
						name="username" 
						value={formData.username} 
						onChange={handleChange}
						disabled={loading}
					/>
					<input 
						type="email" 
						className="input" 
						placeholder="Email" 
						name="email" 
						value={formData.email} 
						onChange={handleChange}
						disabled={loading}
					/>
					<input 
						type="password" 
						className="input" 
						placeholder="Password" 
						name="password" 
						value={formData.password} 
						onChange={handleChange}
						disabled={loading}
					/>
					<button className="btn" onClick={handleSubmit} disabled={loading}>
						{loading ? "Signing up..." : "Sign Up"}
					</button>
					<p className="text">or</p>
					<button className="google_btn" onClick={handleGoogleSignIn} disabled={loading}>
						<img src="./images/google.png" alt="google icon" />
						<span>Sign up with Google</span>
					</button>
					<p className="text">
						Already Have Account ? <Link to="/login">Log In</Link>
					</p>
				</div>
			</div>
		</div>
	);
}

export default Register;
