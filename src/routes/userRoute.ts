import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getUserController, makeAdminController } from "../controllers/userController.js";

const router = Router();

router.patch('/:id/role', authenticate, makeAdminController);
router.get('/data', authenticate, getUserController);

export default router;