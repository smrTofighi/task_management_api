const express = require("express");
const { protect, adminOnly } = require("../middlewares/auth-middleware");
const { exportTasksReport, exportUsersReport } = require("../controllers/report-controller");
const router = express.Router();

router.get("/export/tasks", protect, adminOnly, exportTasksReport);
router.get("/export/users", protect, adminOnly, exportUsersReport);


module.exports = router;