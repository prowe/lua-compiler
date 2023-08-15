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