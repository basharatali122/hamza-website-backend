import ProductImage from "../models/ProductImage.js";
import Product from "../models/Products.js";

export const createProductImage = async (req, res) => {
  try {
    const { productId, imageUrl, altText } = req.body;

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const image = await ProductImage.create({ productId, imageUrl, altText });
    return res
      .status(201)
      .json({ message: "Image added successfully", image });
  } catch (error) {
    console.error("Create ProductImage Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getProductImages = async (req, res) => {
  try {
    const { productId } = req.params;
    const images = await ProductImage.findAll({ where: { productId } });
    return res.status(200).json({ images });
  } catch (error) {
    console.error("Get ProductImages Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const deleteProductImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const image = await ProductImage.findByPk(imageId);
    if (!image) return res.status(404).json({ error: "Image not found" });

    await image.destroy();
    return res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Delete ProductImage Error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};