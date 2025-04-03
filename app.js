const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const db = require("./mysql"); // Ensure mysql.js is configured correctly
const fs = require("fs");
const session = require("express-session");
const PDFDocument = require('pdfkit');

const app = express();
app.use(
  session({
    secret: "a45A7ZMpVby14qNkWxlSwYGaSUv1d64x",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 2 * 60 * 1000, // 30 minutes session expiration 
    },
  })
);


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/sekure", (req, res) => {
  res.sendFile(path.join(__dirname, "creation.html"));
});


function isAuthenticated(req, res, next) {
  if (req.session.loggedin) {
    next();
  } else {
    res.redirect("/login");
  }
}

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Session check
app.get("/checkSession", (req, res) => {
  if (req.session && req.session.loggedin) {
    res.json({ loggedin: true, user: req.session.teacher });
  } else {
    res.json({ loggedin: false });
  }
});

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/login");
    }
    res.clearCookie("connect.sid");
    res.redirect("/login");
  });
});


// Nodemailer transporter configuration for custom email server
const transporter = nodemailer.createTransport({
  host: "mail.sekurefoundation.org.ng", // Custom mail server
  port: 465, // Use 465 for SSL, or 587 for TLS
  secure: true, // true for SSL, false for TLS
  auth: {
    user: "info@sekurefoundation.org.ng",
    pass: "Sekure@2025", // Actual email password
  },
});

// Contact form submission route
app.post("/send-message", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const mailOptions = {
    from: `"${name}" <${email}>`,
    to: "info@sekurefoundation.org.ng",
    subject: `Message from ${name}`,
    text: `You have a new message from your website contact form:

Name: ${name}
Email: ${email}
Message: ${message}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return res.status(200).json({ message: "Your message has been sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({ error: "Failed to send your message. Please try again later." });
  }
});

// Verify SMTP connection
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP connection error:", error);
  } else {
    console.log("SMTP is ready to send emails.");
  }
});
// Donation route
app.post("/donate", (req, res) => {
  const { donorName, donorEmail, donorPhone, amount, country, state, reference } = req.body;

  if (!donorName || !amount || !country || !state || !reference) {
    return res.status(400).json({ message: "All required fields must be filled." });
  }

  const emailToStore = donorEmail && donorEmail.trim() !== "" ? donorEmail : null;
  const phoneToStore = donorPhone && donorPhone.trim() !== "" ? donorPhone : null;

  const query = `
    INSERT INTO donations (donor_name, donor_email, donor_phone, amount, country, state, reference, date_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;

  db.query(query, [donorName, emailToStore, phoneToStore, amount, country, state, reference], (err, result) => {
    if (err) {
      console.error("Error inserting donation:", err);
      return res.status(500).json({ message: "Donation processing failed. Please try again." });
    }
    res.status(200).json({ message: "Donation successful. Thank you for your generosity!" });
  });
});

app.post("/verify-admin", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.json({ success: false, message: "Both fields are required." });
    }

    const query = "SELECT * FROM admin WHERE username = ?";
    db.query(query, [username], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.json({ success: false, message: "Database error." });
        }

        if (results.length === 0) {
            return res.json({ success: false, message: "Invalid credentials." });
        }

        const storedHashedPassword = results[0].password;

        // Compare the provided password with the stored hashed password
        bcrypt.compare(password, storedHashedPassword, (err, match) => {
            if (err) {
                console.error("Error verifying password:", err);
                return res.json({ success: false, message: "Error verifying password." });
            }

            if (match) {
                res.json({ success: true });
            } else {
                res.json({ success: false, message: "Invalid credentials." });
            }
        });
    });
});

app.post('/admin-signup', (req, res) => {
  const { fullName, email, phone, username, password, role } = req.body;

  // Validate input
  if (!fullName || !email || !username || !password || !role) {
      return res.json({ success: false, message: 'All required fields must be filled!' });
  }

  // Hash the password before storing it
  const saltRounds = 10;
  bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
      if (err) {
          console.error('Error hashing password:', err);
          return res.json({ success: false, message: 'Error securing password' });
      }

      // Insert new admin into database
      const insertQuery = 'INSERT INTO admin (fullName, email, phone, username, password, role) VALUES (?, ?, ?, ?, ?, ?)';
      db.query(insertQuery, [fullName, email, phone, username, hashedPassword, role], (err, result) => {
          if (err) {
              console.error('Database error:', err);
              return res.json({ success: false, message: 'Failed to create admin. Try again.' });
          }
          // Redirect after success
          res.json({ success: true, message: 'Admin created successfully!', redirect: '/admin_login.html' });
      });
  });
});

