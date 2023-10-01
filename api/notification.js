const express = require('express');
const router = express.Router();
const notificationController = require('./../controllers/notificationController');

// Route to send a notification
router.post('/send', notificationController.authenticateToken,  (req, res) => {

  console.log('Received a POST request to /notification/send');

  const { userId, title, body } = req.body;

  if (!userId || !title || !body) {
    console.log('Missing required fields in the request');
    res.json({
      status: 'FAILED',
      message: 'Missing required fields',
    });
  } else {
    console.log('Request data:', req.body);
    // Call the sendNotification function from the controller
    notificationController.sendNotification(userId, title, body, res);
  }
});

// Route to get notifications for a user
router.get('/get/:userId', (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    res.json({
      status: 'FAILED',
      message: 'Missing required fields',
    });
  } else {
    // Call the getNotifications function from the controller
    notificationController.getNotifications(userId, res);
  }
});

// Route to read a notification
router.get('/read/:notificationId', (req, res) => {
  const { notificationId } = req.params;

  if (!notificationId) {
    res.json({
      status: 'FAILED',
      message: 'Missing required fields',
    });
  } else {
    // Call the readNotification function from the controller
    notificationController.readNotification(notificationId, res);
  }
});

// Route to delete a notification
router.get('/delete/:notificationId', (req, res) => {
  const { notificationId } = req.params;

  if (!notificationId) {
    res.json({
      status: 'FAILED',
      message: 'Missing required fields',
    });
  } else {
    // Call the deleteNotification function from the controller
    notificationController.deleteNotification(notificationId, res);
  }
});


router.delete('/deleteAll/:userId', notificationController.authenticateToken, (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    res.json({
      status: 'FAILED',
      message: 'Missing required fields',
    });
  } else {
    // Call the deleteAllNotifications function from the controller
    notificationController.deleteAllNotifications(userId, res);
  }
});



module.exports = router;
