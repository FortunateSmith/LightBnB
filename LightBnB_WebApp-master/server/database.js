const properties = require('./json/properties.json');
const users = require('./json/users.json');

const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  port: '5432', // is this correct?
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */

const getUserWithEmail = function(email) {
	const queryString = `
		SELECT *
		FROM users
		WHERE email = $1;
    `;
	return pool.query(queryString, [email]).then(res => res.rows[0]);
};

exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const queryString = `
  SELECT *
  FROM users
  WHERE id = $1;
  `;
  return pool.query(queryString, [id]).then(res => res.rows[0]);
};

exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  const queryString = `
  INSERT INTO users (name, password, email)
  VALUES ($1, $2, $3)
  RETURNING *;
  `;
  return pool.query(queryString, [user.name, user.password, user.email.toLowerCase()])
  .then(res => res.rows[0]);
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */

//  const getAllReservations = function (guest_id, limit = 10) {
//   return getAllProperties(null, 2);
// };

const getAllReservations = function(guest_id, limit = 10) {
  
  const queryString = `
  SELECT reservations.*, properties.*, AVG(property_reviews.rating) as average_rating
  FROM reservations
  JOIN properties ON properties.id = reservations.property_id
  JOIN property_reviews ON properties.id = property_reviews.property_id 
  WHERE reservations.guest_id = $1 AND
    reservations.end_date < now()::date
  GROUP BY reservations.id, properties.id
  ORDER BY reservations.start_date
  LIMIT $2;
  `;
  // console.log('guest_id: ', guest_id)
  return pool.query(queryString, [guest_id, limit]).then(res => res.rows);
};

exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

const getAllProperties = function (options, limit = 10) {

  const queryParams = [];
  let queryString = `
  SELECT properties.*, AVG(rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

// first option, if included in search
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  
  if (options.minimum_price_per_night){
    queryParams.push(`${options.minimum_price_per_night*100}`);
    if(queryParams.length === 1) {
      // if previous option NOT included in query
      queryString += `WHERE cost_per_night >= $${queryParams.length} `;
    } else {
      // if previous option included in query
      queryString += `AND cost_per_night >= $${queryParams.length} `;
    }
  }
  
  if (options.maximum_price_per_night){
    queryParams.push(`${options.maximum_price_per_night*100}`);
    if(queryParams.length === 1) {
      // if previous option NOT included in query
      queryString += `WHERE cost_per_night <= $${queryParams.length} `;
    } else {
      // if previous option included in query
      queryString += `AND cost_per_night <= $${queryParams.length} `;
    }
  }
  
  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    if (queryParams.length === 1) {
      // if previous option NOT included in query
      queryString += `WHERE (SELECT AVG(rating) FROM property_reviews) >= $${queryParams.length} `;
    } else {
      // if previous option included in query
      queryString += `AND (SELECT AVG(rating) FROM property_reviews) >= $${queryParams.length} `;
    }
  }
  
  // if logged in user is property owner, my listings in UI will show user's properties
  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    if (queryParams.length === 1) {
      // if previous option NOT included in query
      queryString += `WHERE owner_id = $${queryParams.length} `;
    } else {
      // if previous option included in query
      queryString += `AND owner_id = $${queryParams.length} `;
    }
  }
  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;
  console.log(queryString, queryParams);
  return pool.query(queryString, queryParams).then((res) => res.rows);
};

exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  // const propertyId = Object.keys(properties).length + 1;
  // property.id = propertyId;
  // properties[propertyId] = property;
  // return Promise.resolve(property);
  // let queryParams = [];
  let queryString = `
  INSERT INTO properties 
  (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING *;
  `;
  
  return pool.query(queryString, [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night, property.street, property.city, property.province, property.post_code, property.country, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms])
  .then(res => res.rows[0]);
  
};

exports.addProperty = addProperty;
