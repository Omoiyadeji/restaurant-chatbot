const https = require('https');
const Order = require('../models/Order');

async function verifyPayment(reference, orderId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.paystack.co',
            port: 443,
            path: `/transaction/verify/${reference}`,
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            }
        };

        const req = https.request(options, res => {
            let data = '';

            res.on('data', chunk => {
                data += chunk;
            });

            res.on('end', async () => {
                try {
                    const response = JSON.parse(data);
                    if (response.data.status === 'success') {
                        await Order.findByIdAndUpdate(orderId, { status: 'paid' });
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', error => {
            reject(error);
        });

        req.end();
    });
}

module.exports = { verifyPayment };