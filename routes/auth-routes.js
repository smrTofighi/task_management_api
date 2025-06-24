const experss = require("express");
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  uploadImage
} = require("../controllers/auth-controller");
const { protect } = require("../middlewares/auth-middleware");
const upload = require("../middlewares/upload-middleware");
const router = experss.Router();

//! Auth Routes
router.post("/register", registerUser); //? Register a new user
router.post("/login", loginUser); //? Login a user
router.get("/profile", protect, getUserProfile); //? Get user profile
router.put("/profile", protect, updateUserProfile); //? Update user profile

router.post(
  "/upload-image",
  upload.single("image"),
  uploadImage
);

module.exports = router;
