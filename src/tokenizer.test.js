import { expect, test } from "vitest";
import { tokenize } from "./tokenizer";

test("simple assignment expression", () => {
    const tokens = tokenize("local x = 5");
    expect(tokens).toEqual(["local", "x", "=", "5"]);
});

test("simple assignment addition function", () => {
    const tokens = tokenize(`
        function add(a, b)
            return a + b
        end
    `);
    expect(tokens).toEqual(["function", "add", "(", "a", ",", "b", ")", "return", "a", "+", "b", "end"]);
});

test("expression with a string that contains spaces", () => {
    const tokens = tokenize(`x = "hello world"`);
    expect(tokens).toEqual(["x", "=", '"', "hello world", '"']);
});

test("other math operators", () => {
    const tokens = tokenize("1 * 2 / 3 - 4 ^ 5");
    expect(tokens).toEqual(["1", "*", "2", "/", "3", "-", "4", "^", "5"]);
});

test.todo("Handle string with quotes in it");