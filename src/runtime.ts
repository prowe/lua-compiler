import { AssignmentNode, BlockNode, DereferenceNode, FunctionCallNode, FunctionDeclarationNode, InfixOperatorNode, LiteralNode, NotNode, parse, TableNode, TreeNode, VariableReferenceNode } from "./parser";

export interface EvalResult {
    value?: any;
    builtIn?: Function;
    parameters?: FunctionDeclarationNode["parameters"];
    children?: FunctionDeclarationNode["children"];
}

class Environment {
    stack: Record<string, EvalResult>[];

    constructor({output}: EnvHooks) {
        this.stack = [{
            print: {
                builtIn(args: any) {
                    output.call(undefined, ...args);
                    return {value: ""};
                }
            }
        }];
    }

    evaluateNode(astNode: TreeNode): EvalResult {
        /** @type {Function} */
        if (astNode.type in this) {
            const type = astNode.type as keyof Environment;
            const evaluator = this[type] as Function;
            return evaluator.call(this, astNode);
        } else {
            throw new Error("Unknown evaluator for type " + astNode.type);
        }
    }

    "literal"({value}: LiteralNode) {
        return { value };
    }

    "block"({children}: BlockNode) {
        let lastResult = undefined;
        for (const child of children) {
            lastResult = this.evaluateNode(child);
        }
        return lastResult;
    }

    "+"({left, right}: InfixOperatorNode) {
        return {
            value: this.evaluateNode(left).value + this.evaluateNode(right).value
        };
    }

    "-"({left, right}: InfixOperatorNode) {
        return {
            value: this.evaluateNode(left).value - this.evaluateNode(right).value
        };
    }

    "/"({left, right}: InfixOperatorNode) {
        return {
            value: this.evaluateNode(left).value / this.evaluateNode(right).value
        };
    }

    "*"({left, right}: InfixOperatorNode) {
        return {
            value: this.evaluateNode(left).value * this.evaluateNode(right).value
        };
    }

    "^"({left, right}: InfixOperatorNode) {
        return {
            value: Math.pow(this.evaluateNode(left).value, this.evaluateNode(right).value)
        };
    }

    "%"({left, right}: InfixOperatorNode) {
        return {
            value: this.evaluateNode(left).value % this.evaluateNode(right).value
        };
    }

    "and"({left, right}: InfixOperatorNode) {
        return {
            value: this.evaluateNode(left).value && this.evaluateNode(right).value
        };
    }

    "or"({left, right}: InfixOperatorNode) {
        return {
            value: this.evaluateNode(left).value || this.evaluateNode(right).value
        };
    }

    "not"({expression}: NotNode) {
        return {
            value: !this.evaluateNode(expression).value
        };
    }
    
    "assignment"({varName, expression}: AssignmentNode) {
        const result = this.evaluateNode(expression);
        this.stack[0][varName] = result;
        return result;
    }

    "variable-reference"({varName}: VariableReferenceNode) {
        for (const frame of this.stack) {
            if(varName in frame) {
                return frame[varName];
            }
        }
        throw new Error(`Variable not found: ${varName}`);
    }

    "function-declaration"({name, parameters, children}: FunctionDeclarationNode) {
        this.stack[0][name] = {
            parameters,
            children,
        };
    }

    "function-call"({func, parameters}: FunctionCallNode) {
        const funcDeclaration = this.evaluateNode(func);
        this.stack.unshift({});
        const parameterValues = parameters.map(exp => this.evaluateNode(exp));
        if (funcDeclaration.builtIn) {
            const args = parameterValues.map(v => v.value);
            const result = funcDeclaration.builtIn(args);
            this.stack.shift();
            return result;
        }
        if (funcDeclaration.parameters && funcDeclaration.children) {
            funcDeclaration.parameters
                .filter(p => p!== "self")
                .forEach((paramName, index) => {
                this.stack[0][paramName] = parameterValues[index]; 
            });
            if (funcDeclaration.parameters.includes("self")) {
                this.stack[0]["self"] = { value: this.stack[1] };
            }
            const result = this.block({
                type: "block",
                children: funcDeclaration.children
            });
            this.stack.shift();
            return result;
        }
        throw new Error("declaration not callable" + funcDeclaration);
    }

    "table"({entries}: TableNode) {
        const evaluatedEntries = Object.entries(entries)
            .map(([key, valueExp]) => {
                const value = this.evaluateNode(valueExp);
                return [key, value]
            });
        return {
            value: Object.fromEntries(evaluatedEntries)
        }
    }

    "dereference"({scopeExpression, expression}: DereferenceNode) {
        const scopeResult = this.evaluateNode(scopeExpression);
        if (!scopeResult) {
            throw new Error(`Unable to find scope for dereference: ${JSON.stringify(scopeExpression)}`);
        }
        this.stack.unshift(scopeResult.value);
        const evalResult = this.evaluateNode(expression);
        this.stack.shift();
        return evalResult;
    }
};

export interface EnvHooks {
    output: Function;
}

export function executeCode(codeString: string, envHooks: EnvHooks) {
    const ast = parse(codeString);
    console.warn(JSON.stringify(ast, null, 2));
    const env = new Environment(envHooks);
    return env.evaluateNode(ast);
}