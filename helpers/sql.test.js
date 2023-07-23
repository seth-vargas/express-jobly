const { BadRequestError } = require("../expressError")
const { sqlForPartialUpdate } = require("./sql")

describe("sqlForPartialUpdate", function () {

    test("works with one field passed in", function () {
        const data = { "firstName": "john" }
        const jsToSql = { "firstName": "first_name" }

        const result = sqlForPartialUpdate(data, jsToSql)
        expect(result).toEqual({
            setCols: '"first_name"=$1',
            values: ["john"]
        })
    })

    test("works with no fields passed in", function () {
        const data = {}
        const jsToSql = {}

        expect(() => sqlForPartialUpdate(data, jsToSql)).toThrow(BadRequestError)
    })
})