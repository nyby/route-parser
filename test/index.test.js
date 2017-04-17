'use strict';

const expect = require('chai').expect;

const RouteParser = require('../src');

/* eslint prefer-arrow-callback: 0, func-names: 0, no-unused-expressions: 0 */
describe('Route Parser', function () {
  describe('Create a Route', function () {
    it('should create a route parser with `parse and encode` methods', function () {
      const route = RouteParser('my/test/:route');

      expect(route.match).to.be.a('function');
      expect(route.encode).to.be.a('function');
    });
  });

  describe('Route parsing...', () => {
    it('should parse a valid route', function () {
      const route = RouteParser('my/test/:route');
      const parsedRoute = route.match('my/test/my-route');

      expect(parsedRoute).to.be.a('object');
      expect(parsedRoute).to.eql({ route: 'my-route' });
    });

    it('should not parse a invalid route string', function () {
      const route = RouteParser('my/test/:route');
      const parsedRoute = route.match('my/testInvalid/my-route');

      expect(parsedRoute).to.be.false;
    });

    it('should throw a error on parse a invalid data type', function () {
      expect(() => RouteParser({})).to.throw(/Invalid Route:/);
    });

    it('should throw a error on parse a invalid string route', function () {
      expect(() => RouteParser('my/*test/:route')).to.throw(/Invalid Route:/);
    });

    it('should throw a error on parse a invalid string named route segment', function () {
      expect(() => RouteParser('my/:test%/:route')).to.throw(/Invalid Route:/);
    });

    it('should throw a error on parse a invalid string named route segment options', function () {
      expect(() => RouteParser('my/:test=abc=cde/:route')).to.throw(/Invalid Route:/);
      expect(() => RouteParser('my/:test=abc/:route')).to.throw(/Invalid Route:/);
      expect(() => RouteParser('my/:test=(abc|a&b)/:route')).to.throw(/Invalid Route:/);
      expect(() => RouteParser('my/:test=()/:route')).to.throw(/Invalid Route:/);
    });

    it('should parse a valid route with options', function () {
      const route = RouteParser('my/:action=(test|build)/:route');
      const parsedRoute = route.match('my/test/my-route');

      expect(parsedRoute).to.be.a('object');
      expect(parsedRoute).to.eql({ action: 'test', route: 'my-route' });
    });

    it('should parse a valid route with splat operator', function () {
      const route = RouteParser('*/:action=(test|build)/:route');
      const parsedRoute = route.match('my/test/my-route');

      expect(parsedRoute).to.be.a('object');
      expect(parsedRoute).to.eql({
        0: 'my',
        action: 'test',
        route: 'my-route'
      });
    });

    it('should ignore starting and trailing slashes on parser creation', function () {
      const route = RouteParser('/*/:action=(test|build)/:route/');
      const parsedRoute = route.match('my/test/my-route');

      expect(parsedRoute).to.be.a('object');
      expect(parsedRoute).to.eql({
        0: 'my',
        action: 'test',
        route: 'my-route'
      });
    });

    it('should ignore starting and trailing slashes on parsing the route', function () {
      const route = RouteParser('*/:action=(test|build)/:route');
      const parsedRoute = route.match('/my/test/my-route/');

      expect(parsedRoute).to.be.a('object');
      expect(parsedRoute).to.eql({
        0: 'my',
        action: 'test',
        route: 'my-route'
      });
    });

    it('should match any route with delimeter operator', function () {
      const route = RouteParser('/');

      expect(route.match('/my/test/my-route/')).not.to.be.false;
      expect(route.match('my/test')).not.to.be.false;
      expect(route.match('test')).not.to.be.false;
    });

    it('should match any route with splat operator', function () {
      const route = RouteParser('*');

      expect(route.match('/my/test/my-route/')).not.to.be.false;
      expect(route.match('my/test')).not.to.be.false;
      expect(route.match('test')).not.to.be.false;
    });
  });
});
