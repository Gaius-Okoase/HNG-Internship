import type { Request, Response, NextFunction } from 'express';
import type { CreatedProfile } from '../types/types.js';
import type { QueryOptionsSchema } from '../types/types.js';
import {
  createProfileService,
  deleteProfileService,
  getAllProfileService,
  getProfilesByNaturalQuerySearchService,
  getProfileService,
} from '../services/profileService.js';

export const createProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name } = req.body as { name: string };

    const createdProfile: CreatedProfile = await createProfileService(name);

    res.status(201).json(createdProfile);
  } catch (error) {
    next(error);
  }
};

export const getProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    const profile: CreatedProfile = await getProfileService(id);

    res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};

export const getAllProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query: QueryOptionsSchema = req.query;

    const allProfiles = await getAllProfileService(query);

    res.status(200).json(allProfiles);
  } catch (error) {
    next(error);
  }
};

export const deleteProfileController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;

    await deleteProfileService(id);

    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

export const getProfilesByNaturalQuerySearchController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query: QueryOptionsSchema = req.query;

    const profiles = await getProfilesByNaturalQuerySearchService(query);

    res.status(200).json(profiles);
  } catch (error) {
    next(error);
  }
};
