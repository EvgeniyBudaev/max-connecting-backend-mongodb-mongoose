const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const HttpError = require('../models/http-error');
const Place = require('../models/place');
const User = require('../models/user');

const getPlaceById = async (req, res, next) => {
	const placeId = req.params.pid;
	let place;

	try {
		place = await Place.findById(placeId);
	} catch (err) {
		const error = new HttpError(err, 500);
		return next(error);
	}

	if (!place) {
		const error = new HttpError(
			'Could not find a place for the provided id.', 404
		);
		return next(error);
	}

	res.json({ place: place.toObject({ getters: true}) });
};

const getPlacesByUserId = async (req, res, next) => {
	const userId = req.params.uid;
	let userWithPlaces;

	try {
		userWithPlaces = await User.findById(userId).populate('places');
	} catch (err) {
		const error = new HttpError(err, 500);
		return next(error);
	}

	if (!userWithPlaces || userWithPlaces.places.length === 0) {
		return next(new HttpError(
			'Could not find a places for the provided user id.', 404)
		);
	}

	res.json({ places: userWithPlaces.places.map(place => place.toObject({ getters: true })) });
};

const createPlace = async (req, res, next) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		throw new HttpError(
			'Invalid inputs passed, please check your data.', 422
		);
	}

	const { title, description, address, location, creator } = req.body;

	const createdPlace = new Place({
		title,
		description,
		image: 'https://i.picsum.photos/id/866/200/300.jpg?hmac=rcadCENKh4rD6MAp6V_ma-AyWv641M4iiOpe1RyFHeI',
		address,
		location,
		creator
	});

	let user;

	try {
		user = await User.findById(creator);
	} catch (err) {
		const error = new HttpError(err, 500);
		return next(error);
	}

	if (!user) {
		const error = new HttpError(
			'Could not find user for provided id.', 404);
		return next(error);
	}

	try {
		const sess = await mongoose.startSession();
		sess.startTransaction();
		await createdPlace.save({ session: sess });
		user.places.push(createdPlace);
		await user.save({ session: sess });
		await sess.commitTransaction();
	} catch (err) {
		const error = new HttpError(err, 500);
		return next(error);
	}

	res.status(201).json({ place: createdPlace });
};

const updatePlace = async ( req, res, next ) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return next(
			new HttpError(
				'Invalid inputs passed, please check your data.', 422
			)
		);
	}

	const { title, description } = req.body;
	const placeId = req.params.pid;
	let place;

	try {
		place = await Place.findById(placeId);
	} catch(err) {
		const error = new HttpError(err, 500);
		return next(error);
	}

	place.title = title;
	place.description = description;

	try {
		await place.save();
	} catch(err) {
		const error = new HttpError(err, 500);
		return next(error);
	}

	res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
	const placeId = req.params.pid;
	let place;

	try {
		place = await Place.findById(placeId).populate('creator');
	} catch(err) {
		const error = new HttpError(err, 500);
		return next(error);
	}

	if (!place) {
		const error = new HttpError('Could not find place for this id.', 404);
		return next(error);
	}

	try {
		const sess = await mongoose.startSession();
		sess.startTransaction();
		await place.remove({ session: sess });
		place.creator.places.pull(place);
		await place.creator.save({ session: sess });
		await sess.commitTransaction();
	} catch(err) {
		const error = new HttpError(err, 500);
		return next(error);
	}

	res.status(200).json({ message: 'Deleted place.' });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;