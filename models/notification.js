const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
    title: String,
    body: String, // Notification content or message
    recipientId: mongoose.Schema.Types.ObjectId, // Reference to the user receiving the notification
    timestamp: Date,
    isRead: Boolean
});

const Notification = mongoose.model('Notification', NotificationSchema);

module.exports = Notification;

