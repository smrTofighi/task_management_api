const experss = require("express");

const router = experss.Router();
const {protect, adminOnly} = require('../middlewares/auth-middleware');
const {getUsers, getUserById} = require('../controllers/user-controller');
//! User Management Routes
router.get("/", protect, adminOnly, getUsers); //* Get all users (Admin Only can)
router.get("/:id", protect, getUserById); //* Get a specific user



module.exports = router;