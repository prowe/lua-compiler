import { parse } from "./parser";

class Environment {
    /**
     * 
     * @param {{output: Function}} envHooks 
     */
    constructor({output}) {
        this.stack = [{
            print: {
                builtIn(args) {
                    output.call(undefined, ...args);
                    return {value: ""};
                }
            }
        }];
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

    "function-declaration"({name, parameters, children}) {
        this.stack[0][name] = {
            parameters,
            children
        };
    }

    "function-call"({func, parameters}) {
        const funcDeclaration = this.evaluateNode(func);
        this.stack.unshift({});
        const parameterValues = parameters.map(exp => this.evaluateNode(exp));
        if (funcDeclaration.builtIn) {
            const args = parameterValues.map(v => v.value);
            const result = funcDeclaration.builtIn(args);
            this.stack.shift();
            return result;
        }
        funcDeclaration.parameters.forEach((paramName, index) => {
            this.stack[0][paramName] = parameterValues[index]; 
        });
        const result = this.block({children: funcDeclaration.children});
        this.stack.shift();
        return result;
    }
};


export function executeCode(codeString, envHooks) {
    const ast = parse(codeString);
    const env = new Environment(envHooks);
    return env.evaluateNode(ast);
}