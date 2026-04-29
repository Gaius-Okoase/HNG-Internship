import type { Request, Response, NextFunction } from "express";
import { 
    getGitHubAuthUrlService, 
    processGitHubCallbackService,
    refreshTokenService,
    logoutService
 } from "../services/authService.js";

export const getGitHubAuthUrlController = (_req: Request, res: Response, next: NextFunction) => {
    try {
        const {gitHubUri} = getGitHubAuthUrlService();
        console.log(gitHubUri)

        return res.redirect(gitHubUri)
    } catch (error) {
        next(error)
    }
}

export const processGitHubCallbackController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const code = req.query.code as string;
        const state = req.query.state as string;

        const result = await processGitHubCallbackService(code, state)
        const refresh_token = result.data!.refresh_token;
        const user = result.data!.user;
        const access_token = result.data!.access_token;

        res.cookie(
            'refresh_token',
            refresh_token,
            {httpOnly: true, sameSite: "strict", secure: true, expires: new Date(Date.now() + 3 * 60 * 1000)}
        ).status(200).json({
            status: "success",
            data: {
                user,
                access_token
            }
        })
    } catch (error) {
        next(error);
    }
}

export const refreshTokenController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token: string  = req.cookies.refresh_token;

        const result = await refreshTokenService(token);

        const refresh_token = result.refresh_token;

        res.cookie(
            'refresh_token',
            refresh_token,
            {httpOnly: true, sameSite: "strict", secure: true, expires: new Date(Date.now() + 5 * 60 * 1000)}
        ).status(200).json(result)
    } catch (error) {
        next(error)
    }
}

export const logoutController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = req.user.id;
        console.log(id)
        const logout = await logoutService(id);

        res.status(200).clearCookie('refresh_token').send(logout)
    } catch (error) {
        next(error)
    }
}