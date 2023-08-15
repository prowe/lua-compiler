
/**
 * 
 * @param {String} codeString 
 * @returns {String[]}
 */
export function tokenize(codeString) {
    const tokens = [];
    let currentToken = "";
    const pushCurrentToken = () => {
        if (currentToken !== "") {
            tokens.push(currentToken);
            currentToken = "";
        }
    };
    let inString = false;
    for (const c of codeString) {
        if (c === '"')  {
            inString = !inString;
            pushCurrentToken();
            tokens.push(c);
        } else if (inString) {
            currentToken += c;
        } else if (c.trim() === "") {
            pushCurrentToken();
        } else if ([",", "(", ")", "+"].includes(c)) {
            pushCurrentToken();
            tokens.push(c);
        } else {
            currentToken += c;
        }
    }
    pushCurrentToken();
    return tokens;
}