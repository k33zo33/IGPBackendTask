// mongodb
require('./config/db');


const express = require('express');

const app = express();

const cookieParser = require('cookie-parser');
const expressSession = require('express-session');

const path = require('path');

const Notification = require('./models/notification');

const ejs = require('ejs');

const NotificationController = require('./controllers/notificationController');
const UserController =  require('./controllers/userController');
const authenticateToken = UserController.authenticateToken;

const secretKey = process.env.SECRET_KEY;


app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'views'));

const port = process.env.PORT||5000;

const UserRouter = require('./api/user.js');
const NotificationApi = require('./api/notification.js');

let loggedInUserId = null;



app.use(express.json()); 


//session managment
app.use(cookieParser());
app.use(
  expressSession({
    secret: secretKey, // Change this to a secret key for JWT signing
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true for HTTPS
  })
);




app.use('/user', UserRouter);
app.use('/notification', NotificationApi);


app.get('/register',(req, res)=>{
    res.render('register');
});



app.get('/login',(req, res)=>{
    res.render('login');
});

app.get('/', authenticateToken, (req, res)=>{
    //userId = '6511dd1380e82a1db12d6199';
    const userId = req.query.userId;
    loggedInUserId = userId;
    //const userId = req.params.userId;
    NotificationController.getNotifications(userId)
    .then((result)=>{
        if(result.status === 'SUCCESS'){
            const notifications = result.notifications;  
            console.log('Notifications: ',notifications);
            res.render('index',{notification:notifications});
        }else{
            console.error('Error fetching notifications: ',error);
            res.render('index',{notification:[]});
        }
    })
});

app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login'); // Redirect to the login page after logout
});


function sendNotificationsToLoggedInUser() {
    // Check if there is a logged-in user
    if (loggedInUserId) {
      // Customize the notification title and body here
      const title = 'New Notification';
      const body = 'This is a sample notification';
  
      // Call the sendNotification function for the logged-in user
      NotificationController.sendNotification(loggedInUserId, title, body)
        .then((result) => {
          if (result.status === 'SUCCESS') {
            console.log(`Notification sent to user ${loggedInUserId}`);
          } else {
            console.error(`Failed to send notification to user ${loggedInUserId}`);
          }
        })
        .catch((error) => {
          console.error(`Error sending notification to user ${loggedInUserId}: ${error}`);
        });
    }
  
    // Schedule the next round of notifications after 30 seconds
    setTimeout(sendNotificationsToLoggedInUser, 30000);
  };


  sendNotificationsToLoggedInUser();



app.listen(port, ()=>{
    console.log(`Server running on port ${port}`)
});