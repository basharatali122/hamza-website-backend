// controller/product.controller.js
import Product from "../models/Products.js";
import ProductImage from "../models/ProductImage.js";

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      stock,
      categoryId,
      originalPrice,
      vendorId: bodyVendorId,
    } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    let vendorId = null;
    const role = req.user.role?.toLowerCase();

    if (role === "vendor") {
      if (!req.user.vendorId) {
        return res
          .status(403)
          .json({ error: "Vendor account not linked properly" });
      }
      vendorId = req.user.vendorId;
    } else if (role === "admin") {
      if (!bodyVendorId) {
        return res
          .status(400)
          .json({ error: "Admin must provide vendorId to create product" });
      }
      vendorId = bodyVendorId;
    } else {
      return res.status(403).json({ error: "Not authorized to create products" });
    }

    if (!categoryId) {
      return res.status(400).json({ error: "Category ID is required" });
    }

    const existingProduct = await Product.findOne({
      where: { name, vendorId },
    });
    if (existingProduct) {
      return res.status(400).json({
        error: "A product with this name already exists for this vendor",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      stock,
      categoryId,
      originalPrice: originalPrice || null,
      vendorId,
    });

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        await ProductImage.create({
          productId: product.productId,
          data: file.buffer,
          mimeType: file.mimetype,
          altText: `${name} image ${i + 1}`,
          isPrimary: i === 0,
        });
      }
    }

    return res.status(201).json({ message: "Product created", product });
  } catch (error) {
    console.error("Create Product Error:", error);
    return res.status(500).json({
      error: "Server error",
      errorDetails: error.message,
    });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [{ model: ProductImage, as: "images" }],
    });

    const productsWithImages = products.map((p) => {
      const product = p.toJSON();
      product.images = product.images.map((img) => ({
        ...img,
        data: `data:${img.mimeType};base64,${img.data.toString("base64")}`,
      }));
      return product;
    });

    return res.status(200).json({ products: productsWithImages });
  } catch (error) {
    console.error("Get Products Error:", error);
    return res
      .status(500)
      .json({ error: "Server error", errorDetails: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findByPk(productId, {
      include: [{ model: ProductImage, as: "images" }],
    });

    if (!product) return res.status(404).json({ error: "Product not found" });

    const productJSON = product.toJSON();
    productJSON.images = productJSON.images.map((img) => ({
      ...img,
      data: `data:${img.mimeType};base64,${img.data.toString("base64")}`,
    }));

    return res.status(200).json({ product: productJSON });
  } catch (error) {
    console.error("Get Product Error:", error);
    return res
      .status(500)
      .json({ error: "Server error", errorDetails: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, description, price, stock, categoryId, originalPrice } =
      req.body;

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.stock = stock !== undefined ? stock : product.stock;
    product.categoryId = categoryId || product.categoryId;
    product.originalPrice =
      originalPrice !== undefined ? originalPrice : product.originalPrice;

    await product.save();

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        await ProductImage.create({
          productId: product.productId,
          data: file.buffer,
          mimeType: file.mimetype,
          altText: `${name} updated image ${i + 1}`,
          isPrimary: i === 0,
        });
      }
    }

    return res.status(200).json({ message: "Product updated", product });
  } catch (error) {
    console.error("Update Product Error:", error);
    return res
      .status(500)
      .json({ error: "Server error", errorDetails: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    await product.destroy();
    return res.status(200).json({ message: "Product deleted", product });
  } catch (error) {
    console.error("Delete Product Error:", error);
    return res
      .status(500)
      .json({ error: "Server error", errorDetails: error.message });
  }
};