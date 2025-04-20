const socket = io();
let sessionId = localStorage.getItem('sessionId') || Date.now().toString();
localStorage.setItem('sessionId', sessionId);

const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');

// Initial bot message
window.onload = () => {
    displayBotMessage(`Welcome to our Restaurant! Please select an option:
    1: Place an order
    99: Checkout order
    98: See order history
    97: See current order
    0: Cancel order`);
};

function displayMessage(message, isBot = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isBot ? 'bot-message' : 'user-message'}`;
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function displayBotMessage(message) {
    displayMessage(message, true);
}

function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    displayMessage(message);
    socket.emit('chatMessage', { message, sessionId });
    userInput.value = '';
}

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

socket.on('botResponse', (response) => {
    displayBotMessage(response.message);
    
    if (response.requirePayment) {
        initializePayment(response.orderId, response.amount);
    }
});

function initializePayment(orderId, amount) {
    const handler = PaystackPop.setup({
        key: 'your_paystack_public_key',
        email: 'customer@example.com',
        amount: amount * 100,
        ref: `ord_${orderId}_${Math.floor(Math.random() * 1000000)}`,
        callback: function(response) {
            socket.emit('paymentVerification', {
                reference: response.reference,
                orderId: orderId
            });
        }
    });
    handler.openIframe();
}

socket.on('paymentSuccess', () => {
    displayBotMessage('Payment successful! Thank you for your order.');
});