import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";

export const makeAdminService = async (id: string) => {
  // Find user document and update 
  const user = await User.findOneAndUpdate({id}, {role: "admin"}, {returnDocument: 'after'}).select('-_id -__v -refresh_token');

  if (!user) throw new AppError(404, "User does not exist");

  return {
    status: "Success",
    data: user
  }
}

export const getUserService = async (id: string) => {
    const user = await User.findOne({id}).select('-_id -__v -refresh_token');

    if(!user) throw new AppError(404, "User does not exist")
    
    return {
        status: "Succes",
        data: user
    }
}