const mongoose = require("mongoose");
const Product = require("./book.model");
const MIN_PRICE = 400;
const MAX_PRICE = 900;
const slugify = (value = "") =>
    value
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

const isValidPriceRange = (oldPrice, newPrice) => {
    const oldNum = Number(oldPrice);
    const newNum = Number(newPrice);
    return (
        Number.isFinite(oldNum) &&
        Number.isFinite(newNum) &&
        oldNum >= MIN_PRICE &&
        oldNum <= MAX_PRICE &&
        newNum >= MIN_PRICE &&
        newNum <= MAX_PRICE
    );
};

const generateUniqueSlug = async (name, excludeId = null) => {
    const baseSlug = slugify(name) || "product";
    let candidate = baseSlug;
    let counter = 1;

    while (true) {
        const existing = await Product.findOne({ slug: candidate });
        if (!existing || (excludeId && existing._id.toString() === excludeId.toString())) {
            return candidate;
        }
        candidate = `${baseSlug}-${counter}`;
        counter += 1;
    }
};

const generateUniqueSlugFromInput = async (slugInput, nameFallback, excludeId = null) => {
    const base = slugify(slugInput || nameFallback || "");
    return generateUniqueSlug(base || "product", excludeId);
};

const ensureProductSlug = async (productDoc) => {
    if (!productDoc) return productDoc;
    if (productDoc.slug && typeof productDoc.slug === "string" && productDoc.slug.trim()) {
        return productDoc;
    }
    const uniqueSlug = await generateUniqueSlug(productDoc.name || "product", productDoc._id);
    productDoc.slug = uniqueSlug;
    await productDoc.save();
    return productDoc;
};

const createProductFromBody = async (body) => {
    const slug = await generateUniqueSlugFromInput(body?.slug, body?.name);
    const newProduct = new Product({ ...body, slug });
    await newProduct.save();
    return newProduct;
};

const postAProduct = async (req, res) => {
    try {
        const newProduct = await createProductFromBody(req.body);
        return res.status(200).send({ message: "Product posted successfully", product: newProduct });
    } catch (error) {
        console.error("Error creating product", error);
        return res.status(500).send({ message: "Failed to create product" });
    }
}

// get all products
const getAllProducts =  async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1});
        for (const product of products) {
            await ensureProductSlug(product);
        }
        return res.status(200).send(products)
        
    } catch (error) {
        console.error("Error fetching products", error);
        return res.status(500).send({message: "Failed to fetch products"})
    }
}

const getSingleProduct = async (req, res) => {
    try {
        const {id} = req.params;
        const product =  await Product.findById(id);
        if(!product){
            return res.status(404).send({message: "Product not Found!"})
        }
        await ensureProductSlug(product);
        return res.status(200).send(product)
        
    } catch (error) {
        console.error("Error fetching product", error);
        return res.status(500).send({message: "Failed to fetch product"})
    }

}

const getSingleProductBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const bySlugOrId = [{ slug }];
        if (mongoose.Types.ObjectId.isValid(slug)) {
            bySlugOrId.push({ _id: slug });
        }
        const product = await Product.findOne({ $or: bySlugOrId });
        if (!product) {
            return res.status(404).send({ message: "Product not Found!" });
        }
        await ensureProductSlug(product);
        return res.status(200).send(product);
    } catch (error) {
        console.error("Error fetching product by slug", error);
        return res.status(500).send({ message: "Failed to fetch product" });
    }
}

// update product data
const UpdateProduct = async (req, res) => {
    try {
        const {id} = req.params;
        const updatePayload = { ...req.body };
        updatePayload.slug = await generateUniqueSlugFromInput(req.body?.slug, req.body?.name, id);
        const updatedProduct =  await Product.findByIdAndUpdate(id, updatePayload, {new: true});
        if(!updatedProduct) {
            return res.status(404).send({message: "Product is not Found!"})
        }
        return res.status(200).send({
            message: "Product updated successfully",
            product: updatedProduct
        })
    } catch (error) {
        console.error("Error updating a product", error);
        return res.status(500).send({message: "Failed to update a product"})
    }
}

const deleteAProduct = async (req, res) => {
    try {
        const {id} = req.params;
        const deletedProduct = await Product.findByIdAndDelete(id);
        if(!deletedProduct) {
            return res.status(404).send({message: "Product is not found!"})
        }
        return res.status(200).send({
            message: "Product deleted successfully",
            product: deletedProduct
        })
    } catch (error) {
        console.error("Error deleting a product", error);
        return res.status(500).send({message: "Failed to delete a product"})
    }
};

