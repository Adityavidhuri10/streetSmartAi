import express from "express";
import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
} from "../controllers/propertyController.js";

import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import upload from "../config/multer.js";

const router = express.Router();

router
  .route("/")
  .get(getProperties)
  .post(
    protect,
    authorizeRoles("landlord"),
    upload.array("images", 10),
    createProperty
  );

router
  .route("/:id")
  .get(getPropertyById)
  .put(
    protect,
    authorizeRoles("landlord"),
    upload.array("images", 10),
    updateProperty
  )
  .delete(protect, authorizeRoles("landlord"), deleteProperty);

export default router;
