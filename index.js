const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { default: mongoose } = require('mongoose');
const User = require('./models/User');
const Quotation = require('./models/Quotation'); // Import Quotation model
const app = express();
const cookieParser = require('cookie-parser');
const nodemailer = require("nodemailer");
const PORT = 4000; 

const secret = 'qwertyuiop12u2byu21yru2ry3bu2y3ru3yru3y';
const salt = bcrypt.genSaltSync(10);

app.use(cors({credentials:true,origin:'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());

mongoose.connect('mongodb+srv://mishradevesh5518:%23%23supercell1@cluster0.qjmqmwx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'mishradevesh5518@gmail.com',
    pass: 'kmtp pxnb wkbj xmth',
  },
});

// Initialize lastChecked time for users and quotations
let lastCheckedUsers = new Date();
let lastCheckedQuotations = new Date();

// Function to check for new users created in the last 10 seconds
const checkNewUsers = async () => {
  try {
    const tenSecondsAgo = new Date(Date.now() - 10 * 1000); // Time 10 seconds ago
    const newUsers = await User.find({ createdAt: { $gt: tenSecondsAgo } });
    
    if (newUsers.length > 0) {
      const adminEmail = 'fotoshoot63@gmail.com'; 
      const mailOptions = {
        from: 'mishradevesh5518@gmail.com',
        to: adminEmail,
        subject: 'New User Registrations',
        text: `New users have registered in the last 10 seconds:\n\n` +
              newUsers.map(user => `Username: ${user.username}\nEmail: ${user.email}\nPhone: ${user.phone}\n`).join('\n'),
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error sending email:', error);
        } else {
          console.log('Email sent:', info.response);
        }
      });
    }

    // Update lastChecked time for users
    lastCheckedUsers = new Date();
  } catch (error) {
    console.error('Error checking new users:', error);
  }
};

// Function to check for new quotations created in the last 10 seconds
const checkNewQuotations = async () => {
  try {
    const tenSecondsAgo = new Date(Date.now() - 10 * 1000); // Time 10 seconds ago
    const newQuotations = await Quotation.find({ createdAt: { $gt: tenSecondsAgo } });

    if (newQuotations.length > 0) {
      const adminEmail = 'fotoshoot63@gmail.com';
      const mailOptions = {
        from: 'mishradevesh5518@gmail.com',
        to: adminEmail,
        subject: 'New Quotation Requests',
        text: `New quotations have been created in the last 10 seconds:\n\n` +
              newQuotations.map(quote => `FullName: ${quote.fullName}\nEmail: ${quote.fullEmail}\nPhone: ${quote.mobileNumber}\nService: ${quote.service}\nCity: ${quote.city}\nBudget: ${quote.budget}\nMessage: ${quote.message}\n`).join('\n'),
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error sending email:', error);
        } else {
          console.log('Email sent:', info.response);
        }
      });
    }

    // Update lastChecked time for quotations
    lastCheckedQuotations = new Date();
  } catch (error) {
    console.error('Error checking new quotations:', error);
  }
};

// Run the check functions every 10 seconds
setInterval(checkNewUsers, 10 * 1000); // 10 seconds for users
setInterval(checkNewQuotations, 10 * 1000); // 10 seconds for quotations

// Sign up route
app.post('/signup', async (req, res) => {
  const { username, password, email, phone } = req.body;
  try {
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
      email,
      phone,
      createdAt: new Date() // Ensure `createdAt` is set
    });

    res.json(userDoc);
  } catch (e) {
    console.log(e);
    res.status(400).json(e);
  }
});

// Quotation route
app.post('/quotation', async (req, res) => {
  const { fullName, mobileNumber, fullEmail, message, service, city, budget } = req.body;
  try {
    const newQuotation = new Quotation({
      fullName,
      mobileNumber,
      fullEmail,
      message,
      service,
      city,
      budget,
      createdAt: new Date() // Ensure `createdAt` is set
    });

    await newQuotation.save();
    res.status(200).json({ message: 'You will be contacted within 5 minutes' });
  } catch (error) {
    console.error('Database error while inserting data:', error);
    res.status(500).json({ error: 'Error inserting data into the MongoDB database' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const userDoc = await User.findOne({ username });

    if (!userDoc) {
      return res.status(400).json('User not found');
    }

    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
        if (err) throw err;
        res.cookie('token', token).json({
          id: userDoc._id,
          username,
          email: userDoc.email,
          phone: userDoc.phone,
        });
      });
    } else {
      res.status(400).json('Wrong credentials');
    }
  } catch (e) {
    console.log(e);
    res.status(400).json('Login failed');
  }
});

app.get('/profile', (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, (err, info) => {
    if (err) throw err;
    res.json(info);
  });
});

app.post('/logout', (req, res) => {
  res.cookie('token', '').json('ok');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
