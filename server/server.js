require("dotenv").config();
// Timestamp: 2025-05-30 - Forcing reload
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { initializeFirebase } = require("./config/firebase");
const { autoCreateUser } = require("./middleware/autoCreateUser");
const projectRoutes = require("./routes/projects");
const taskRoutes = require("./routes/tasks");
const userRoutes = require("./routes/users");
const teamRoutes = require("./routes/team");
const notificationRoutes = require("./routes/notifications");

// Initialize Firestore
const db = initializeFirebase();

// Debug environment variables
console.log('Environment variables loaded:');
console.log('FIREBASE_SERVICE_ACCOUNT:', process.env.FIREBASE_SERVICE_ACCOUNT ? 'Present' : 'Missing');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(
	cors({
		origin: "http://localhost:3000",
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		credentials: true,
		allowedHeaders: ['Content-Type', 'Authorization']
	})
);

// Session configuration
app.use(
	session({
		secret: process.env.SESSION_SECRET || "cyberwolve",
		resave: false,
		saveUninitialized: false,
		cookie: {
			maxAge: 24 * 60 * 60 * 1000, // 24 hours
			sameSite: "lax",
			secure: false, // Set to true in production with HTTPS
			httpOnly: true
		}
	})
);

// Make Firestore db available to all routes
app.use((req, res, next) => {
	req.db = db;
	next();
});

// Auto-create user documents for new Firebase Auth users
app.use(autoCreateUser);

// Routes
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/notifications", notificationRoutes);

// Test route
app.get("/", (req, res) => {
	res.send("Server is running");
});

// Start server
const startServer = () => {
	const PORT = parseInt(process.env.PORT || 5002, 10); // Parse as integer
	console.log('Attempting to start server on port:', PORT);
	
	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	}).on('error', (err) => {
		if (err.code === 'EADDRINUSE') {
			const nextPort = PORT + 1; // Now this will be proper addition
			console.error(`Port ${PORT} is already in use. Trying port ${nextPort}...`);
			app.listen(nextPort, () => {
				console.log(`Server running on port ${nextPort}`);
			});
		} else {
			console.error('Server error:', err);
		}
	});
};

startServer();
