require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { verifyPayment } = require('./utils/paymentHandler');
const handleMessage = require('./utils/messageHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Update the mongoose.connect call
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use(express.static('public'));
app.use(express.json());

// Models and routes will be added here
const Order = require('./models/Order');
const Session = require('./models/Session');

// Menu items
const menuItems = [
    { id: 1, name: 'Classic Burger', price: 12.99 },
    { id: 2, name: 'Chicken Wings', price: 10.99 },
    { id: 3, name: 'Pizza Margherita', price: 14.99 },
    { id: 4, name: 'Caesar Salad', price: 8.99 },
    { id: 5, name: 'Pasta Carbonara', price: 13.99 }
];

io.on('connection', (socket) => {
    socket.on('chatMessage', async ({ message, sessionId }) => {
        try {
            let session = await Session.findOne({ sessionId });
            if (!session) {
                session = await Session.create({ sessionId });
            }

            // Handle different message options
            const response = await handleMessage(message, session);
            socket.emit('botResponse', response);
        } catch (error) {
            console.error(error);
            socket.emit('botResponse', { message: 'An error occurred' });
        }
    });
    
    // Add this to your socket.io connection handler
    socket.on('paymentVerification', async ({ reference, orderId }) => {
        try {
            const isSuccess = await verifyPayment(reference, orderId);
            if (isSuccess) {
                socket.emit('paymentSuccess');
            }
        } catch (error) {
            console.error('Payment verification failed:', error);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});