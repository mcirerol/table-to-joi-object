const dataTypes = {
    varchar: 'string',
    nvarChar: 'string',
    text: 'string',
    int: 'number, integer()',
    bigint: 'number, integer()',
    tinyint: 'number, integer()',
    smallint: 'number, integer()',
    bit: 'boolean',
    float: 'number',
    numeric: 'number',
    decimal: 'number',
    real: 'number',
    date: 'date',
    datetime: 'date',
    datetime2: 'date',
    dateTimeOffset: 'date',
    smalldatetime: 'date',
    time: 'date',
    uniqueidentifier: 'string, guid()',
    smallmoney: 'number',
    money: 'number',
    binary: 'string',
    varbinary: 'string',
    image: 'string',
    xml: 'string',
    char: 'string',
    nchar: 'string',
    ntext: 'string',
    tvp: 'string',
    udt: 'string',
    geography: 'string',
    geometry: 'string',
    variant: 'string',
  };


const { getCloseSymbol } = require('./split-high-order');

class GenericParser {
    constructor(name, type, typeArgs, modifiers, update) {
        this.name = name;
        this.type = type;
        this.typeArgs = typeArgs;
        this.modifiers = modifiers;
        this.update = update;
        this.joiBase = '';
        this.joiRules = [];
        this.getJoiBase();
        this.getRules();
    }

    getJoiBase() {
        const joiBaseComplete = dataTypes[this.type.toLowerCase()];
        const result = joiBaseComplete.split(',');

        this.joiBase = result.shift();
        this.joiBase = `${this.joiBase}()`;
        this.joiRules = result.map(rule => rule.trim());
    }

    getRules() {
        if (this.update) {
            if (!this.modifiers.match(/NOT\s+NULL/)) {
                this.joiRules.push('allow(null)');
            }
        } else {
            if (this.modifiers.match(/NOT\s+NULL/)) {
                this.joiRules.push('required()');
            }
        }

    }

}

class VarCharParser extends GenericParser {
    constructor(...args) {
        super(...args);
    }
    getRules() {
        super.getRules()
        const lengthValue = this.typeArgs;
        this.joiRules.push(`max(${lengthValue})`);
    }
}

function ParserFactory(name, type, typeArgs, modifiers, update) {
    if (type.toLowerCase() === 'varchar') {
        return new VarCharParser(name, type, typeArgs, modifiers, update);
    }
    return new GenericParser(name, type, typeArgs, modifiers, update);
}


function processSqlTableDeclaration(tableDeclaration) {
    const tableNormalized = tableDeclaration.replace(/\s+/g, ' ');
    const result = /^\s*create\s*table\s*((\[?\w+\]?\.)*\[?(\w+)\]?)\s+\((.*)/i.exec(tableNormalized);
    if (result == null) {
        return new Error(`can't process table declaration`);
    }

    const [, , , tableName, matchContent] = result;
    const cutPos = getCloseSymbol(matchContent, '(', 0);
    const content = matchContent.substring(0, cutPos);
    return {
        tableName, content
    }
}

function getJoiRulesFromColumnDefinition(update, columnDefinition) {
    const result = /^\[?(\w+)\]?\s+(\w+)(\(([^)]+)\))?(.*)$/ig.exec(columnDefinition);
    if (result == null) {
        return null;
    }
    const [, name, type, , typeArgs, modifiers] = result;
    if (dataTypes[type.toLowerCase()] == null) {
        return null;
    }
    const joiParser = ParserFactory(name, type, typeArgs, modifiers, update);
    return joiParser;
}

module.exports = { getJoiRulesFromColumnDefinition, processSqlTableDeclaration };

