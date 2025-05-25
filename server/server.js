require("dotenv").config();
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passportStrategy = require("./passport");
const connectDB = require("./config/db");
const authRoute = require("./routes/auth");
const projectRoutes = require("./routes/projects");

// Connect to MongoDB
connectDB();

// Debug environment variables
console.log('Environment variables loaded:');
console.log('CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing');
console.log('CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Present' : 'Missing');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Present' : 'Missing');

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
		store: MongoStore.create({
			mongoUrl: process.env.MONGO_URI,
			ttl: 24 * 60 * 60 // 1 day
		}),
		cookie: {
			maxAge: 24 * 60 * 60 * 1000, // 24 hours
			sameSite: "lax",
			secure: false, // Set to true in production with HTTPS
			httpOnly: true
		}
	})
);

// Initialize Passport
passportStrategy(passport);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Debug middleware
app.use((req, res, next) => {
	console.log("Session:", req.session);
	console.log("User:", req.user);
	next();
});

// Routes
app.use("/auth", authRoute);
app.use("/api/projects", projectRoutes);

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
			console.log("MongoDB connected");
		});
	} catch (error) {
		console.error('Failed to start server:', error);
		process.exit(1);
	}
};

startServer();
