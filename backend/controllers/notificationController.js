const asyncHandler = require("express-async-handler");
const Notification = require("../models/notificationModel");

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .populate("sender", "name profilePicture")
        .populate({
            path: "relatedId",
            populate: {
                path: "property",
                select: "title images"
            }
        });

    res.json(notifications);
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        res.status(404);
        throw new Error("Notification not found");
    }

    // Ensure user owns the notification
    if (notification.recipient.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error("Not authorized");
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany(
        { recipient: req.user._id, read: false },
        { $set: { read: true } }
    );

    res.json({ message: "All notifications marked as read" });
});

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
};
