const { splitHighOrder } = require('./split-high-order');
const bsaRules =
  `
  const rules = Joi => ({
    //
    // Validate a person GUID,NO Required
    //
    guid: Joi.string().guid(),
  
    //
    // Validate a person GUID, Required
    //
    guidRequired: Joi.string().guid().required(),
  
    //
    // Validate an id: Numeric, integer, min 1, max 2147483647
    //
    id: Joi.number().integer().min(1).max(NUMBER_TYPES.INT),
  
    //
    // Validate an userId: Numeric, integer, min 1, required, convert to string
    //
    idRequired: Joi.number().integer().min(1).max(NUMBER_TYPES.INT)
      .required(),
  
    //
    // Validate date: date, format YYYY-MM-DD
    //
    date: Joi.date().format('YYYY-MM-DD').raw(),
  
    //
    // Validate date: date, format YYYY-MM-DD not empty
    //
    dateNotEmpty: Joi.date().format('YYYY-MM-DD').raw().invalid('')
      .options({
        language: {
          date: {
            base: 'must be a string with one of the following formats [YYYY-MM-DD]',
          },
        },
      }),
  
    //
    // Validate date: date, format YYYY-MM-DD, required
    //
    dateRequired: Joi.date().format('YYYY-MM-DD').raw()
      .required(),
  
    //
    // Validate date and time format: YYYY-MM-DDTHH:mm:ss
    //
    dateTime: Joi.date().format('YYYY-MM-DDTHH:mm:ss').raw(),
  
    //
    // Validate date and time format: YYYY-MM-DDTHH:mm:ss, required
    //
    dateTimeRequired: Joi.date().format('YYYY-MM-DDTHH:mm:ss').raw()
      .required(),
  
    //
    // Function to validate allowed list of strings
    //
    allowedStrings: allowed => Joi.string().equal(allowed),
  
    //
    // Validate allowed lisf of strings, required
    //
    allowedStringsRequired: allowed => Joi.string().equal(allowed).required(),
  
    //
    // Validate allowed lisf of integers
    //
    allowedIntegers: allowed => Joi.number().integer().equal(allowed).raw(),
  
    //
    // Validate allowed lisf of integers, required
    //
    allowedIntegersRequired: allowed => Joi.number().integer().equal(allowed).raw()
      .required(),
  
    //
    // Validate strings
    //
    string: Joi.string().allow(''),
  
    //
    // Validate strings, does not allow '' empty string, required
    //
    stringRequired: Joi.string().required().disallow(''),
  
    //
    // Validate strings, does not allow '' empty string
    //
    stringNotEmpty: Joi.string().invalid(''),
  
    //
    // Validate numeric/integer values
    //
    integer: Joi.number().integer(),
  
    //
    // Validate an int(10): Numeric, integer, min 0, max 2147483647
    //
    int10MinZero: Joi.number().integer().min(0).max(NUMBER_TYPES.INT),
  
    //
    // Validate numeric/integer values, required
    //
    integerRequired: Joi.number().integer().required(),
  
    //
    // Validate an email
    //
    email: Joi.string().email().allow(''),
  
    //
    // Validate an email
    //
    emailNotEmpty: Joi.string().email().invalid(''),
  
    //
    // Validate an email, required
    //
    emailRequired: Joi.string().email().required(),
  
    //
    // Validate specific zipcode length: 4
    //
    zipCode4: Joi.string().regex(/^[0-9]{4}$/),
  
    //
    // Validate specific zipcode length: 4 required
    //
    zipCode4Required: Joi.string().regex(/^[0-9]{4}$/).required(),
  
    //
    // Validate specific zipcode length: 5
    //
    zipCode5: Joi.string().regex(/^[0-9]{5}$/),
  
    //
    // Validate specific zipcode length: 5, required
    //
    zipCode5Required: Joi.string().regex(/^[0-9]{5}$/).required(),
  
    //
    // Validate if value is 0 or 1
    //
    binaryOptions: Joi.number().equal(0, 1),
  
    //
    // Validate if value is 0 or 1, required
    //
    binaryOptionsRequired: Joi.number().equal(0, 1).required(),
  
    //
    // Function to validate boolean values. Not string allowed
    //
    boolean: Joi.boolean().invalid('true', 'false'),
  
    //
    // Validate boolean values. Not string allowed
    //
    booleanRequired: Joi.boolean().invalid('true', 'false').required(),
  
    //
    // Validate boolean values. Can be used with query/uri parameters.
    //
    booleanString: Joi.string().equal(['true', 'false']),
  
    //
    // Validate boolean values. Can be used with query/uri parameters. Required
    //
    booleanStringRequired: Joi.string().equal(['true', 'false']).required(),
  
    //
    // Validate an lookup Id
    //
    lookupId: (key, idKey = 'id') => Joi.number().integer().min(1).strict()
      .lookup(key, idKey),
  
    //
    // Validate an lookup Id, required
    //
    lookupIdRequired: (key, idKey = 'id') => Joi.number().lookup(key, idKey).required(),
  
    //
    // Validate an lookup name
    //
    lookupName: (key, idKey = 'name') => Joi.string().lookup(key, idKey),
  
    //
    // Validate an lookup name, required
    //
    lookupNameRequired: (key, idKey = 'name') => Joi.string().lookup(key, idKey).required(),
  
    //
    // Validate time format
    //
    time: Joi.date().format('HH:mm'),
  
    //
    // Validate time format
    //
    timeRequired: Joi.date().format('HH:mm').required(),
  
    //
    // Validate optional url parameters
    //
    uriIdParamsArray: Joi.string().urlParamsArray(),
  
    //
    // Validate required url parameters
    //
    uriIdParamsArrayRequired: Joi.string().urlParamsArray().required(),
    //
    // Validate decimal values
    //
    decimal: Joi.number().precision(2),
  
    //
    // Validate phoneAreaCode
    //
    phoneAreaCode: Joi.string().regex(/^[0-9]{3}$/).length(3)
      .options({
        language: {
          string: {
            regex: {
              base: 'Must be a valid 3 digit phone area code',
            },
          },
        },
      }),
  
    //
    // Validate phonePrefix
    //
    phonePrefix: Joi.string().regex(/^[0-9]{3}$/).length(3)
      .options({
        language: {
          string: {
            regex: {
              base: 'Must be a valid 3 digit phone prefix',
            },
          },
        },
      }),
  
    //
    // Validate phone line number
    //
    phoneLineNumber: Joi.string().regex(/^[0-9]{1,15}$/).options({
      language: {
        string: {
          regex: {
            base: 'Must be a valid phone line number',
          },
        },
      },
    }),
  
    //
    // Validate phone extension
    //
    phoneExtension: Joi.string().regex(/^[0-9]{0,6}$/).options({
      language: {
        string: {
          regex: {
            base: 'Must be a valid [0-6] digit phone extension',
          },
        },
      },
    }),
  });`;
function getBsaRules() {
  const bsaRulesNoComments = bsaRules.replace(/\/\/.*/g, '').replace(/\s+/g, ' ');
  const rules = new RegExp(`const rules = Joi => \\(\\{([^;]*)`, 'igm').exec(bsaRulesNoComments);
  const properties = splitHighOrder(rules[1], /,/);
  console.log(properties);
  const result = properties.map(parsePropertyRule).filter(value => value != null);
  console.log(result);
  return result;
}

function parsePropertyRule(propertyRule) {
  const result = /^(\w+):\sJoi.(.+)$/ig.exec(propertyRule);
  if (result != null) {
    const [, property, rulesString] = result;
    const joiMethods = splitHighOrder(rulesString, /\./);
    console.log(joiMethods);
    const base = joiMethods.shift();
    return { base, rules: joiMethods, property };
  } else {
    console.log(`cant process ${propertyRule}`);
    return null;
  }

}

module.exports = getBsaRules();
