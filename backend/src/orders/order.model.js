const mongoose =  require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
    },
    address: {
        street: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        country: String,
        state: String,
        zipcode: String,
    },
    phone: {
        type: Number,
        required: true,
    },
    productIds:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        }
    ],
    totalPrice: {
        type: Number,
        required: true,
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
            },
            price: {
                type: Number,
                required: true,
            },
            title: {
                type: String,
                default: '',
            },
            coverImage: {
                type: String,
                default: '',
            },
        }
    ],
    coupon: {
        code: {
            type: String,
            trim: true,
            uppercase: true,
        },
        percent: {
            type: Number,
            min: 0,
            max: 100,
        },
        discountAmount: {
            type: Number,
            min: 0,
        },
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered'],
        default: 'pending',
    }
}, {
    timestamps: true,
})

const Order =  mongoose.model('Order', orderSchema);

module.exports = Order;