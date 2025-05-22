const express = require("express");
const router = express.Router();
const passport = require("passport");
const { isAuthenticated } = require("../middleware/auth");

// Google OAuth routes
router.get(
	"/google",
	passport.authenticate("google", { 
		scope: ["profile", "email"],
		prompt: "select_account"
	})
);

router.get(
	"/google/callback",
	passport.authenticate("google", {
		successRedirect: "http://localhost:3000/dashboard",
		failureRedirect: "http://localhost:3000/login",
		session: true
	})
);

// Check authentication status
router.get("/login/success", (req, res) => {
	console.log("Login success route - Session:", req.session);
	console.log("Login success route - User:", req.user);
	
	if (req.isAuthenticated() && req.user) {
		res.status(200).json({
			success: true,
			message: "User authenticated",
			user: {
				id: req.user._id,
				username: req.user.username,
				email: req.user.email,
				picture: req.user.picture
			}
		});
	} else {
		res.status(401).json({
			success: false,
			message: "User not authenticated"
		});
	}
});

// Login failure
router.get("/login/failed", (req, res) => {
	res.status(401).json({
		success: false,
		message: "Login failed"
	});
});

// Logout
router.get("/logout", (req, res) => {
	// Logout from passport
	req.logout((err) => {
		if (err) {
			console.error("Passport logout error:", err);
			return res.status(500).json({ 
				success: false,
				message: "Error logging out" 
			});
		}

		// Clear the session
		req.session.destroy((err) => {
			if (err) {
				console.error("Session destroy error:", err);
				return res.status(500).json({ 
					success: false,
					message: "Error destroying session" 
				});
			}

			// Clear the cookie
			res.clearCookie("connect.sid", {
				httpOnly: true,
				path: "/"
			});

			// Send success response
			res.status(200).json({ 
				success: true,
				message: "Logged out successfully" 
			});
		});
	});
});

module.exports = router;
