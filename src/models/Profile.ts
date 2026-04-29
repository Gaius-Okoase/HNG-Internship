import mongoose from 'mongoose';
import type { IProfile } from '../types/types.js';

const profileSchema = new mongoose.Schema<IProfile, mongoose.Model<IProfile>>({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  gender: {
    type: String,
    required: true,
  },
  gender_probability: {
    type: Number,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  age_group: {
    type: String,
    enum: ['child', 'teenager', 'adult', 'senior'],
    required: true,
  },
  country_id: {
    type: String,
    required: true,
  },
  country_name: {
    type: String,
    required: true,
  },
  country_probability: {
    type: Number,
    required: true,
  },
  created_at: {
    type: String,
    required: true,
  },
});

export const Profile = mongoose.model('Profile', profileSchema);
