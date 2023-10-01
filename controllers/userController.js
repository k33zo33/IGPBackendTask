require("dotenv").config();

const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;

// Import your Mongoose models (User and UserVerification) here


//mongodv user model
const User = require('./../models/user');

//mongodb user verification model

const UserVerification = require('./../models/userVerification');

// Initialize the nodemailer transporter

let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS
    }
});

// Verify the transporter
transporter.verify((error, success) => {
    if (error) {
        console.log(error);
    } else {
        console.log("Ready for messages");
        console.log(success);
    }
});

// Define the controller functions for user registration, email verification, and sign-in here

const registerUser = (req, res) => {
    let { name, email, password, dateOfBirth } = req.body;
    name = name.trim();
    email = email.trim();
    password = password.trim();
    dateOfBirth = dateOfBirth.trim();

    if (name == "" || email == "" || password == "" || dateOfBirth == "") {
        res.json({
            status: "Failed",
            message: "Empty input fields",
        });
    } else if (!/^[a-zA-Z ]*$/.test(name)) {
        res.json({
            status: "Failed",
            message: "Invalid name entered",
        });
    } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        res.json({
            status: "Failed",
            message: "Invalid email format",
        });
    } else if (!new Date(dateOfBirth).getTime()) {
        res.json({
            status: "Failed",
            message: "Invalid date of birth",
        });
    } else if (password.length < 8) {
        res.json({
            status: "Failed",
            message: "Password too short",
        });
    } else {
        //checking if user already exists
        User.find({ email }).then(result => {
            if (result.length) {
                //a user already exists
                res.json({
                    status: "Failed",
                    message: "A user with that email already exists",
                });
            } else {
                //try to create a new user

                //password handling
                const saltRounds = 10;
                bcrypt.hash(password, saltRounds).then(hashedPassword => {
                    console.log('After bcrypt.hash: hashedPassword=', hashedPassword);

                    const newUser = new User({
                        name,
                        email,
                        password: hashedPassword,
                        dateOfBirth,
                        verified: false,
                    });

                    newUser
                        .save()
                        .then((result) => {
                            //handle account verification
                            sendVerificationEmail(result, res);
                        })
                        .catch((err) => {
                            res.json({
                                status: "FAILED",
                                message: "An error occurred while saving the user account!",
                            });
                        });

                })
                    .catch(err => {
                        console.log('bcrypt.hash Error:', err);
                        res.json({
                            status: "FAILED",
                            message: "An error occurred while hashing the password",
                        });
                    });
            }

        }).catch(err => {
            console.log(err);
            res.json({
                status: "Failed",
                message: "An error occurred while checking for an existing user!",
            });
        });
    }
};

const sendVerificationEmail = ({ _id, email }, res) => {
    //url to be used in the email
    const currentUrl = "http://localhost:5000/";

    const uniqueString = uuidv4() + _id;

    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Verify your Email",
        html: `<p>Verify your email address to complete the signup.</p><p>This link expires in 6 hours<p><p>Click: <a href=${
            currentUrl + "user/verify/" + _id + "/" + uniqueString
        }>here</a> to proceed.</p>`,
    };

    //hash the unique string
    const saltRounds = 10;
    bcrypt
        .hash(uniqueString, saltRounds)
        .then((hashedUniqueString) => {
            //set values at userVerification collection
            const newVerification = new UserVerification({
                userId: _id,
                uniqueString: hashedUniqueString,
                createdAt: Date.now(),
                expiresAt: Date.now() + 2160000,
            });

            newVerification
                .save()
                .then(() => {
                    transporter
                        .sendMail(mailOptions)
                        .then(() => {
                            //email sent and verification record saved
                            res.json({
                                status: "PENDING",
                                message: "Verification email sent",
                            });
                        })
                        .catch((error) => {
                            console.log(error);
                            res.json({
                                status: "FAILED",
                                message: "Email verification failed",
                            });
                        });
                })
                .catch((error) => {
                    console.log(error);
                    res.json({
                        status: "FAILED",
                        message: "Couldn't save email verification data!",
                    });
                });
        })
        .catch(() => {
            res.json({
                status: "FAILED",
                message: "An error occurred while hashing email data",
            });
        });
};

