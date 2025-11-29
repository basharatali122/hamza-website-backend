// controllers/vendor.controller.js
import Vendor from "../models/Vendors.js";

export const createVendor = async (req, res) => {
  try {
    let { name, description, contactEmail, contactPhone, status } = req.body;

    status = status.trim().toLowerCase();

    const vendor = await Vendor.create({
      name,
      description,
      contactEmail,
      contactPhone,
      status,
    });

    return res.status(201).json({ success: true, vendor });
  } catch (error) {
    console.error("Error creating vendor:", error);

    if (error.name === "SequelizeDatabaseError") {
      return res.status(400).json({ success: false, message: "Invalid value for status field" });
    }

    return res.status(500).json({ success: false, message: "Failed to create vendor" });
  }
};

export const getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.findAll();
    return res.status(200).json({ success: true, vendors });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch vendors" });
  }
};

export const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findByPk(id);

    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    return res.status(200).json({ success: true, vendor });
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch vendor" });
  }
};

export const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, contactEmail, contactPhone, website, status } = req.body;

    const vendor = await Vendor.findByPk(id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    await vendor.update({
      name,
      description,
      contactEmail,
      contactPhone,
      website,
      status,
    });

    return res.status(200).json({ success: true, vendor });
  } catch (error) {
    console.error("Error updating vendor:", error);
    return res.status(500).json({ success: false, message: "Failed to update vendor" });
  }
};

export const deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findByPk(id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    await vendor.destroy();

    return res.status(200).json({ success: true, message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    return res.status(500).json({ success: false, message: "Failed to delete vendor" });
  }
};