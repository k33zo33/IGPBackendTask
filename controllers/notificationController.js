const Notification = require('./../models/notification');
const User = require('./../models/user');
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const path = require('path');
const jwt = require('jsonwebtoken');
const secretKey = process.env.SECRET_KEY;

// Function to send a notification
// const sendNotification = (userId, title, body, res) => {
//   User.findById(userId)
//     .then((user) => {
//       if (!user) {
//         res.json({
//           status: 'FAILED',
//           message: 'User not found',
//         });
//       } else {
//         const newNotification = new Notification({
//           recipientId: userId,
//           title,
//           body,
//           timestamp: Date.now(),
//           isRead: false
//         });

//         newNotification
//           .save()
//           .then((result) => {
//             res.json({
//               status: 'SUCCESS',
//               message: 'Notification saved successfully',
//             });
//           })
//           .catch((err) => {
//             res.json({
//               status: 'FAILED',
//               message: 'An error occurred while saving the notification',
//             });
//           });
//       }
//     })
//     .catch((err) => {
//       res.json({
//         status: 'FAILED',
//         message: 'An error occurred while finding the user',
//       });
//     });
// };


const sendNotification = (userId, title, body) => {
  return new Promise((resolve, reject) => {
    User.findById(userId)
      .then((user) => {
        if (!user) {
          reject({
            status: 'FAILED',
            message: 'User not found',
          });
        } else {
          const newNotification = new Notification({
            recipientId: userId,
            title,
            body,
            timestamp: Date.now(),
            isRead: false,
          });

          newNotification
            .save()
            .then((result) => {
              resolve({
                status: 'SUCCESS',
                message: 'Notification saved successfully',
              });
            })
            .catch((err) => {
              reject({
                status: 'FAILED',
                message: 'An error occurred while saving the notification',
              });
            });
        }
      })
      .catch((err) => {
        reject({
          status: 'FAILED',
          message: 'An error occurred while finding the user',
        });
      });
  });
};


// Function to get notifications for a user
const getNotifications = (userId, res) => {
  return new Promise((resolve, reject) => {
    Notification.find({ recipientId: userId })
      .sort({ timestamp: -1 }) // Sort by timestamp in descending order
      .then((notifications) => {
        resolve({
          status: 'SUCCESS',
          notifications,
        });
      })
      .catch((err) => {
        reject({
          status: 'FAILED',
          message: 'An error occurred while retrieving notifications',
        });
      });
  });
};

// Function to read a notification
const readNotification = (notificationId, res) => {
  Notification.findByIdAndUpdate(notificationId, { $set: { isRead: true } })
    .then(() => {
      res.json({
        status: 'SUCCESS',
        message: 'Notification marked as read',
      });
    })
    .catch((err) => {
      res.json({
        status: 'FAILED',
        message: 'An error occurred while marking the notification as read',
      });
    });
};

// Function to delete a notification
const deleteNotification = (notificationId, res) => {
  Notification.findByIdAndRemove(notificationId)
    .then(() => {
      res.json({
        status: 'SUCCESS',
        message: 'Notification deleted successfully',
      });
    })
    .catch((err) => {
      res.json({
        status: 'FAILED',
        message: 'An error occurred while deleting the notification',
      });
    });
};

const authenticateToken = (req, res, next)=>{
  const token = req.headers['authorization'];

  if(token==null){
      return res.json({
        status: 'FAILED',
        message: 'Unauthorized',
    });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.json({
        status: 'FAILED',
        message: 'Invalid token',
    });
    }
    req.user = user;
    next();
});

}

const deleteAllNotifications = (userId, res) => {
  Notification.deleteMany({ recipientId: userId })
    .then(() => {
      res.json({
        status: 'SUCCESS',
        message: 'All notifications deleted successfully',
      });
    })
    .catch((err) => {
      res.json({
        status: 'FAILED',
        message: 'An error occurred while deleting notifications',
      });
    });
};

module.exports = {
  sendNotification,
  getNotifications,
  readNotification,
  deleteNotification,
  authenticateToken,
  deleteAllNotifications
};
