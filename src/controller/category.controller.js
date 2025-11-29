import Category from "../models/Category.js";

const categoryController = {
  createCategory: async (req, res) => {
    try {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }
      const category = await Category.create({ name, description });
      return res.status(201).json({ message: "Category created", category });
    } catch (error) {
      console.error("Category Creation Error:", error);
      return res.status(500).json({ error: "Server error", details: error.message });
    }
  },

  getCategories: async (req, res) => {
    try {
      const categories = await Category.findAll();
      return res.status(200).json({ categories });
    } catch (error) {
      console.error("Get Categories Error:", error);
      return res.status(500).json({ error: "Server error" });
    }
  },

  getCategoryById: async (req, res) => {
    try {
      const { id } = req.params;
      const category = await Category.findByPk(id);
      if (!category)
        return res.status(404).json({ error: "Category not found" });

      return res.status(200).json({ category });
    } catch (error) {
      console.error("Get Category Error:", error);
      return res.status(500).json({ error: "Server error" });
    }
  },
};

export default categoryController;
