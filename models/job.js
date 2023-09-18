"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {
  /** Create a job from data, update db, return new job data
   *
   *  Data should be { title, salary, equity, company_handle }
   *
   *  Returns { title, salary, equity, company_handle }
   *
   *  Throws BadRequestError if job already exists in database
   */

  static async create({ title, salary, equity, company_handle }) {
    // No need for dupe check, since multiple jobs can have the same title in this layout!
    const result = await db.query(
      ` INSERT INTO jobs
        (title, salary, equity, company_handle)
        VALUES ($1, $2, $3, $4)
        RETURNING title, salary, equity, company_handle`,
      [title, salary, equity, company_handle]
    );

    const job = result.rows[0];

    return job;
  }

  /** Find all jobs
   *
   *  Returns [{ title, salary, equity, company_handle }, ...]
   */

  static async findAll(filters = {}) {
    let query = `SELECT title, salary, equity, company_handle FROM jobs`;

    let whereExpressions = [];
    let queryValues = [];

    const { minSalary, title, hasEquity } = filters;

    if (minSalary !== undefined) {
      queryValues.push(minSalary);
      whereExpressions.push(`salary >= $${queryValues.length}`);
    }

    if (title) {
      queryValues.push(`%${title}%`);
      whereExpressions.push(`title ILIKE $${queryValues.length}`);
    }

    if (hasEquity) {
      queryValues.push(0);
      whereExpressions.push(`equity > $${queryValues.length}`);
    }

    if (whereExpressions.length > 0) {
      query += ` WHERE ${whereExpressions.join(" AND ")}`;
    }

    query += " ORDER BY company_handle";

    const jobsResponse = await db.query(query, queryValues);

    return jobsResponse.rows;
  }

  /** Given a job id, return data about job.
   *
   *  Returns { title, salary, equity, company_handle }
   */

  static async get(id) {
    const jobRes = await db.query(
      ` SELECT title, salary, equity, company_handle
        FROM jobs
        WHERE id = $1`,
      [id]
    );

    const job = jobRes.rows[0];
    if (!job) throw new NotFoundError(`No Job with id ${id}`);

    return job;
  }

  /** Update company data with `data`.
   *
   *  This is a "partial update" --- it's fine if data doesn't contain all the
   *   fields; this only changes provided ones.
   *
   *  Data can include: { title, salary, equity}
   *
   *  Returns { title, salary, equity, company_handle }
   *
   *  Throws NotFoundError if not found.
   */
  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {});

    const querySql = `  UPDATE jobs
                        SET ${setCols}
                        WHERE id = ${id}
                        RETURNING title, 
                                  salary, 
                                  equity, 
                                  company_handle`;

    const result = await db.query(querySql, [...values]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return job;
  }

  /** Delete given job from db; returns undefined
   *
   *  Throws NotFoundError if company not found
   */

  static async remove(id) {
    const result = await db.query(
      ` DELETE FROM jobs
        WHERE id = $1
        RETURNING id`,
      [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No Job with id: ${id}`);
  }
}

module.exports = Job;
