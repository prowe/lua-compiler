import { parse } from "./parser";

class Environment {
    constructor() {
        this.stack = [{}];
    }

    evaluateNode(astNode) {
        /** @type {Function} */
        const evaluator = this[astNode.type];
        if (!evaluator) {
            throw new Error("Unknown evaluator for type " + astNode.type);
        }
        return evaluator.call(this, astNode);
    }

    "literal"({value}) {
        return { value };
    }

    "block"({children}) {
        let lastResult = undefined;
        for (const child of children) {
            lastResult = this.evaluateNode(child);
        }
        return lastResult;
    }

    "+"({left, right}) {
        return {
            value: this.evaluateNode(left).value + this.evaluateNode(right).value
        };
    }

    "-"({left, right}) {
        return {
            value: this.evaluateNode(left).value - this.evaluateNode(right).value
        };
    }

    "/"({left, right}) {
        return {
            value: this.evaluateNode(left).value / this.evaluateNode(right).value
        };
    }

    "*"({left, right}) {
        return {
            value: this.evaluateNode(left).value * this.evaluateNode(right).value
        };
    }

    "^"({left, right}) {
        return {
            value: Math.pow(this.evaluateNode(left).value, this.evaluateNode(right).value)
        };
    }

    "%"({left, right}) {
        return {
            value: this.evaluateNode(left).value % this.evaluateNode(right).value
        };
    }

    "and"({left, right}) {
        return {
            value: this.evaluateNode(left).value && this.evaluateNode(right).value
        };
    }

    "or"({left, right}) {
        return {
            value: this.evaluateNode(left).value || this.evaluateNode(right).value
        };
    }

    "not"({expression}) {
        return {
            value: !this.evaluateNode(expression).value
        };
    }
    
    "assignment"({varName, expression}) {
        const result = this.evaluateNode(expression);
        this.stack[0][varName] = result;
        return result;
    }

    "variable-reference"({varName}) {
        for (const frame of this.stack) {
            if(varName in frame) {
                return frame[varName];
            }
        }
        throw new Error(`Variable not found: ${varName}`);
    }
};


export function executeCode(codeString) {
    const ast = parse(codeString);
    const env = new Environment();
    return env.evaluateNode(ast);
}