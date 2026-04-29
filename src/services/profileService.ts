import axios from 'axios';
import type { QueryOptionsSchema } from '../types/types.js';
import type {
  GenderizeRes,
  AgifyRes,
  NationalizeRes,
  IProfile,
  Sort,
} from '../types/types.js';
import { v7 as uuidv7 } from 'uuid';
import { AppError } from '../utils/AppError.js';
import { Profile } from '../models/Profile.js';
import type { QueryFilter } from 'mongoose';

// Funtions to call external APIs
const callGenderizeApi = async (name: string) => {
  const result = await axios.get(`https://api.genderize.io?name=${name}`);
  const gendrizeRes: GenderizeRes = result.data;
  return gendrizeRes;
};

const callAgifyApi = async (name: string) => {
  const result = await axios.get(`https://api.agify.io?name=${name}`);
  const agifyRes: AgifyRes = result.data;
  return agifyRes;
};

const callNationalizeApi = async (name: string) => {
  const result = await axios.get(`https://api.nationalize.io?name=${name}`);
  const nationalizeRes: NationalizeRes = result.data;
  return nationalizeRes;
};

export const createProfileService = async (name: string) => {
  // Ensure name is always lowecase
  const smallName = name.toLowerCase();

  // Check if name already exists
  const nameExists = await Profile.findOne({ name: smallName }).select(
    '-_id -__v'
  );
  if (nameExists) {
    return {
      status: 'success',
      message: 'Profile already exists',
      data: nameExists,
    };
  }

  //  Fetch from Genderize API
  const genderizeRes = await callGenderizeApi(smallName);
  const agifyRes = await callAgifyApi(smallName);
  const nationalizeRes = await callNationalizeApi(smallName);

  /* Process Genderize API Result */
  // Check if gender is null or count is 0
  if (genderizeRes.gender === null || genderizeRes.count === 0) {
    throw new AppError(502, 'Genderize returned an invalid response');
  }

  //Extract gender, gender_probability, and count from Genderize. Rename count to sample_size
  const gender = genderizeRes.gender;
  const gender_probability = genderizeRes.probability;
  const sample_size: number = genderizeRes.count;

  /* Process Agify API result and classify */
  // Check if age is null
  if (agifyRes.age == null) {
    throw new AppError(502, 'Agify returned an invalid response');
  }

  // Extract age from Agify. Classify age_group: 0–12 → child, 13–19 → teenager, 20–59 → adult, 60+ → senior
  const age = agifyRes.age;

  let age_group: 'child' | 'teenager' | 'adult' | 'senior';
  if (age >= 0 && age <= 12) {
    age_group = 'child';
  } else if (age >= 13 && age <= 19) {
    age_group = 'teenager';
  } else if (age >= 20 && age <= 59) {
    age_group = 'adult';
  } else {
    age_group = 'senior';
  }

  /* Process Nationalize API*/
  // Check if there's no country data
  if (nationalizeRes.country == null || nationalizeRes.country.length === 0) {
    throw new AppError(502, 'Nationalize returned an invalid response');
  }

  // Extract country list from Nationalize
  const country = nationalizeRes.country;

  //Pick the country with the highest probability as country_id
  let country_probability = country[0]!.probability;
  let country_id = country[0]!.country_id;

  for (const nation of country) {
    if (nation.probability > country_probability) {
      country_probability = nation.probability;
      country_id = nation.country_id;
    }
  }

  // Store the processed result with a UUID v7 id and UTC created_at timestamp
  const id = uuidv7();
  const created_at = new Date().toISOString();

  const profile = await Profile.create({
    id,
    name: smallName,
    gender,
    gender_probability,
    sample_size,
    age,
    age_group,
    country_id,
    country_probability,
    created_at,
  });

  await profile.save();

  return {
    status: 'success',
    data: profile,
  };
};

export const getProfileService = async (id: string) => {
  const profile = await Profile.findOne({ id }).select('-_id -__v');

  if (!profile) {
    throw new AppError(404, `Profile not found`);
  }

  return {
    status: 'success',
    data: profile,
  };
};

