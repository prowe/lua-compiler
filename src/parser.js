import { tokenize } from "./tokenizer";

/**
 * 
 * @param {String[]} tokens
 * @param {String} expectedToken
 */
function shiftExpected(tokens, expectedToken) {
    const shifted = tokens.shift();
    if (shifted !== expectedToken) {
        throw new Error(`Unexpected token. Got ${shifted}, expected: ${expectedToken}`);
    }
}

function buildAssignment(tokens, local) {
    const varName = tokens.shift();
    shiftExpected(tokens, "=");
    const expression = parseNextExpression(tokens);
    return {
        type: "assignment",
        local,
        varName,
        expression
    }
}

function buildFunctionDeclaration(tokens) {
    tokens.shift();
    const name = tokens.shift();
    shiftExpected(tokens, "(");
    const parameters = [];
    while (true) {
        const paramHead = tokens.shift();
        if (paramHead === ")") {
            break;
        }
        if (paramHead !== ",") {
            parameters.push(paramHead);
        }
    }
    const children = [];
    while(tokens[0] !== "end") {
        children.push(parseNextExpression(tokens));
    }
    shiftExpected(tokens, "end");
    return {
        type: "function-declaration",
        name,
        parameters,
        children
    };
}

function buildReturn(tokens) {
    tokens.shift();
    return {
        type: "return",
        expression: parseNextExpression(tokens)
    };
}

/**
 * 
 * @param {String} token 
 * @returns {Boolean}
 */
function isExponentOperator(token) {
    return token === "^";
}

/**
 * 
 * @param {String} token 
 * @returns {Boolean}
 */
function isProductOperator(token) {
    return ["*", "/",  "%"].includes(token);
} 

/**
 * 
 * @param {String} token 
 * @returns {Boolean}
 */
function isAdditionOperator(token) {
    return ["+", "-"].includes(token);
}

/**
 * 
 * @param {String} token 
 * @returns {Boolean}
 */
function isInfixOperator(token) {
    return isExponentOperator(token) ||
        isProductOperator(token) ||
        isAdditionOperator(token) ||
        token === "or" ||
        token === "and";
}

/**
 * 
 * @param {String[]} tokens 
 */
function parseNextExpression(tokens) {
    const left = parseNextPrefixExpression(tokens);
    if (isInfixOperator(tokens[0])) {
        const type = tokens.shift();
        const right = parseNextExpression(tokens);
        const multiplicationOverAddition = isProductOperator(type) && isAdditionOperator(right.type);
        const exponentOverOther = type === "^" && isInfixOperator(right.type);
        const orOverAnd = type === "or" && right.type === "and";
        if (multiplicationOverAddition || exponentOverOther || orOverAnd) {
            return {
                type: right.type,
                left: {
                    type,
                    left,
                    right: right.left,
                },
                right: right.right
            };
        }
        return {
            type,
            left,
            right
        };
    }
    if (tokens[0] === '(' && left.type === "variable-reference") {
        tokens.shift();
        return buildFunctionCall(tokens, left);
    }
    return left;
}

function buildFunctionCall(tokens, left) {
    const parameters = [];
    while (true) {
        if (tokens[0] === ")") {
            tokens.shift();
            break;
        } else if (tokens[0] === ",") {
            tokens.shift();
        } else {
            parameters.push(parseNextExpression(tokens));
        }
    }
    return {
        type: "function-call",
        func: left,
        parameters
    };
}

function buildParenExpression(tokens) {
    shiftExpected(tokens, "(");
    const expression = parseNextExpression(tokens);
    shiftExpected(tokens, ")");
    return {
        type: "block",
        children: [ expression ]
    };
}

function buildNotExpression(tokens) {
    shiftExpected(tokens, "not");
    return {
        type: "not",
        expression: parseNextExpression(tokens)
    };
}

function buildBooleanLiteral(tokens, value) {
    tokens.shift();
    return {
        type: "literal",
        value: value
    };
}

function buildStringLiteral(tokens) {
    shiftExpected(tokens, '"');
    const value = tokens.shift();
    shiftExpected(tokens, '"');
    return {
        type: "literal",
        value
    };
}

/**
 * 
 * @param {String[]} tokens 
 */
function parseNextPrefixExpression(tokens) {
    const head = tokens[0];
    if( tokens.length > 1 && tokens[1] === "=") {
        return buildAssignment(tokens, false);
    }
    switch (head) {
        case "local":
            tokens.shift();
            return buildAssignment(tokens, true);
        case "function": return buildFunctionDeclaration(tokens);
        case "return": return buildReturn(tokens);
        case "(": return buildParenExpression(tokens);
        case "not": return buildNotExpression(tokens);
        case "true": return buildBooleanLiteral(tokens, true);
        case "false": return buildBooleanLiteral(tokens, false);
        case '"': return buildStringLiteral(tokens);
    }

    if (Number.isInteger(Number.parseInt(head))) {
        tokens.shift();
        return {
            type: "literal",
            value: Number.parseInt(head)
        }
    }

    return {
        type: "variable-reference",
        varName: tokens.shift()
    };
}

export function parse(codeString) {
    const tokens = tokenize(codeString);
    const topLevelBlock = {
        type: "block",
        children: []
    };
    while (tokens.length > 0) {
        topLevelBlock.children.push(parseNextExpression(tokens));
    }

    return topLevelBlock;
}