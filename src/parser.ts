import { tokenize, Token } from "./tokenizer";

export interface TreeNode {
    type: string;
}
export interface BlockNode extends TreeNode {
    type: "block";
    children: TreeNode[];
}
export interface ReturnNode extends TreeNode {
    type: "return";
    expression: TreeNode;
}
export interface FunctionDeclarationNode extends TreeNode {
    type: "function-declaration";
    name: string;
    parameters: string[];
    children: TreeNode[];
}
export interface FunctionCallNode extends TreeNode {
    type: "function-call";
    func: TreeNode;
    parameters: TreeNode[];
}
export interface AssignmentNode extends TreeNode {
    type: "assignment";
    local: Boolean;
    varName: string;
    expression: TreeNode;
}
export interface TableNode extends TreeNode {
    type: "table",
    entries: Record<string, TreeNode>;
}

type ProductOperator = "*" | "/" | "%";
type AdditionOperator = "+" | "-";
type BooleanOperator = "or" | "and";
type ExponentOperator = "^";
type InfixOperator = ProductOperator | AdditionOperator | BooleanOperator | ExponentOperator;

export interface InfixOperatorNode extends TreeNode {
    type: InfixOperator;
    left: TreeNode;
    right: TreeNode;
}
export interface NotNode extends TreeNode {
    type: "not";
    expression: TreeNode;
}
export interface LiteralNode extends TreeNode {
    type: "literal";
    value: any;
}
export interface VariableReferenceNode extends TreeNode {
    type: "variable-reference";
    varName: string;
}
export interface DereferenceNode extends TreeNode {
    type: "dereference";
    scopeExpression: TreeNode;
    expression: TreeNode;
}

function shiftExpected(tokens: Token[], expectedToken: Token) {
    const shifted = tokens.shift();
    if (shifted !== expectedToken) {
        throw new Error(`Unexpected token. Got ${shifted}, expected: ${expectedToken}`);
    }
}

function buildAssignment(tokens: Token[], local: boolean): AssignmentNode {
    const varName = tokens.shift()!;
    shiftExpected(tokens, "=");
    const expression = parseNextExpression(tokens);
    return {
        type: "assignment",
        local,
        varName,
        expression
    }
}

function buildFunctionDeclaration(tokens: Token[]): FunctionDeclarationNode | DereferenceNode {
    tokens.shift();
    if(tokens[1] === ":") {
        const scopeExpression: VariableReferenceNode = {
            type: "variable-reference",
            varName: tokens.shift()!
        };
        const expression = buildFunctionDeclaration(tokens);
        return {
            type: "dereference",
            scopeExpression,
            expression
        };
    }

    const name = tokens.shift()!;
    shiftExpected(tokens, "(");
    const parameters: string[] = [];
    while (true) {
        const paramHead = tokens.shift();
        if (paramHead === ")") {
            break;
        }
        if (paramHead !== ",") {
            parameters.push(paramHead!);
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

function buildReturn(tokens: Token[]): ReturnNode {
    tokens.shift();
    return {
        type: "return",
        expression: parseNextExpression(tokens)
    };
}

function isExponentOperator(token: Token): token is ExponentOperator {
    return token === "^";
}

function isProductOperator(token: Token): token is ProductOperator {
    return ["*", "/",  "%"].includes(token);
} 

function isAdditionOperator(token: Token): token is AdditionOperator {
    return ["+", "-"].includes(token);
}

function isInfixOperator(token: Token): token is InfixOperator {
    return isExponentOperator(token) ||
        isProductOperator(token) ||
        isAdditionOperator(token) ||
        token === "or" ||
        token === "and";
}

function parseNextExpression(tokens: Token[]): TreeNode {
    const left = parseNextPrefixExpression(tokens);
    if (isInfixOperator(tokens[0])) {
        const type = tokens.shift()!;
        const right = parseNextExpression(tokens);
        const rightType = right.type;
        const multiplicationOverAddition = isProductOperator(type) && isAdditionOperator(rightType);
        const exponentOverOther = type === "^" && isInfixOperator(rightType);
        const orOverAnd = type === "or" && rightType === "and";
        if ((multiplicationOverAddition || exponentOverOther || orOverAnd)) {
            return {
                type: rightType,
                left: {
                    type,
                    left,
                    right: (right as InfixOperatorNode).left,
                } as InfixOperatorNode,
                right: (right as InfixOperatorNode).right
            } as InfixOperatorNode;
        }
        return {
            type,
            left,
            right
        } as InfixOperatorNode;
    }
    if (tokens[0] === '(' && left.type === "variable-reference") {
        tokens.shift();
        return buildFunctionCall(tokens, left);
    }
    if (tokens[0] === ':' || tokens[0] === ".") {
        tokens.shift();
        return {
            type: "dereference",
            scopeExpression: left,
            expression: parseNextExpression(tokens)
        } as DereferenceNode
    }
    return left;
}

function buildFunctionCall(tokens: Token[], left: TreeNode) {
    const parameters: TreeNode[] = [];
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
    } satisfies FunctionCallNode;
}

function buildParenExpression(tokens: Token[]) {
    shiftExpected(tokens, "(");
    const expression = parseNextExpression(tokens);
    shiftExpected(tokens, ")");
    return {
        type: "block",
        children: [ expression ]
    };
}

function buildNotExpression(tokens: Token[]): NotNode {
    shiftExpected(tokens, "not");
    return {
        type: "not",
        expression: parseNextExpression(tokens)
    };
}

function buildBooleanLiteral(tokens: Token[], value: boolean) {
    tokens.shift();
    return {
        type: "literal",
        value: value
    };
}

function buildStringLiteral(tokens: Token[]) {
    shiftExpected(tokens, '"');
    const value = tokens.shift();
    shiftExpected(tokens, '"');
    return {
        type: "literal",
        value
    };
}

function buildTable(tokens: Token[]): TableNode {
    shiftExpected(tokens, "{");
    const entries: Record<string, TreeNode> = {};
    while (true) {
        if (tokens[0] === "}") {
            tokens.shift();
            break;
        } else if (tokens[0] === ",") {
            tokens.shift();
        } else {
            const key = tokens.shift()!
            shiftExpected(tokens, "=");
            const value = parseNextExpression(tokens);
            entries[key] = value;
        }
    }
    return {
        type: "table",
        entries
    }
}

function parseNextPrefixExpression(tokens: Token[]): TreeNode {
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
        case '{': return buildTable(tokens);
    }

    if (Number.isInteger(Number.parseInt(head))) {
        tokens.shift();
        return {
            type: "literal",
            value: Number.parseInt(head)
        } as LiteralNode
    }

    return {
        type: "variable-reference",
        varName: tokens.shift()!
    } as VariableReferenceNode;
}

export function parse(codeString: string) {
    const tokens = tokenize(codeString);
    const topLevelBlock = {
        type: "block",
        children: []
    } as BlockNode;
    while (tokens.length > 0) {
        topLevelBlock.children.push(parseNextExpression(tokens));
    }

    return topLevelBlock;
}