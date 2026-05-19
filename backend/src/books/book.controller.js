const mongoose = require("mongoose");
const Product = require("./book.model");
const { enrichBookRecord } = require("./book.enrichment");

const slugify = (value = "") =>
    value
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toFiniteNumber = (value) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : undefined;
};

const toBoolean = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.trim().toLowerCase() === "true";
    return undefined;
};

const pickFirstString = (...values) => {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) return value.trim();
    }
    return undefined;
};

const normalizeSeoPayload = (body = {}) => {
    const seoFromObject = body?.seo && typeof body.seo === "object" ? body.seo : {};
    const metaTitle = pickFirstString(seoFromObject.metaTitle, body.seoTitle, body.metaTitle);
    const metaDescription = pickFirstString(seoFromObject.metaDescription, body.metaDescription);
    const keywords = pickFirstString(seoFromObject.keywords, body.keywords);
    const ogTitle = pickFirstString(seoFromObject.ogTitle, body.ogTitle);
    const ogDescription = pickFirstString(seoFromObject.ogDescription, body.ogDescription);

    if (!metaTitle && !metaDescription && !keywords && !ogTitle && !ogDescription) {
        return undefined;
    }

    return {
        metaTitle: metaTitle || "",
        metaDescription: metaDescription || "",
        keywords: keywords || "",
        ogTitle: ogTitle || "",
        ogDescription: ogDescription || "",
    };
};

const mergeSeoPayload = (preferredSeo = {}, fallbackSeo = {}) => ({
    metaTitle: pickFirstString(preferredSeo?.metaTitle, fallbackSeo?.metaTitle) || "",
    metaDescription: pickFirstString(preferredSeo?.metaDescription, fallbackSeo?.metaDescription) || "",
    keywords: pickFirstString(preferredSeo?.keywords, fallbackSeo?.keywords) || "",
    ogTitle: pickFirstString(preferredSeo?.ogTitle, fallbackSeo?.ogTitle) || "",
    ogDescription: pickFirstString(preferredSeo?.ogDescription, fallbackSeo?.ogDescription) || "",
});

const normalizeBookPayload = (body = {}, options = {}) => {
    const { partial = false } = options;
    const payload = {};

    const title = pickFirstString(body.title, body.name);
    if (title !== undefined) {
        payload.title = title;
        payload.name = title;
    }

    const description = pickFirstString(body.description);
    if (description !== undefined) {
        payload.description = description;
    }

    const category = pickFirstString(body.category);
    if (category !== undefined) {
        payload.category = category.toLowerCase();
    }

    const newPrice = toFiniteNumber(body.newPrice ?? body.price);
    if (newPrice !== undefined) {
        payload.newPrice = newPrice;
        payload.price = newPrice;
    }

    const oldPrice = toFiniteNumber(body.oldPrice);
    if (oldPrice !== undefined) {
        payload.oldPrice = oldPrice;
    } else if (!partial && newPrice !== undefined) {
        payload.oldPrice = newPrice;
    }

    const coverFromImages = Array.isArray(body.images) && body.images.length > 0 ? body.images[0] : undefined;
    const coverImage = pickFirstString(body.coverImage, coverFromImages);
    if (coverImage !== undefined) {
        payload.coverImage = coverImage;
        payload.images = [coverImage];
    } else if (Array.isArray(body.images) && body.images.length > 0) {
        payload.images = body.images.filter((image) => typeof image === "string" && image.trim());
    }

    const stock = toFiniteNumber(body.stock);
    if (stock !== undefined) {
        payload.stock = stock;
    } else if (!partial) {
        payload.stock = 0;
    }

    const trending = toBoolean(body.trending);
    if (trending !== undefined) {
        payload.trending = trending;
    } else if (!partial) {
        payload.trending = false;
    }

    const rating = toFiniteNumber(body.rating);
    if (rating !== undefined) {
        payload.rating = rating;
    }

    const brand = pickFirstString(body.brand, body.author);
    if (brand !== undefined) {
        payload.brand = brand;
    }

    const author = pickFirstString(body.author);
    if (author !== undefined) {
        payload.author = author;
    }

    const isbn = pickFirstString(body.isbn);
    if (isbn !== undefined) {
        payload.isbn = isbn;
    }

    const language = pickFirstString(body.language);
    if (language !== undefined) {
        payload.language = language;
    }

    const format = pickFirstString(body.format);
    if (format !== undefined) {
        payload.format = format;
    }

    const publisher = pickFirstString(body.publisher);
    if (publisher !== undefined) {
        payload.publisher = publisher;
    }

    const seo = normalizeSeoPayload(body);
    if (seo) {
        payload.seo = seo;
    }

    if (!partial) {
        if (!payload.name || !payload.description || !payload.category) {
            throw new Error("Book title, description, and category are required.");
        }
        if (payload.newPrice === undefined) {
            throw new Error("Book price is required.");
        }
        if (!payload.coverImage) {
            payload.coverImage = "book-1.png";
            payload.images = [payload.coverImage];
        }
    }

    return payload;
};

