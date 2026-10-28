
const express = require("express");
const validator = require("validator");
const argon2 = require("argon2");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();

const client = new MongoClient(process.env.MONGODB_URI);

app.use(express.json());

app.use(
  session({
    name: "devcollab.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
      clientPromise: Promise.resolve(client),
      dbName: "CoDevDB",
      collectionName: "sessions",
    }),

    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// ==========================
// REGISTER
// ==========================
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  next();
}

app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body ?? {};

    if (
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Please fill in all fields",
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
      cleanUsername.length < 3 ||
      cleanUsername.length > 30
    ) {
      return res.status(400).json({
        message: "Username must be 3-30 characters",
      });
    }

    if (
      !validator.isEmail(cleanEmail) ||
      cleanEmail.length > 254
    ) {
      return res.status(400).json({
        message: "Invalid email",
      });
    }

    if (
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 1024
    ) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const db = req.app.locals.db;
    const users = db.collection("users");

    const existingUser = await users.findOne({
      $or: [
        { username: cleanUsername },
        { email: cleanEmail },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Username or email already exists",
      });
    }

    const passwordHash = await argon2.hash(password);

    await users.insertOne({
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      createdAt: new Date(),
    });

    return res.status(201).json({
      message: "Registration successful",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Username or email already exists",
      });
    }

    console.error("Registration failed");

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});


app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body ?? {};

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Please fill in all fields",
      });
    }

    const db = req.app.locals.db;

    const existingUser = await db.collection("users").findOne({
      username: username.trim(),
    });

    if (!existingUser) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    const isValid = await argon2.verify(
      existingUser.passwordHash,
      password
    );

    if (!isValid) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    // Prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration failed");

        return res.status(500).json({
          message: "Something went wrong",
        });
      }

      req.session.userId = existingUser._id.toString();

      req.session.save((err) => {
        if (err) {
          console.error("Session save failed");

          return res.status(500).json({
            message: "Something went wrong",
          });
        }

        return res.status(200).json({
          message: "Login successful",
        });
      });
    });
  } catch (error) {
    console.error("Login failed");

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

// ==========================
// CHECK SESSION / CURRENT USER
// ==========================

app.get("/api/me", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (!ObjectId.isValid(req.session.userId)) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    const db = req.app.locals.db;

    const user = await db.collection("users").findOne(
      { _id: new ObjectId(req.session.userId) },
      {
        projection: {
          username: 1,
          email: 1,
        },
      }
    );

    if (!user) {
      return req.session.destroy(() => {
        res.clearCookie("devcollab.sid", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });

        return res.status(401).json({
          message: "Not authenticated",
        });
      });
    }

    return res.status(200).json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Session lookup failed");

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});

// ==========================
// LOGOUT
// ==========================

app.post("/api/logout", requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout failed");

      return res.status(500).json({
        message: "Could not log out",
      });
    }

    res.clearCookie("devcollab.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      message: "Logged out successfully",
    });
  });
});

// ==========================
// START SERVER
// ==========================

async function startServer() {
  try {
    if (
      !process.env.MONGODB_URI ||
      !process.env.SESSION_SECRET
    ) {
      throw new Error("Missing required environment variables");
    }

    await client.connect();

    console.log("Connected to MongoDB!");

    const db = client.db("CoDevDB");

    app.locals.db = db;

    // Start listening only after DB connection
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
