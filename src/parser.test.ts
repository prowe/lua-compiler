import { expect, test } from "vitest";
import { parse } from "./parser";

test("simple assignment expression", () => {
    const ast = parse("local x = 5");
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "assignment",
                local: true,
                varName: "x",
                expression: {
                    type: "literal",
                    value: 5
                }
            }
        ]
    });
});

test("assignment without the local keyword", () => {
    const ast = parse("x = 5");
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "assignment",
                local: false,
                varName: "x",
                expression: {
                    type: "literal",
                    value: 5
                }
            }
        ]
    });
})

test("throws when = is not present", () => {
    expect(() => parse("local x % 5")).toThrowError("Unexpected token. Got %, expected: =");
});

test("simple assignment addition function", () => {
    const ast = parse(`
        function add(a, b)
            return a + b
        end
    `);
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "function-declaration",
                name: "add",
                parameters: ["a", "b"],
                children: [
                    {
                        type: "return",
                        expression: {
                            type: "+",
                            left: {
                                type: "variable-reference",
                                varName: "a"
                            },
                            right: {
                                type: "variable-reference",
                                varName: "b"
                            }
                        }
                    }
                ]
            }
        ]
    });
});

test("nested addition", () => {
    const ast = parse("a + b + c");
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "+",
                left: {
                    type: "variable-reference",
                    varName: "a"
                },
                right: {
                    type: "+",
                    left: {
                        type: "variable-reference",
                        varName: "b"
                    },
                    right: {
                        type: "variable-reference",
                        varName: "c"
                    }
                }
            }
        ]
    });
});

test("order of operations + then *", () => {
    const ast = parse("5 + 5 * 5");
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "+",
                left: {
                    type: "literal",
                    value: 5
                },
                right: {
                    type: "*",
                    left: {
                        type: "literal",
                        value: 5
                    },
                    right: {
                        type: "literal",
                        value: 5
                    }
                }
            }
        ]
    });
});

test("order of operations * then +", () => {
    const ast = parse("1 * 2 + 3");
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "+",
                left: {
                    type: "*",
                    left: {
                        type: "literal",
                        value: 1
                    },
                    right: {
                        type: "literal",
                        value: 2
                    }
                },
                right: {
                    type: "literal",
                    value: 3
                }
            }
        ]
    });
});

test("division and subtraction", () => {
    const ast = parse("1 / 2 - 3");
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "-",
                left: {
                    type: "/",
                    left: {
                        type: "literal",
                        value: 1
                    },
                    right: {
                        type: "literal",
                        value: 2
                    }
                },
                right: {
                    type: "literal",
                    value: 3
                }
            }
        ]
    });
});

test("calling a function", () => {
    const ast = parse(`doStuff(1 + 2, 7)`)
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "function-call",
                func: {
                    type: "variable-reference",
                    varName: "doStuff"
                },
                parameters: [
                    {
                        type: "+",
                        left: {
                            type: "literal",
                            value: 1
                        },
                        right: {
                            type: "literal",
                            value: 2
                        }
                    },
                    {
                        type: "literal",
                        value: 7
                    }
                ]
            }
        ]
    });
});

test("addition and division", () => {
    const ast = parse("1 / 2 + 3");
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "+",
                left: {
                    type: "/",
                    left: {
                        type: "literal",
                        value: 1
                    },
                    right: {
                        type: "literal",
                        value: 2
                    }
                },
                right: {
                    type: "literal",
                    value: 3
                }
            }
        ]
    });
});

test("addition and modulus", () => {
    const ast = parse("1 % 2 + 3");
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "+",
                left: {
                    type: "%",
                    left: {
                        type: "literal",
                        value: 1
                    },
                    right: {
                        type: "literal",
                        value: 2
                    }
                },
                right: {
                    type: "literal",
                    value: 3
                }
            }
        ]
    });
});

test("exponents in correct order", () => {
    const ast = parse("1 / 2 ^ 3");
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "/",
                left: {
                    type: "literal",
                    value: 1
                },
                right: {
                    type: "^",
                    left: {
                        type: "literal",
                        value: 2
                    },
                    right: {
                        type: "literal",
                        value: 3
                    }
                },
            }
        ]
    });
});

test("exponent order of operations", () => {
    const ast = parse("1 ^ 2 / 3");
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "/",
                left: {
                    type: "^",
                    left: {
                        type: "literal",
                        value: 1
                    },
                    right: {
                        type: "literal",
                        value: 2
                    }
                },
                right: {
                    type: "literal",
                    value: 3
                },
            }
        ]
    });
});

test("exponent over modulus", () => {
    const ast = parse("1 ^ 2 % 3");
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "%",
                left: {
                    type: "^",
                    left: {
                        type: "literal",
                        value: 1
                    },
                    right: {
                        type: "literal",
                        value: 2
                    }
                },
                right: {
                    type: "literal",
                    value: 3
                },
            }
        ]
    });
});

