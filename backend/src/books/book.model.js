const mongoose =  require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description:  {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    category:  {
        type: String,
        required: true,
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
    },
    images: [{
        type: String,
        required: true,
    }],
    slug: {
        type: String,
        required: true,
        unique: true,
        index: true,
        sparse: true,
    },
    seo: {
        metaTitle: {
            type: String,
            default: "",
        },
        metaDescription: {
            type: String,
            default: "",
        },
        keywords: {
            type: String,
            default: "",
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
  }, {
    timestamps: true,
  });

  const Product = mongoose.model('Product', productSchema);

  module.exports = Product;