app.post('/admin_login', (req, res) => {
    const { username, password } = req.body;

    // Check if username exists in the database
    const query = 'SELECT * FROM admin WHERE username = ?';
    db.query(query, [username], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal server error'); // Avoid exposing database errors
        }

        if (result.length === 0) {
            return res.status(401).send('Invalid credentials');
        }

        // Compare the password with the hashed password stored in the database
        bcrypt.compare(password, result[0].password, (err, isMatch) => {
            if (err) {
                console.error('Bcrypt error:', err);
                return res.status(500).send('Internal server error');
            }

            if (!isMatch) {
                return res.status(401).send('Invalid credentials');
            }

            // Create session after successful login
            req.session.isAdminLoggedIn = true;

            // Redirect to the dashboard or admin panel
            res.redirect('/path.html');
            res.end(); // Ensure no further processing
        });
    });
});


// Admin dashboard route (Protected)
app.get("/monitor", authMiddleware, (req, res) => {
  res.sendFile(__dirname + '/path.html'); // Send the Admin Dashboard HTML 
});

// Middleware to check if admin is logged in
function authMiddleware(req, res, next) {
  if (req.session.isAdminLoggedIn) {
    return next();
  }
  return res.redirect('/admin_login.html'); // Redirect to admin login page if not logged in 
}

// Check if admin is logged in (for checking session state)
app.get("/check-admin-login", (req, res) => {
  if (req.session.isAdminLoggedIn) {
    return res.status(200).send('Logged in');
  }
  return res.status(401).send('Not authenticated');
});

// Admin logout route
app.post("/adminLogout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Logout failed');
    }
    return res.status(200).send('Logged out');
  });
});


// Fetch Donations Report (Protected Route)
app.get("/fetch-donations", authMiddleware, (req, res) => {
  let { startDate, endDate, sortBy, download } = req.query;
  let query = "SELECT * FROM donations WHERE 1";
  let queryParams = [];

  if (startDate && endDate) {
    query += " AND date_time BETWEEN ? AND ?";
    queryParams.push(startDate, endDate);
  }

  // Prevent SQL Injection by allowing only specific columns for sorting
  const allowedSortColumns = ["date_time", "amount", "donor_name"];
  if (sortBy && allowedSortColumns.includes(sortBy)) {
    query += ` ORDER BY ${sortBy}`;
  }

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Error fetching donations:", err);
      return res.status(500).json({ message: "Error fetching donations" });
    }

    if (download === "true") {
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=donations-report.pdf");
      doc.pipe(res);

      // Add Circular Logo at the Top
      const logoPath = path.join(__dirname, "sekure-logo.jpg");
      console.log("Logo Path:", logoPath);

      if (fs.existsSync(logoPath)) {
        doc.save();
        doc.circle(doc.page.width / 2, 70, 50).clip();
        doc.image(logoPath, doc.page.width / 2 - 50, 20, { width: 100, height: 100 });
        doc.restore();
      }

      doc.moveDown(6);
      doc.fontSize(18).text("Donations Report", { align: "center", underline: true });
      doc.moveDown(2);

      // Table Header
      doc.moveTo(30, doc.y).lineTo(650, doc.y).stroke();
      doc.moveDown(0.2);
      let startY = doc.y;

      doc.fontSize(12).fillColor("black")
        .text("S/N", 35, startY, { width: 50, align: "left" })
        .text("Donor Name", 95, startY, { width: 180, align: "left" })
        .text("Date", 250, startY, { width: 150, align: "left" })
        .text("Amount", 410, startY, { width: 80, align: "left" })
        .text("Reference", 500, startY, { width: 100, align: "left" });

      doc.moveDown(0.2);
      doc.moveTo(30, doc.y).lineTo(650, doc.y).stroke();
      doc.moveDown(0.5);

      // Table Data
      results.forEach((donation, index) => {
        const formattedDate = donation.date_time
          ? new Date(donation.date_time).toLocaleString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : "N/A";

        let rowY = doc.y;
        doc.fillColor(index % 2 === 0 ? "gray" : "white");
        doc.rect(30, rowY - 2, 600, 20).fill();
        doc.fillColor("black"); // Reset text color

        doc.text((index + 1).toString(), 35, rowY, { width: 50, align: "left" })
          .text(donation.donor_name, 95, rowY, { width: 180, align: "left" })
          .text(formattedDate, 250, rowY, { width: 150, align: "left" })
          .text(donation.amount.toString(), 410, rowY, { width: 80, align: "left" })
          .text(donation.reference || "N/A", 500, rowY, { width: 100, align: "left" });

        doc.moveDown(0.5);
      });

      // Signature Section
      doc.moveDown(3);
      doc.text("_________________________", 50, doc.y, { align: "left" });
      doc.text("Secretary Signature", 50, doc.y, { align: "left" });

      doc.end();
      return;
    }

    res.json(results);
  });
});

// Admin Logout (Redirect to Login Page)
app.get("/admin-logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin_login.html");
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});