test("parenthesis", () => {
    const ast = parse("1 * ( 2 + 3)");
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "*",
                left: {
                    type: "literal",
                    value: 1
                },
                right: {
                    type: "block",
                    children: [
                        {
                            type: "+",
                            left: {
                                type: "literal",
                                value: 2
                            },
                            right: {
                                type: "literal",
                                value: 3
                            }
                        }
                    ]
                }
            }
        ]
    });
});

test("not operator", () => {
    const ast = parse("not true");
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "not",
                expression: {
                    type: "literal",
                    value: true
                }
            }
        ]
    });
});

test("or operator", () => {
    const ast = parse("true or false");
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "or",
                left: {
                    type: "literal",
                    value: true
                },
                right: {
                    type: "literal",
                    value: false
                }
            }
        ]
    });
});

test("boolean order of operations", () => {
    const ast = parse("true or false and true");
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "and",
                left: {
                    type: "or",
                    left: {
                        type: "literal",
                        value: true
                    },
                    right: {
                        type: "literal",
                        value: false
                    }
                },
                right: {
                    type: "literal",
                    value: true
                }
            }
        ]
    });
});

test("parse string as literal", () => {
    const ast = parse('"hello world"');
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "literal",
                value: "hello world"
            }
        ]
    });
});

test("parse a negative number", () => {
    const ast = parse("-5");
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "literal",
                value: -5
            }
        ]
    });
});

test("simple keyed table", () => {
    const ast = parse("{balance = 6}");
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "table",
                entries: {
                    balance: {
                        type: "literal",
                        value: 6
                    }
                }
            }
        ]
    });
});

test("table with multiple entries", () => {
    const ast = parse(`{balance = 6, name = "blah"}`);
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "table",
                entries: {
                    balance: {
                        type: "literal",
                        value: 6
                    },
                    name: {
                        type: "literal",
                        value: "blah"
                    }
                }
            }
        ]
    });
});

test("method declaration", () => {
    const ast = parse(`function foo:bar(self) end`);
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "dereference",
                scopeExpression: {
                    type: "variable-reference",
                    varName: "foo"
                },
                expression: {
                    type: "function-declaration",
                    name: "bar",
                    parameters: ["self"],
                    children: []
                }
            }
        ]
    });
});

test("method invocation", () => {
    const ast = parse(`foo:bar(1)`);
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "dereference",
                scopeExpression: {
                    type: "variable-reference",
                    varName: "foo"
                },
                expression: {
                    type: "function-call",
                    func: {
                        type: "variable-reference",
                        varName: "bar"
                    },
                    parameters: [
                        {
                            type: "literal",
                            value: 1
                        }
                    ]
                }
            }
        ]
    });
});

test("table propery reference", () => {
    const ast = parse(`foo.bar`);
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "dereference",
                scopeExpression: {
                    type: "variable-reference",
                    varName: "foo"
                },
                expression: {
                    type: "variable-reference",
                    varName: "bar"
                }
            }
        ]
    });
});

test("return early in a block", () => {
    const ast = parse(`return 5`);
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "return",
                expression: {
                    type: "literal",
                    value: 5
                }
            }
        ]
    });
});

test("if statement", () => {
    const ast = parse(`
        if true then
            78
        end
    `);
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "if",
                conditionExpression: {
                    type: "literal",
                    value: true
                },
                children: [
                    {
                        type: "literal",
                        value: 78
                    }
                ]
            }
        ]
    });
});

test("if with else", () => {
    const ast = parse(`
        if true then
            2
        else
            3
        end
    `);
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "if",
                conditionExpression: {
                    type: "literal",
                    value: true
                },
                children: [
                    {
                        type: "literal",
                        value: 2
                    }
                ],
                elseChildren: [
                    {
                        type: "literal",
                        value: 3
                    }
                ]
            }
        ]
    });
});

test("else if", () => {
    const ast = parse(`
        if true then
            2
        elseif false then
            3
        else
            4
        end
    `);
    expect(ast).toEqual({
        type: "block",
        children: [
            {
                type: "if",
                conditionExpression: {
                    type: "literal",
                    value: true
                },
                children: [
                    {
                        type: "literal",
                        value: 2
                    }
                ],
                elseChildren: [
                    {
                        type: "if",
                        conditionExpression: {
                            type: "literal",
                            value: false
                        },
                        children: [
                            {
                                type: "literal",
                                value: 3
                            }
                        ],
                        elseChildren: [
                            {
                                type: "literal",
                                value: 4
                            }
                        ]
                    }
                ]
            }
        ]
    });
});