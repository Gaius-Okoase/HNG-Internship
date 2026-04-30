import express from 'express';
import {
  createProfileController,
  deleteProfileController,
  exportProfileController,
  //getProfileController,
  getAllProfileController,
  getProfilesByNaturalQuerySearchController,
} from '../controllers/profileController.js';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { authenticate, authorizeAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post(
  '/profiles',
  validateBody,
  authenticate,
  authorizeAdmin,
  createProfileController
);
//router.get('/profiles/:id', getProfileController);
router.get('/profiles', validateQuery, authenticate, getAllProfileController);
router.delete(
  '/profiles/:id',
  authenticate,
  authorizeAdmin,
  deleteProfileController
);
router.get(
  '/profiles/search',
  validateQuery,
  authenticate,
  getProfilesByNaturalQuerySearchController
);
router.get('/profiles/export', validateQuery, authenticate, exportProfileController);

export default router;
