var _        = require('lodash');
var should   = require('should');
var helper   = require('../support/spec_helper');
var async    = require('async');
var ORM      = require('../../');

describe("Model.aggregate()", function() {
	var db = null;
	var Person = null;

	var setup = function () {
		return function (done) {
			Person = db.define("person", {
				name   : String
			});

			return helper.dropSync(Person, function () {
				Person.create([{
					id  : 1,
					name: "John Doe"
				}, {
					id  : 2,
					name: "Jane Doe"
				}, {
					id  : 3,
					name: "John Doe"
				}], done);
			});
		};
	};

	before(function (done) {
		helper.connect(function (connection) {
			db = connection;

			return done();
		});
	});

	after(function () {
		return db.close();
	});

	describe("with multiple methods", function () {
		before(setup());

		it("should return value for everyone of them", function (done) {
			Person.aggregate().count('id').min('id').max('id').get(function (err, count, min, max) {
				should.equal(err, null);

				count.should.equal(3);
				min.should.equal(1);
				max.should.equal(3);

				return done();
			});
		});
	});

	describe("with select() without arguments", function () {
		before(setup());

		it("should throw", function (done) {
			Person.aggregate().select.should.throw();

			return done();
		});
	});

	describe("with get() without callback", function () {
		before(setup());

		it("should throw", function (done) {
			Person.aggregate().count('id').get.should.throw();

			return done();
		});
	});

	describe("with get() without aggregates", function () {
		before(setup());

		it("should throw", function (done) {
			(function () {
				Person.aggregate().get(function () {});
			}).should.throw();

			return done();
		});
	});

	describe("with distinct()", function () {
		before(setup());

		it("should return a list of distinct properties", function (done) {
			Person.aggregate().distinct('name').get(function (err, names) {
				should.equal(err, null);

				names.should.be.a("object");
				names.should.have.property("length", 2);

				return done();
			});
		});

		describe("with limit(1)", function () {
			it("should return only one value", function (done) {
				Person.aggregate().distinct('name').limit(1).order("name").get(function (err, names) {
					should.equal(err, null);

					names.should.be.a("object");
					names.should.have.property("length", 1);
					names[0].should.equal("Jane Doe");

					return done();
				});
			});
		});

		describe("with limit(1, 1)", function () {
			it("should return only one value", function (done) {
				Person.aggregate().distinct('name').limit(1, 1).order("name").get(function (err, names) {
					should.equal(err, null);

					names.should.be.a("object");
					names.should.have.property("length", 1);
					names[0].should.equal("John Doe");

					return done();
				});
			});
		});
	});

	describe("with groupBy()", function () {
		before(setup());

		it("should return items grouped by property", function (done) {
			Person.aggregate().count().groupBy('name').get(function (err, rows) {
				should.equal(err, null);

				rows.should.be.a("object");
				rows.should.have.property("length", 2);

				(rows[0].count + rows[1].count).should.equal(3); // 1 + 2

				return done();
			});
		});

		describe("with order()", function () {
			before(setup());

			it("should order items", function (done) {
				Person.aggregate().count().groupBy('name').order('count', 'Z').get(function (err, rows) {
					should.equal(err, null);

					rows.should.be.a("object");
					rows.should.have.property("length", 2);

					rows[0].count.should.equal(2);
					rows[1].count.should.equal(1);

					return done();
				});
			});
		});
	});
});
