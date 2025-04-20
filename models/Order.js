const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true
    },
    items: [{
        id: Number,
        name: String,
        price: Number,
        quantity: Number
    }],
    total: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'placed', 'paid', 'cancelled'],
        default: 'pending'
    },
    scheduledFor: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', OrderSchema);