// Seed 10–12 dummy books for initial demo/testing
const seedDummyBooks = async (req, res) => {
    try {
        const seedBooks = [
            {
                name: "Business Foundations 101",
                description: "A practical introduction to core business concepts, strategy, and decision-making frameworks.",
                price: 18,
                category: "business",
                stock: 50,
                images: ["book-1.png"],
                trending: true
            },
            {
                name: "Technology Trends: 2026 Edition",
                description: "Explore the most impactful technology trends shaping product development, AI adoption, and modern systems.",
                price: 33,
                category: "technology",
                stock: 30,
                images: ["book-2.png"],
                trending: true
            },
            {
                name: "Fictional Realms: The Atlas of Stories",
                description: "A curated journey through genres and themes, designed to inspire readers and writers alike.",
                price: 14,
                category: "fiction",
                stock: 40,
                images: ["book-3.png"],
                trending: false
            },
            {
                name: "Horror Nights: Tales for the Brave",
                description: "Short horror narratives with eerie pacing and unforgettable twists.",
                price: 16,
                category: "horror",
                stock: 25,
                images: ["book-4.png"],
                trending: true
            },
            {
                name: "Adventure Compass: Journeys Beyond",
                description: "Learn how to plan adventures, build resilience, and embrace the unknown with confidence.",
                price: 22,
                category: "adventure",
                stock: 35,
                images: ["book-5.png"],
                trending: false
            },
            {
                name: "Business Analytics Playbook",
                description: "Turn data into decisions with clear examples of dashboards, metrics, and experimentation.",
                price: 28,
                category: "business",
                stock: 45,
                images: ["book-6.png"],
                trending: false
            },
            {
                name: "Modern Software Architecture",
                description: "Understand scalable architecture patterns for web apps, services, and distributed systems.",
                price: 39,
                category: "technology",
                stock: 20,
                images: ["book-7.png"],
                trending: true
            },
            {
                name: "Fiction for Focus: Character & Conflict",
                description: "A writing guide to craft compelling characters and keep tension alive throughout the story.",
                price: 12,
                category: "fiction",
                stock: 60,
                images: ["book-8.png"],
                trending: false
            },
            {
                name: "Horror Craft: Atmosphere Techniques",
                description: "Learn how to build dread through language, structure, and pacing - without relying on cliches.",
                price: 17,
                category: "horror",
                stock: 30,
                images: ["book-9.png"],
                trending: true
            },
            {
                name: "Adventure Skills & Safety",
                description: "Essential outdoor skills, risk planning, and preparation checklists for memorable trips.",
                price: 25,
                category: "adventure",
                stock: 40,
                images: ["book-10.png"],
                trending: false
            },
            {
                name: "Startup Strategy Sprint",
                description: "A step-by-step guide to validating ideas, finding product-market fit, and scaling sustainably.",
                price: 34,
                category: "business",
                stock: 25,
                images: ["book-11.png"],
                trending: true
            },
            {
                name: "Tech Careers: Building Your Path",
                description: "A practical roadmap for improving skills, building portfolios, and advancing in tech.",
                price: 26,
                category: "technology",
                stock: 50,
                images: ["book-12.png"],
                trending: false
            },
            {
                name: "Mystery Novels: Classic Whodunits",
                description: "Timeless mystery stories with intricate plots and surprising endings.",
                price: 20,
                category: "mystery",
                stock: 35,
                images: ["book-13.png"],
                trending: true
            },
            {
                name: "Romance Stories: Heartfelt Tales",
                description: "Emotional journeys of love, loss, and redemption.",
                price: 15,
                category: "romance",
                stock: 40,
                images: ["book-14.png"],
                trending: false
            },
            {
                name: "Science Fiction Adventures",
                description: "Explore futuristic worlds and advanced technologies in thrilling narratives.",
                price: 25,
                category: "science fiction",
                stock: 30,
                images: ["book-15.png"],
                trending: true
            },
            {
                name: "Biography: Inspiring Lives",
                description: "Stories of remarkable individuals who changed the world.",
                price: 30,
                category: "biography",
                stock: 25,
                images: ["book-16.png"],
                trending: false
            },
            {
                name: "Self-Help: Personal Growth",
                description: "Guides to improve yourself, achieve goals, and live better.",
                price: 18,
                category: "self-help",
                stock: 45,
                images: ["book-17.png"],
                trending: true
            },
            {
                name: "History: Ancient Civilizations",
                description: "Dive into the past with tales of empires and discoveries.",
                price: 28,
                category: "history",
                stock: 20,
                images: ["book-18.png"],
                trending: false
            },
            {
                name: "Poetry Collection",
                description: "A compilation of beautiful verses from renowned poets.",
                price: 12,
                category: "poetry",
                stock: 50,
                images: ["book-19.png"],
                trending: true
            },
            {
                name: "Children's Stories",
                description: "Fun and educational tales for young readers.",
                price: 10,
                category: "children",
                stock: 60,
                images: ["book-20.png"],
                trending: false
            }
        ];

        const createdBooks = [];

        for (const bookBody of seedBooks) {
            const existing = await Product.findOne({ name: bookBody.name });
            if (existing) continue;
            const created = await createProductFromBody(bookBody);
            createdBooks.push(created);
        }

        return res.status(201).json({
            message: "Dummy books seeded successfully",
            seeded: createdBooks.length,
            books: createdBooks
        });
    } catch (error) {
        console.error("Failed to seed dummy books", error);
        return res.status(500).json({ message: "Failed to seed dummy books" });
    }
};

const backfillBookSlugs = async (req, res) => {
    try {
        const books = await Book.find().sort({ createdAt: -1 });
        let updated = 0;

        for (const book of books) {
            if (book.slug && typeof book.slug === "string" && book.slug.trim()) continue;
            await ensureBookSlug(book);
            updated += 1;
        }

        return res.status(200).json({
            message: "Book slug backfill completed",
            total: books.length,
            updated
        });
    } catch (error) {
        console.error("Failed to backfill book slugs", error);
        return res.status(500).json({ message: "Failed to backfill book slugs" });
    }
};

module.exports = {
    postAProduct,
    getAllProducts,
    getSingleProduct,
    getSingleProductBySlug,
    UpdateProduct,
    deleteAProduct,
    seedDummyBooks,
    backfillBookSlugs
}