require("dotenv").config();
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

// Firebase auth middleware
app.use((req, res, next) => {
	const authHeader = req.headers.authorization;
	if (authHeader && authHeader.startsWith('Bearer ')) {
		const idToken = authHeader.split('Bearer ')[1];
		// Store the token for use in routes
		req.token = idToken;
	}
	next();
});

// Debug middleware
app.use((req, res, next) => {
	console.log("Session:", req.session);
	console.log("Token:", req.token);
	next();
});

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

// Function to find a free port
const findFreePort = async (startPort) => {
	const net = require('net');
	
	return new Promise((resolve, reject) => {
		const server = net.createServer();
		server.unref();
		server.on('error', (err) => {
			if (err.code === 'EADDRINUSE') {
				resolve(findFreePort(startPort + 1));
			} else {
				reject(err);
			}
		});
		
		server.listen(startPort, () => {
			server.close(() => {
				resolve(startPort);
			});
		});
	});
};

const startServer = async () => {
	try {
		const port = process.env.PORT || 5000;
		const freePort = await findFreePort(port);
		app.listen(freePort, () => {
			console.log(`Server is running on port ${freePort}`);
			console.log("Firestore initialized");
		});
	} catch (error) {
		console.error('Failed to start server:', error);
		process.exit(1);
	}
};

startServer();
