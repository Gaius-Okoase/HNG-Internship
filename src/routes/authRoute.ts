import { Router } from 'express';
import {
  processGitHubCallbackController,
  getGitHubAuthUrlController,
  refreshTokenController,
  logoutController,
  processCliCallbackController,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/github', getGitHubAuthUrlController);
router.get('/github/callback', processGitHubCallbackController);
router.post('/github/cli/callback', processCliCallbackController)
router.post('/refresh', refreshTokenController);
router.post('/logout', authenticate, logoutController);

export default router;