const toClientBook = (productDoc) => {
    const raw = typeof productDoc?.toObject === "function" ? productDoc.toObject() : productDoc;
    if (!raw) return raw;

    const title = pickFirstString(raw.title, raw.name) || "Untitled Book";
    const newPrice = toFiniteNumber(raw.newPrice ?? raw.price) ?? 0;
    const oldPrice = toFiniteNumber(raw.oldPrice) ?? newPrice;
    const coverImage =
        pickFirstString(raw.coverImage, Array.isArray(raw.images) ? raw.images[0] : "") || "book-1.png";
    const normalizedImages =
        Array.isArray(raw.images) && raw.images.length > 0 ? raw.images : [coverImage];
    const seo = raw.seo || {};
    const brand = pickFirstString(raw.brand, raw.author) || "generic";

    return {
        ...raw,
        title,
        name: title,
        newPrice,
        price: toFiniteNumber(raw.price) ?? newPrice,
        oldPrice,
        coverImage,
        images: normalizedImages,
        trending: !!raw.trending,
        brand,
        isbn: raw.isbn || "",
        language: raw.language || "",
        format: raw.format || "",
        publisher: raw.publisher || "",
        seo: {
            metaTitle: seo.metaTitle || "",
            metaDescription: seo.metaDescription || "",
            keywords: seo.keywords || "",
            ogTitle: seo.ogTitle || "",
            ogDescription: seo.ogDescription || "",
        },
        seoTitle: seo.metaTitle || "",
        metaDescription: seo.metaDescription || "",
        keywords: seo.keywords || "",
        ogTitle: seo.ogTitle || "",
        ogDescription: seo.ogDescription || "",
    };
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
    const normalizedPayload = normalizeBookPayload(body, { partial: false });
    const enrichedPayload = enrichBookRecord(normalizedPayload, { forceDescription: true });
    const finalPayload = {
        ...normalizedPayload,
        ...enrichedPayload,
        seo: mergeSeoPayload(normalizedPayload.seo, enrichedPayload.seo),
    };
    const slug = await generateUniqueSlugFromInput(body?.slug, finalPayload?.name || finalPayload?.title);
    const newProduct = new Product({ ...finalPayload, slug });
    await newProduct.save();
    return newProduct;
};

const postAProduct = async (req, res) => {
    try {
        const newProduct = await createProductFromBody(req.body);
        return res.status(201).send({
            message: "Product posted successfully",
            product: toClientBook(newProduct),
        });
    } catch (error) {
        console.error("Error creating product", error);
        return res.status(400).send({ message: error?.message || "Failed to create product" });
    }
}

const searchProducts = async (req, res) => {
    try {
        const search = String(req.query.search || "").trim();
        if (search.length < 2) {
            return res.status(200).send([]);
        }

        const requestedLimit = Number(req.query.limit);
        const limit = Number.isFinite(requestedLimit)
            ? Math.min(Math.max(Math.floor(requestedLimit), 1), 20)
            : 8;

        const tokens = search
            .split(/\s+/)
            .map((token) => token.trim())
            .filter(Boolean)
            .slice(0, 6);

        const tokenClauses = tokens.map((token) => {
            const pattern = new RegExp(escapeRegex(token), "i");
            return {
                $or: [
                    { title: pattern },
                    { name: pattern },
                    { description: pattern },
                    { category: pattern },
                    { author: pattern },
                    { brand: pattern },
                    { isbn: pattern },
                    { language: pattern },
                    { format: pattern },
                    { publisher: pattern },
                    { slug: pattern },
                    { "seo.keywords": pattern },
                ],
            };
        });

        const query = tokenClauses.length > 0 ? { $and: tokenClauses } : {};

        const products = await Product.find(query)
            .sort({ trending: -1, createdAt: -1 })
            .limit(limit)
            .lean();

        return res.status(200).send(products.map((product) => toClientBook(product)));
    } catch (error) {
        console.error("Error searching products", error);
        return res.status(500).send({ message: "Failed to search products" });
    }
}

// get all products
const getAllProducts =  async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1});
        const normalizedProducts = [];
        for (const product of products) {
            const withSlug = await ensureProductSlug(product);
            normalizedProducts.push(toClientBook(withSlug));
        }
        return res.status(200).send(normalizedProducts)
        
    } catch (error) {
        console.error("Error fetching products", error);
        return res.status(500).send({message: "Failed to fetch products"})
    }
}

const getSingleProduct = async (req, res) => {
    try {
        const {id} = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({ message: "Invalid product id" });
        }
        const product =  await Product.findById(id);
        if(!product){
            return res.status(404).send({message: "Product not Found!"})
        }
        const withSlug = await ensureProductSlug(product);
        return res.status(200).send(toClientBook(withSlug))
        
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
        const withSlug = await ensureProductSlug(product);
        return res.status(200).send(toClientBook(withSlug));
    } catch (error) {
        console.error("Error fetching product by slug", error);
        return res.status(500).send({ message: "Failed to fetch product" });
    }
}

