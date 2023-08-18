import { expect, test, vi } from "vitest";
import { executeCode } from "./runtime"

const envHooks = {
    output(val) {
        console.log(val);
    }
}

test("simple addition expression", () => {
    const result = executeCode("1 + 2", envHooks);
    expect(result).toEqual({
        value: 3
    });
});

test.each([
    ["2 - 1", 1],
    ["2 * 2", 4],
    ["2 ^ 2", 4],
    ["8 / 2", 4],
    ["4 % 3", 1],
    ["true and true", true],
    ["true and false", false],
    ["true or true", true],
    ["true or false", true],
    ["false or false", false],
    ["not true", false],
    ["not false", true],
    ["1 + 2 * 3", 7],
    ["local x = 5 x", 5],
    ["x = 5 x", 5],
    ["2 * (2 + 3)", 10],
    [`function foo() 5 end foo()`, 5],
    [`function foo(x) x end foo(5)`, 5],
    [`function foo(x, y) x + y end foo(5, 4)`, 9],

])("evaluate '%s' should result in a literal '%s'", (codeString, expectedValue) => {
    const result = executeCode(codeString, envHooks);
    expect(result).toEqual({
        value: expectedValue
    });
});

test("throws error when variable not found", () => {
    expect(() => executeCode("x", envHooks)).toThrow("Variable not found: x");
});

test("should invoke the print function", () => {
    const env = {
        ...envHooks,
        output: vi.fn()
    };
    const result = executeCode(`print("hello world")`, env);
    expect(env.output).toHaveBeenCalledWith("hello world");
});

