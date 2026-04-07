const mongoose =  require('mongoose');

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        default: '',
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description:  {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    oldPrice: {
        type: Number,
        min: 0,
        default: 0,
    },
    newPrice: {
        type: Number,
        min: 0,
        default: 0,
    },
    category:  {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
    },
    coverImage: {
        type: String,
        default: 'book-1.png',
    },
    images: [{
        type: String,
    }],
    trending: {
        type: Boolean,
        default: false,
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
    },
    author: {
        type: String,
        default: 'admin',
    },
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

    productSchema.pre('validate', function(next) {
        const preferredTitle = (this.title || this.name || '').trim();
        if (preferredTitle) {
            this.title = preferredTitle;
            this.name = preferredTitle;
        }

        const candidateNewPrice = Number.isFinite(Number(this.newPrice)) ? Number(this.newPrice) : Number(this.price);
        const candidatePrice = Number.isFinite(Number(this.price)) ? Number(this.price) : candidateNewPrice;
        if (Number.isFinite(candidatePrice)) {
            this.price = candidatePrice;
            this.newPrice = Number.isFinite(candidateNewPrice) ? candidateNewPrice : candidatePrice;
        }

        const candidateOldPrice = Number(this.oldPrice);
        this.oldPrice = Number.isFinite(candidateOldPrice) ? candidateOldPrice : this.newPrice;

        const coverFromImages = Array.isArray(this.images) && this.images.length > 0 ? this.images[0] : '';
        const resolvedCoverImage = (this.coverImage || coverFromImages || 'book-1.png').toString().trim();
        this.coverImage = resolvedCoverImage;
        this.images = Array.isArray(this.images) && this.images.length > 0
            ? this.images
            : [resolvedCoverImage];

        next();
    });

    const Product = mongoose.model('Product', productSchema, 'books');

  module.exports = Product;