const verifyEmail = (req, res) => {
    let { userId, uniqueString } = req.params;
    console.log("userId:", userId);
    console.log("uniqueString:", uniqueString);

    UserVerification
        .find({ userId })
        .then((result) => {
            if (result.length > 0) {
                //use verification record exists so we proceed
                const { expiresAt } = result[0];
                const hashedUniqueString = result[0].uniqueString;

                if (expiresAt < Date.now()) {
                    //record has expired so we delete it
                    UserVerification
                        .deleteOne({ userId })
                        .then(result => {
                            User
                                .deleteOne({ _id: userId })
                                .then(() => {
                                    let message = "Link has expired. Please sign up again.";
                                    res.redirect(`/user/verified/error=true&message=${message}`);
                                })
                                .catch(error => {
                                    let message = "Clearing the user with the expired unique string failed.";
                                    res.redirect(`/user/verified/error=true&message=${message}`);
                                });
                        })
                        .catch((error) => {
                            let message = "An error occurred while clearing the expired user verification record.";
                            res.redirect(`/user/verified/error=true&message=${message}`);
                        });
                } else {
                    // valid record exists so we validate the user string
                    // first compare the hashed unique string

                    bcrypt
                        .compare(uniqueString, hashedUniqueString)
                        .then(result => {
                            if (result) {
                                //strings match

                                User
                                    .updateOne({ _id: userId }, { verified: true })
                                    .then(() => {
                                        UserVerification.deleteOne({ userId })
                                            .then(() => {
                                                res.sendFile(path.join(__dirname, "./../views/verified.html"));
                                            })
                                            .catch(error => {
                                                console.log(error);
                                                let message = "An error occurred while finalizing successful verification.";
                                                res.redirect(`/user/verified/error=true&message=${message}`);
                                            });
                                    })
                                    .catch(error => {
                                        console.log(error);
                                        let message = "An error occurred while updating the user record for the verified value.";
                                        res.redirect(`/user/verified/error=true&message=${message}`);
                                    });

                            } else {
                                //existing record but incorrect verification details passed
                                let message = "Invalid verification details passed. Check your inbox.";
                                res.redirect(`/user/verified/error=true&message=${message}`);
                            }
                        })
                        .catch(error => {
                            let message = "An error occurred while comparing unique strings.";
                            res.redirect(`/user/verified/error=true&message=${message}`);
                        });

                }
            } else {
                //user verification record doesn't exist
                let message = "Account record doesn't exist or has been verified already. Please sign up or log in.";
                res.redirect(`/user/verified/error=true&message=${message}`);
            }
        })
        .catch((error) => {
            console.log(error);
            let message = "An error occurred while checking for an existing user verification record";
            res.redirect(`/user/verified/error=true&message=${message}`);
        });
};

const signInUser = (req, res) => {
    console.log('Request Body:', req.body);
   
    let { email, password } = req.body;
    email = email.trim();
    password = password.trim();

    if (email == "" || password == "") {
        res.json({
            status: "FAILED",
            message: "Empty credentials supplied",
        });
    } else {
        //check if the user exists
        User.find({ email })
            .then(data => {

                if (data) {
                    //user exists

                    //check if the user is verified
                    if (!data[0].verified) {
                        res.json({
                            status: "FAILED",
                            message: "Email hasn't been verified yet. Check your inbox",

                        });
                    } else {

                        const hashedPassword = data[0].password;
                        bcrypt.compare(password, hashedPassword).then(result => {

                            if (result) {
                                const token = jwt.sign({ userId: data[0]._id }, secretKey, { expiresIn: '7d' }); // Token expires in 7 days
                                //for session managment
                                res.cookie('token', token, { httpOnly: true });
                                res.json({
                                    status: "SUCCESS",
                                    message: "Sign-in successful",
                                    token: token,
                                    data: data
                                });
                                
                            } else {
                                res.json({
                                    status: "FAILED",
                                    message: "Invalid password entered",

                                });
                            }
                        })
                            .catch(err => {
                                res.json({
                                    status: "FAILED",
                                    message: "An error occurred while comparing passwords",

                                });
                            });
                    }


                } else {
                    res.json({
                        status: "FAILED",
                        message: "Invalid credentials entered",

                    });
                }
            })

            .catch(err => {
                res.json({
                    status: "FAILED",
                    message: "An error occurred while checking for an existing user",

                });
            });
    }

};

const signOutUser= (req, res) => {
    // Clear the JWT token from local storage
    localStorage.removeItem('token'); 
    
    // Redirect the user to the login page
    res.redirect('/login'); // Replace '/login' with the actual URL of your login page
};

//for session managment
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
  
    if (!token) {
      return res.status(401).json({
        status: 'FAILED',
        message: 'Authentication token not provided',
      });
    }
  
    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return res.status(403).json({
          status: 'FAILED',
          message: 'Token verification failed',
        });
      }
  
      req.user = user; // Set the user in the request object
      next(); // Proceed to the protected route
    });
  };

module.exports = {
    registerUser,
    sendVerificationEmail,
    verifyEmail,
    signInUser,
    signOutUser,
    authenticateToken
};
