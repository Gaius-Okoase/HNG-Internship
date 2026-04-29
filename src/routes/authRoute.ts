import { Router } from "express";
import { processGitHubCallbackController, getGitHubAuthUrlController, refreshTokenController, logoutController } from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get('/github', getGitHubAuthUrlController);
router.get('/github/callback', processGitHubCallbackController);
router.post('/refresh', refreshTokenController);
router.post('/logout', authenticate, logoutController);

export default router;