// update product data
const UpdateProduct = async (req, res) => {
    try {
        const {id} = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({ message: "Invalid product id" });
        }

        const existingProduct = await Product.findById(id);
        if(!existingProduct) {
            return res.status(404).send({message: "Product is not Found!"})
        }

        const updatePayload = normalizeBookPayload(req.body, { partial: true });

        if (updatePayload.seo) {
            updatePayload.seo = mergeSeoPayload(updatePayload.seo, existingProduct.seo || {});
        }

        const hasContentChange = ["title", "name", "description", "category", "author", "brand"].some(
            (field) => Object.prototype.hasOwnProperty.call(updatePayload, field)
        );

        if (hasContentChange) {
            const mergedPayload = {
                ...existingProduct.toObject(),
                ...updatePayload,
                seo: {
                    ...(existingProduct.seo || {}),
                    ...(updatePayload.seo || {}),
                },
            };

            const enrichedPayload = enrichBookRecord(mergedPayload, {
                forceDescription: Object.prototype.hasOwnProperty.call(updatePayload, "description"),
            });

            updatePayload.title = enrichedPayload.title;
            updatePayload.name = enrichedPayload.name;
            updatePayload.description = enrichedPayload.description;
            updatePayload.category = enrichedPayload.category;
            updatePayload.author = enrichedPayload.author;
            updatePayload.brand = enrichedPayload.brand;
            updatePayload.seo = mergeSeoPayload(updatePayload.seo, enrichedPayload.seo);
        }

        const hasSlugCandidate =
            typeof req.body?.slug === "string" ||
            typeof updatePayload?.name === "string" ||
            typeof updatePayload?.title === "string";

        if (hasSlugCandidate) {
            updatePayload.slug = await generateUniqueSlugFromInput(
                req.body?.slug,
                updatePayload?.name || updatePayload?.title,
                id
            );
        }

        if (Object.keys(updatePayload).length === 0) {
            return res.status(400).send({ message: "No valid product fields were provided." });
        }

        const updatedProduct =  await Product.findByIdAndUpdate(id, updatePayload, {
            new: true,
            runValidators: true,
        });
        return res.status(200).send({
            message: "Product updated successfully",
            product: toClientBook(updatedProduct)
        })
    } catch (error) {
        console.error("Error updating a product", error);
        return res.status(400).send({message: error?.message || "Failed to update a product"})
    }
}

const deleteAProduct = async (req, res) => {
    try {
        const {id} = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({ message: "Invalid product id" });
        }
        const deletedProduct = await Product.findByIdAndDelete(id);
        if(!deletedProduct) {
            return res.status(404).send({message: "Product is not found!"})
        }
        return res.status(200).send({
            message: "Product deleted successfully",
            product: toClientBook(deletedProduct)
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
            books: createdBooks.map((book) => toClientBook(book))
        });
    } catch (error) {
        console.error("Failed to seed dummy books", error);
        return res.status(500).json({ message: "Failed to seed dummy books" });
    }
};

const backfillBookSlugs = async (req, res) => {
    try {
        const books = await Product.find().sort({ createdAt: -1 });
        let updated = 0;

        for (const book of books) {
            if (book.slug && typeof book.slug === "string" && book.slug.trim()) continue;
            await ensureProductSlug(book);
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

const enrichBookInventory = async (req, res) => {
    try {
        const books = await Product.find().sort({ createdAt: -1 });
        const bulkOps = [];
        const sample = [];

        for (const bookDoc of books) {
            const current = typeof bookDoc.toObject === "function" ? bookDoc.toObject() : bookDoc;
            const enriched = enrichBookRecord(current, { forceDescription: true });
            const setPayload = {};

            const fields = ["title", "name", "description", "category", "author", "brand", "rating", "stock"];
            for (const field of fields) {
                const currentValue = current?.[field];
                const nextValue = enriched?.[field];
                const changed =
                    typeof currentValue === "number" || typeof nextValue === "number"
                        ? Number(currentValue) !== Number(nextValue)
                        : String(currentValue ?? "") !== String(nextValue ?? "");

                if (changed) {
                    setPayload[field] = nextValue;
                }
            }

            if (JSON.stringify(current?.seo || {}) !== JSON.stringify(enriched?.seo || {})) {
                setPayload.seo = enriched.seo;
            }

            if (Object.keys(setPayload).length === 0) continue;

            bulkOps.push({
                updateOne: {
                    filter: { _id: current._id },
                    update: { $set: setPayload },
                },
            });

            if (sample.length < 10) {
                sample.push({
                    title: enriched.title,
                    updatedFields: Object.keys(setPayload),
                });
            }
        }

        if (bulkOps.length > 0) {
            await Product.bulkWrite(bulkOps, { ordered: false });
        }

        return res.status(200).json({
            message: "Inventory enrichment completed",
            total: books.length,
            updated: bulkOps.length,
            sample,
        });
    } catch (error) {
        console.error("Failed to enrich inventory", error);
        return res.status(500).json({ message: "Failed to enrich inventory" });
    }
};

module.exports = {
    postAProduct,
    searchProducts,
    getAllProducts,
    getSingleProduct,
    getSingleProductBySlug,
    UpdateProduct,
    deleteAProduct,
    seedDummyBooks,
    backfillBookSlugs,
    enrichBookInventory
}
