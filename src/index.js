'use strict';

const DEFAULT_DELIMITER = '/';
const DEFAULT_NAMED_SEGMENT = ':';
const ASSIGNMENT = '=';
const OR_SIGN = '|';
const MATCH_ANY = '*';
const STR_REGEX_MATCH_ANY = '[a-zA-Z0-9-_/]+';
const REGEX_SPACES_AND_TRAILING_SLASHES = /^\/|\s|\/$/g;
const VALID_SEGMENT = /^[a-z0-9_-]+$/i;
const ANY_VALID_SEGMENT = '[a-zA-Z0-9_-]+';
const IS_BEETWEN_PARENTHESES = /^\((.*)\)$/;


module.exports = RouteParser;


function RouteParser(route = '', options = {}) {
  validateOptions(options);

  const DELIMITER = options.delimiter || DEFAULT_DELIMITER;
  const NAMED_SEGMENT = options.namedSegment || DEFAULT_NAMED_SEGMENT;
  const { regex, map: { namedSegments } } = compileRoute(route);
  // const { regex, map: { segments, namedSegments } } = compileRoute(route);

  return Object.freeze({

    route,

    match(route = '') {
      const regexResult = regex.exec(route);

      if (regexResult === null) {
        return false;
      }

      const result = namedSegments.reduce((_result, namedSegment) => {
        _result[namedSegment[0]] = regexResult[namedSegment[1]];

        return _result;
      }, {});

      return result;
    }

    // TODO: reverse match
    // encode(obj) {
    //   return segments
    //     .map((segment, i) => {
    //       if (typeof namedSegments[i] === 'number') {
    //         return obj[segment];
    //       }

    //       return segment;
    //     })
    //     .join(DELIMITER);
    // }
  });

  function parseSegment(segment, index, segments) {
    if (segment === MATCH_ANY || segment === '') {
      return [index.toString(), segments.length === 1 ? STR_REGEX_MATCH_ANY : ANY_VALID_SEGMENT];
    }

    if (VALID_SEGMENT.test(segment)) {
      return [segment];
    }

    if (segment[0] === NAMED_SEGMENT) {
      return parseNamedSegment(segment);
    }

    throw new Error();
  }

  function validateOptions({ delimiter, namedSegment }) {
    if (delimiter) {
      const toCompare = namedSegment || DEFAULT_NAMED_SEGMENT;

      const valid = !delimiter.split('')
        .filter(char => toCompare.indexOf(char) !== -1).length;

      if (valid) {
        return true;
      }

      throw new Error('Option: `delimiter` must have diferent characteres of `namedSegments`.');
    }

    if (namedSegment) {
      const valid = !namedSegment.split('')
        .filter(char => DEFAULT_DELIMITER.indexOf(char) !== -1)
        .length;

      if (valid) {
        return true;
      }

      throw new Error('Option: `namedSegments` must have diferent characteres of `delimiter`.');
    }

    return true;
  }

  function compileRoute(route) {
    let _route = route;

    if (route === DELIMITER) {
      _route = MATCH_ANY;
    }

    try {
      const segments = _route
        .replace(REGEX_SPACES_AND_TRAILING_SLASHES, '')
        .split(DELIMITER)
        .map(parseSegment);

      return createRegex(segments);
    } catch (error) {
      throw new TypeError(`Invalid Route: ${route}`);
    }
  }

  function createRegex(segments) {
    const regexGroups = [];
    const map = segments.reduce(mapSegments, { segments: [], namedSegments: [] });
    const regex = new RegExp(`^/?${regexGroups.join(DELIMITER)}/?$`);

    return { map, regex };

    function mapSegments(result, segment, i) {
      let regexGroup;
      const [segmentName, segmentRegex] = segment;

      if (segmentRegex) {
        regexGroup = segmentRegex;

        // create a map of named segments
        // which maps to regex exec result, this is why we sum 1 to the index
        result.namedSegments.push([segmentName, i + 1]);
      } else {
        regexGroup = segmentName;
      }

      // create regex groups
      regexGroups.push(`(${regexGroup})`);
      result.segments.push(segmentName);

      return result;
    }
  }

  function parseNamedSegment(segment) {
    const namedSegment = segment.slice(1).split(ASSIGNMENT);
    const namedSegmentLen = namedSegment.length;
    const segmentName = namedSegment[0];
    const segmentOptions = namedSegment[1];

    if (VALID_SEGMENT.test(segmentName)) {
      if (namedSegmentLen === 1) {
        return [segmentName, ANY_VALID_SEGMENT];
      }

      if (namedSegmentLen === 2) {
        return parseSegmentOptions(segmentName, segmentOptions);
      }

      throw new Error();
    }

    throw new Error();
  }

  function parseSegmentOptions(segmentName, segmentOptions) {
    if (IS_BEETWEN_PARENTHESES.test(segmentOptions)) {
      const options = segmentOptions.slice(1, segmentOptions.length - 1).split(OR_SIGN);

      if (options.length > 1 && options.every(opt => VALID_SEGMENT.test(opt))) {
        return [segmentName, options.join(OR_SIGN)];
      }

      throw new Error();
    }

    throw new Error();
  }
}
