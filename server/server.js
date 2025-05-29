require("dotenv").config();
// Timestamp: 2025-05-30 - Forcing reload
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { initializeFirebase } = require("./config/firebase");
const projectRoutes = require("./routes/projects");
const taskRoutes = require("./routes/tasks");
const userRoutes = require("./routes/users");

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
		methods: "GET,POST,PUT,DELETE",
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

// Routes
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);

// Test route
app.get("/", (req, res) => {
	res.send("Server is running");
});

const startServer = async () => {
	try {
		const port = parseInt(process.env.PORT || '5001', 10);
		console.log("Attempting to start server on port:", port);
		
		// Ensure port is within valid range
		if (isNaN(port) || port < 0 || port >= 65536) {
			console.error('Invalid port number:', port);
			process.exit(1);
		}
		
		app.listen(port, () => {
			console.log(`Server is running on port ${port}`);
			console.log("Firestore initialized");
		});
	} catch (error) {
		console.error('Failed to start server:', error);
		process.exit(1);
	}
};

startServer();
