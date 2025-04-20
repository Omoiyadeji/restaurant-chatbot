const Order = require('../models/Order');
const Session = require('../models/Session');

const menuItems = [
    { id: 1, name: 'Classic Burger', price: 12.99 },
    { id: 2, name: 'Chicken Wings', price: 10.99 },
    { id: 3, name: 'Pizza Margherita', price: 14.99 },
    { id: 4, name: 'Caesar Salad', price: 8.99 },
    { id: 5, name: 'Pasta Carbonara', price: 13.99 }
];

async function handleMessage(message, session) {
    switch (message) {
        case '1':
            return {
                message: `Please select an item from our menu:\n${menuItems.map(item => 
                    `${item.id}: ${item.name} - $${item.price}`
                ).join('\n')}`
            };

        case '99':
            const currentOrder = await Order.findById(session.currentOrder);
            if (!currentOrder || currentOrder.status !== 'pending') {
                return { message: 'No order to place' };
            }
            
            currentOrder.status = 'placed';
            await currentOrder.save();
            session.orderHistory.push(currentOrder);
            session.currentOrder = null;
            await session.save();

            return {
                message: 'Order placed successfully! Proceeding to payment...',
                requirePayment: true,
                orderId: currentOrder._id,
                amount: currentOrder.total
            };

        case '98':
            const history = await Session.findOne({ sessionId: session.sessionId })
                .populate('orderHistory');
            
            if (!history.orderHistory.length) {
                return { message: 'No order history found' };
            }

            const historyMessage = history.orderHistory.map(order => 
                `Order #${order._id}:\n${order.items.map(item => 
                    `${item.name} - $${item.price}`
                ).join('\n')}\nTotal: $${order.total}\nStatus: ${order.status}`
            ).join('\n\n');

            return { message: `Your order history:\n${historyMessage}` };

        case '97':
            const order = await Order.findById(session.currentOrder);
            if (!order || order.status !== 'pending') {
                return { message: 'No current order' };
            }

            const orderDetails = `Current Order:\n${order.items.map(item => 
                `${item.name} - $${item.price}`
            ).join('\n')}\nTotal: $${order.total}`;

            return { message: orderDetails };

        case '0':
            if (!session.currentOrder) {
                return { message: 'No order to cancel' };
            }

            await Order.findByIdAndUpdate(session.currentOrder, { status: 'cancelled' });
            session.currentOrder = null;
            await session.save();

            return { message: 'Order cancelled successfully' };

        default:
            // Handle menu item selection
            const selectedItem = menuItems.find(item => item.id === parseInt(message));
            if (selectedItem) {
                let order = await Order.findById(session.currentOrder);
                if (!order) {
                    order = await Order.create({
                        sessionId: session.sessionId,
                        items: [{ ...selectedItem, quantity: 1 }],
                        total: selectedItem.price
                    });
                    session.currentOrder = order._id;
                    await session.save();
                } else {
                    order.items.push({ ...selectedItem, quantity: 1 });
                    order.total = order.items.reduce((sum, item) => sum + item.price, 0);
                    await order.save();
                }

                return {
                    message: `Added ${selectedItem.name} to your order.\n\nSelect:\n1: Add more items\n99: Checkout\n97: View current order\n0: Cancel order`
                };
            }

            return {
                message: `Invalid selection. Please choose:\n1: Place an order\n99: Checkout order\n98: See order history\n97: See current order\n0: Cancel order`
            };
    }
}

module.exports = handleMessage;