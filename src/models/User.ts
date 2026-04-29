import mongoose from "mongoose";
import type { IUser } from "../types/types.js";
import { v7 as uuidv7 } from "uuid";

const userSchema = new mongoose.Schema<IUser, mongoose.Model<IUser>>({
    id: {
        type: String,
        required: true,
        unique: true,
        default: () => uuidv7()
    },
    github_id: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    avatar_url: {
        type: String
    },
    role: {
        type: String,
        enum: ["admin", "analyst"],
        default: "analyst"
    },
    is_active:{
        type: Boolean,
        default: true,
        required: true
    },
    refresh_token: {
        type: String,
    },
    last_login_at: {
        type: Date,
        required: true
    },
    created_at: {
        type: Date,
        required: true,
        default: () => new Date()
    }

});

export const User = mongoose.model('User', userSchema)