export const getAllProfileService = async (query: QueryOptionsSchema) => {
  // Initialize filters object for optional filter arguments
  const filters: QueryFilter<IProfile> = {};

  // Pass filter arguments to the filters objects if available
  if (query.gender) filters.gender = query.gender.toLocaleLowerCase();
  if (query.country_id) filters.country_id = query.country_id.toUpperCase();
  if (query.age_group) filters.age_group = query.age_group.toLowerCase();
  if (query.max_age || query.min_age) {
    filters.age = {};
    if (query.max_age) filters.age.$lte = Number(query.max_age);
    if (query.min_age) filters.age.$gte = Number(query.min_age);
  }
  if (query.min_country_probability)
    filters.country_probability = {
      $gte: Number(query.min_country_probability),
    };
  if (query.min_gender_probability)
    filters.gender_probability = { $gte: Number(query.min_gender_probability) };

  // Initilaize sorting object for optional sorting arguments
  const sorting = {} as Sort;

  // Pass sorting arguments to the sorting object if available
  if (query.sort_by) sorting.field = query.sort_by.toLowerCase();
  sorting.order = query.order?.toLowerCase() === 'asc' ? 1 : -1;

  // Destructure sorting object
  const { field = 'created_at', order = -1 } = sorting;

  // Get optional limit and page arguments for pagination
  const limit = Number(query.limit) || 10;
  const page = Number(query.page) || 1;

  // Find documents by queries
  const profiles = await Profile.find(filters)
    .select('-__v -_id')
    .sort({ [field]: order })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Profile.countDocuments(filters);

  return {
    status: 'success',
    page: page,
    limit: limit,
    total: total,
    data: profiles,
  };
};

export const deleteProfileService = async (id: string) => {
  const deletedProfile = await Profile.deleteOne({ id });

  if (deletedProfile.deletedCount === 0)
    throw new AppError(404, 'Profile not found');

  return;
};

// Create a Query Parser function that parses string into respective filter options
const naturalQueryParser = async (query: QueryOptionsSchema) => {
  // Convert string to lowercase
  const lowQuery: string = query.q ? query.q.toLowerCase() : '';

  // Initialize filters object
  const filters: QueryOptionsSchema = {};

  // Create  allowed vocabularies
  const maleWords: string[] = ['male', 'males', 'boys', 'men', 'man', 'boy'];
  const femaleWords: string[] = [
    'female',
    'females',
    'girl',
    'girls',
    'woman',
    'women',
  ];
  const childWords: string[] = [
    'child',
    'children',
    'baby',
    'babies',
    'kid',
    'kids',
  ];
  const teenagerWords: string[] = ['teen', 'teens', 'teenager', 'teenagers'];
  const adultWords: string[] = ['adult', 'adults'];
  const seniorWords: string[] = [
    'senior',
    'seniors',
    'elder',
    'elders',
    'elderly',
  ];
  const skipGenderWords: string[] = ['people', 'both', 'everyone', 'and'];

  // Split the string into an array of each word to avoid conflict of words like "male" and "female"
  const words: string[] = lowQuery.split(' ');

  // Create filter options by checking word array against expected vocabularies
  if (words.some((w) => maleWords.includes(w))) filters.gender = 'male';
  if (words.some((w) => femaleWords.includes(w))) filters.gender = 'female';
  if (words.some((w) => skipGenderWords.includes(w)))
    filters.gender = undefined;
  if (words.some((w) => teenagerWords.includes(w)))
    filters.age_group = 'teenager';
  if (words.some((w) => childWords.includes(w))) filters.age_group = 'child';
  if (words.some((w) => adultWords.includes(w))) filters.age_group = 'adult';
  if (words.some((w) => seniorWords.includes(w))) filters.age_group = 'senior';

  // Get all available country_name and country_id from the DB
  const country = await Profile.find().select('country_name country_id -_id');
  // Check if query string contains any country_name and pass id to filters object
  const match = country.find((c) =>
    lowQuery.includes(c.country_name.toLowerCase())
  );
  if (match) filters.country_id = match.country_id;

  // Create filter option for "young"
  if (lowQuery.includes('young')) {
    filters.min_age = 16;
    filters.max_age = 24;
  }

  // Create filter options for above and below certain ages
  const aboveMatch = lowQuery.match(/above\s+(\d+)/i);
  if (aboveMatch) filters.min_age = Number(aboveMatch[1]);

  const belowMatch = lowQuery.match(/below\s+(\d+)/i);
  if (belowMatch) filters.max_age = Number(belowMatch[1]);

  // Pass sorting arguments and pagination arguments
  if (query.sort_by) filters.sort_by = query.sort_by;
  if (query.order) filters.order = query.order;
  if (query.page) filters.page = Number(query.page);
  if (query.limit) filters.limit = Number(query.limit);

  if (
    !filters.age_group &&
    !filters.country_id &&
    !filters.gender &&
    !filters.max_age &&
    !filters.min_age
  )
    throw new AppError(422, 'Unable to interpret query');
  console.log(filters);

  return filters;
};

// Get profiles by filter options from parsed query strings
export const getProfilesByNaturalQuerySearchService = async (
  query: QueryOptionsSchema
) => {
  const filters = await naturalQueryParser(query);

  const profiles = await getAllProfileService(filters);

  if (!profiles) throw new AppError(422, 'Unable to interpret query');

  return profiles;
};
