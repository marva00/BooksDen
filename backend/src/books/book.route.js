const express = require('express');
const Product = require('./book.model');
const { postAProduct, getAllProducts, getSingleProduct, getSingleProductBySlug, UpdateProduct, deleteAProduct, seedDummyBooks, backfillBookSlugs, enrichBookInventory } = require('./book.controller');
const verifyAdminToken = require('../middleware/verifyAdminToken');
const router =  express.Router();

// frontend => backend server => controller => book schema  => database => send to server => back to the frontend
//post = when submit something fronted to db
// get =  when get something back from db
// put/patch = when edit or update something
// delete = when delete something

// post a product
router.post("/create-book", verifyAdminToken, postAProduct)

// seed dummy books (admin only)
router.post("/seed-dummy-books", verifyAdminToken, seedDummyBooks);

// backfill slugs for old books (admin only)
router.post("/backfill-slugs", verifyAdminToken, backfillBookSlugs);

// enrich existing inventory metadata for better AI/chatbot quality (admin only)
router.post("/enrich-inventory", verifyAdminToken, enrichBookInventory);

// get all products
router.get("/", getAllProducts);

// single product endpoint by slug
router.get("/slug/:slug", getSingleProductBySlug);

// single product endpoint
router.get("/:id", getSingleProduct);

// update a product endpoint
router.put("/edit/:id", verifyAdminToken, UpdateProduct);

router.delete("/:id", verifyAdminToken, deleteAProduct)


module.exports = router;
