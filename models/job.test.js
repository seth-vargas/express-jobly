"use strict";
const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "software engineer",
    salary: 80000,
    equity: "0",
    company_handle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual(newJob);

    const result = await db.query(
      ` SELECT title, salary, equity, company_handle
        FROM jobs
        WHERE title = 'software engineer'`
    );
    expect(result.rows).toEqual([
      {
        title: "software engineer",
        salary: 80000,
        equity: "0",
        company_handle: "c1",
      },
    ]);
  });
});

/************************************** findAll */
// TODO: Write tests for filtering

describe("findAll", function () {
  test("works", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        title: "Job 1",
        salary: 100,
        equity: "0",
        company_handle: "c1",
      },
      {
        title: "Job 2",
        salary: 200,
        equity: "0.01",
        company_handle: "c2",
      },
      {
        title: "Job 3",
        salary: 300,
        equity: "0.02",
        company_handle: "c3",
      },
    ]);
  });

  test("works: filter by title", async function () {
    const filters = {
      title: "Job 1",
      minSalary: undefined,
      hasEquity: undefined,
    };

    let jobs = await Job.findAll(filters);

    expect(jobs).toEqual([
      {
        title: "Job 1",
        salary: 100,
        equity: "0",
        company_handle: "c1",
      },
    ]);
  });

  test("filtering works - minSalary", async function () {
    const filters = {
      title: undefined,
      minSalary: 200,
      hasEquity: undefined,
    };

    let jobs = await Job.findAll(filters);

    expect(jobs).toEqual([
      {
        title: "Job 2",
        salary: 200,
        equity: "0.01",
        company_handle: "c2",
      },
      {
        title: "Job 3",
        salary: 300,
        equity: "0.02",
        company_handle: "c3",
      },
    ]);
  });

  test("filtering works - hasEquity", async function () {
    const filters = {
      title: undefined,
      minSalary: undefined,
      hasEquity: true,
    };

    let jobs = await Job.findAll(filters);

    expect(jobs).toEqual([
      {
        title: "Job 2",
        salary: 200,
        equity: "0.01",
        company_handle: "c2",
      },
      {
        title: "Job 3",
        salary: 300,
        equity: "0.02",
        company_handle: "c3",
      },
    ]);
  });

  test("filtering works - all filters, no match", async function () {
    const filters = {
      title: "Job 1",
      minSalary: 1000,
      hasEquity: true,
    };

    let jobs = await Job.findAll(filters);

    expect(jobs).toEqual([]);
  });

  test("filtering works - all filters, with match", async function () {
    const filters = {
      title: "Job 1",
      minSalary: 100,
      hasEquity: false,
    };

    let jobs = await Job.findAll(filters);

    expect(jobs).toEqual([
      {
        title: "Job 1",
        salary: 100,
        equity: "0",
        company_handle: "c1",
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(1);

    expect(job).toEqual({
      title: "Job 1",
      salary: 100,
      equity: "0",
      company_handle: "c1",
    });
  });

  test("not found if no such job id", async function () {
    try {
      await Job.get(-1);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 100000,
    equity: "0.1",
  };

  test("works", async function () {
    let job = await Job.update(1, updateData);
    expect(job).toEqual({ company_handle: "c1", ...updateData });

    const result = await db.query(
      ` SELECT title, salary, equity, company_handle
        FROM jobs
        WHERE id = 1`
    );
    expect(result.rows).toEqual([
      {
        title: "New",
        salary: 100000,
        equity: "0.1",
        company_handle: "c1",
      },
    ]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New",
      salary: null,
      equity: null,
    };

    let job = await Job.update(1, updateDataSetNulls);
    expect(job).toEqual({
      company_handle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
      ` SELECT title, salary, equity, company_handle
        FROM jobs
        WHERE id = 1`
    );
    expect(result.rows).toEqual([
      {
        title: "New",
        salary: null,
        equity: null,
        company_handle: "c1",
      },
    ]);
  });

  test("not found if no such job id", async function () {
    try {
      await Job.update(-1, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(1);
    const res = await db.query("SELECT title FROM jobs WHERE id = 1");

    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job id", async function () {
    try {
      await Job.remove(-1);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
