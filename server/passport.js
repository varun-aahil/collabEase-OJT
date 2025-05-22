const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./models/User");

module.exports = function (passport) {
	passport.use(
		new GoogleStrategy(
			{
				clientID: process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET,
				callbackURL: "/auth/google/callback",
			},
			async (accessToken, refreshToken, profile, done) => {
				try {
					console.log("Google profile:", profile);
					
					// Check if user already exists
					let user = await User.findOne({ email: profile.emails[0].value });
					
					if (user) {
						// If user exists, update their Google profile info
						user.googleId = profile.id;
						user.displayName = profile.displayName;
						user.firstName = profile.name.givenName;
						user.lastName = profile.name.familyName;
						user.image = profile.photos[0].value;
						await user.save();
						return done(null, user);
					}
					
					// If user doesn't exist, create new user
					user = await User.create({
						googleId: profile.id,
						email: profile.emails[0].value,
						displayName: profile.displayName,
						firstName: profile.name.givenName,
						lastName: profile.name.familyName,
						image: profile.photos[0].value,
					});
					
					return done(null, user);
				} catch (error) {
					console.error("Error in Google Strategy:", error);
					return done(error, null);
				}
			}
		)
	);

	passport.serializeUser((user, done) => {
		console.log("Serializing user:", user);
		done(null, user.id);
	});

	passport.deserializeUser(async (id, done) => {
		try {
			const user = await User.findById(id);
			console.log("Deserializing user:", user);
			done(null, user);
		} catch (error) {
			console.error("Error in deserializeUser:", error);
			done(error, null);
		}
	});
};
