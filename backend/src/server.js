
const express = require("express");
const validator = require("validator");
const argon2 = require("argon2");

require("dotenv").config();

const { MongoClient } = require("mongodb");

const app = express();

const client = new MongoClient(process.env.MONGODB_URI);


app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "API is running"
    });
});

app.post("/api/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (
            typeof username !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                message: "Invalid input"
            });
        }

        const cleanUsername = username.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanUsername || !cleanEmail || !password.trim()) {
            return res.status(400).json({
                message: "Please fill in all fields"
            });
        }

        if (
            cleanUsername.length < 3 ||
            cleanUsername.length > 30
        ) {
            return res.status(400).json({
                message: "Username must be 3-30 characters"
            });
        }

        // 5. Email validation
        if (
            cleanEmail.length > 254 ||
            !validator.isEmail(cleanEmail)
        ) {
            return res.status(400).json({
                message: "Invalid email address"
            });
        }

        if (
            password.length < 8 ||
            Buffer.byteLength(password, "utf8") > 1024
        ) {
            return res.status(400).json({
                message: "Password does not meet requirements"
            });
        }

        const db = req.app.locals.db;
        const users = db.collection("users");

        const existingUser = await users.findOne({
            email: cleanEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const passwordHash = await argon2.hash(password);


        await users.insertOne({
            username: cleanUsername,
            email: cleanEmail,
            passwordHash,
            createdAt: new Date()
        });

        return res.status(201).json({
            message: "Registration successful"
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Unable to register with this email"
            });
        }

        console.error("Registration error:", error);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }

})

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
                message: "Please fill in all fields"
            });
        }

        const cleanUsername = username.trim();

        const db = req.app.locals.db;
        const users = db.collection("users");

        const existingUser = await users.findOne({
            username: cleanUsername
        });

        if (!existingUser) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        const isValid = await argon2.verify(
            existingUser.passwordHash,
            password
        );

        if (!isValid) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        return res.status(200).json({
            message: "Login successful"
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Something went wrong"
        });
    }
});


async function startServer() {
    try {
        await client.connect();

        console.log("Connected to MongoDB!");

        const db = client.db("CoDevDB");

        app.locals.db = db;

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
