import type { Request, Response, NextFunction } from "express";
import { getUserService, makeAdminService } from "../services/userService.js";

export const makeAdminController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const makeAdmin = await makeAdminService(id);

    res.status(200).json(makeAdmin)

  } catch (error) {
    next(error)
  }
}

export const getUserController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.user.id;

        const user = await getUserService(id);

        res.status(200).json(user);
    } catch (error) {
        next(error)
    }
}

