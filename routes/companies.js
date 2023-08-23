"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError, ExpressError } = require("../expressError");
const { ensureLoggedIn, ensureIsAdmin } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();

/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: login + isAdmin
 */

router.post(
  "/",
  ensureLoggedIn,
  ensureIsAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, companyNewSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      const company = await Company.create(req.body);
      return res.status(201).json({ company });
    } catch (err) {
      return next(err);
    }
  }
);

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    // collect query string values
    let { nameLike, minEmployees, maxEmployees } = req.query;

    if (nameLike !== undefined) {
      nameLike = `%${nameLike}%`;
    } else {
      nameLike = `%%`;
    }

    if (minEmployees !== undefined) {
      minEmployees = parseInt(minEmployees);
    } else {
      minEmployees = 0;
    }

    if (maxEmployees !== undefined) {
      maxEmployees = parseInt(maxEmployees);
    } else {
      maxEmployees = 1000000;

      // TODO
      // I want to fix this so that the numEmployee number dynamically increases,
      // and does not need to be set to some random const
      // maxEmployees = "MAX(numEmployees)"; // literal string for db to query
    }

    if (typeof minEmployees != "number") {
      // throw error - Must be int
      throw new ExpressError("minEmployee must be an integer", 500);
    }
    if (typeof maxEmployees != "number") {
      // throw error - Must be int
      throw new ExpressError("maxEmployee must be an integer", 500);
    }
    if (minEmployees > maxEmployees) {
      // throw error - Min must be less than Max
      throw new ExpressError(
        "minEmployee cannot be larger than maxEmployee",
        500
      );
    }

    const companies = await Company.findAll(
      nameLike,
      minEmployees,
      maxEmployees
    );
    return res.json({ companies });
  } catch (err) {
    return next(err);
  }
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    const company = await Company.get(req.params.handle);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: login + isAdmin
 */

router.patch(
  "/:handle",
  ensureLoggedIn,
  ensureIsAdmin,
  async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, companyUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map((e) => e.stack);
        throw new BadRequestError(errs);
      }

      const company = await Company.update(req.params.handle, req.body);
      return res.json({ company });
    } catch (err) {
      return next(err);
    }
  }
);

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: login + isAdmin
 */

router.delete(
  "/:handle",
  ensureLoggedIn,
  ensureIsAdmin,
  async function (req, res, next) {
    try {
      await Company.remove(req.params.handle);
      return res.json({ deleted: req.params.handle });
    } catch (err) {
      return next(err);
    }
  }
);

module.exports = router;
