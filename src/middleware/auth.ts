import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import type { DecodedToken } from '../types/types.js';
import { AppError } from '../utils/AppError.js';

// Extract authorization header
export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
    try{
        // Verify header authorization properties
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            console.log("Authorization object missing.")
            throw new AppError(401, "Invalid or missing token")
        }

        if(!authHeader.startsWith("Bearer ")) {
            console.log("Malformed token.")
            throw new AppError(401, "Invalid or missing token")
        }

        // Extract and verify token
        const token = authHeader.split(" ")[1]
        
        if (!token) {
        throw new AppError(401, "Invalid or missing token")
        }

        // Decode token
        const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as DecodedToken;

        //Extract id and role from decoded token
        const user = {} as {
            id: string,
            role: "admin" | "analyst"
        }
        user.id = decodedToken.id;
        user.role = decodedToken.role;

        // Verify user still exists
        const userExists = await User.findOne({id: user.id});
        console.log(userExists)
        if (!userExists) {
            throw new AppError(410, "User does not exist")
        }

        if(userExists.is_active === false) throw new AppError(403, "Forbidden")
        req.user = user;    
    } catch (error) {
       next(error)
    }
    return next()
} 

export const authorizeAdmin = async (req: Request, _res: Response, next: NextFunction) => {
    try {
        if (req.user.role !== "admin") throw new AppError(403, "Forbidden")
    } catch (error) {
        next(error)
    }
    return next()
}