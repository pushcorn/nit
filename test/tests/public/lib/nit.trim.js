test ("nit.trim() removes the leading and trailing spaces from a string.", () =>
{
    expect (nit.trim (3)).toBe ("3");
    expect (nit.trim ()).toBe ("");
    expect (nit.trim (null)).toBe ("");
    expect (nit.trim ("   a   ")).toBe ("a");
    expect (nit.trim ("--a----", "-")).toBe ("a");
});


test ("nit.trim.text () trims a multi-line text block", () =>
{
    expect (nit.trim.text (
    [
    `
    AB
    CD
    `,
    `
    EF
    GH
    `
    ])).toBe (`AB
CD

EF
GH`);

    expect (nit.trim.text (
    `
the only line
    `
    ))
    .toBe ("the only line");

    let key = "mykey";
    let val = "myvalue";

    expect (nit.trim.text`
    KEY=${key}
    VALUE=${val}
    `)
    .toBe (`KEY=mykey
VALUE=myvalue`);

});


test ("nit.trim.stack ()", () =>
{
    var e = new Error;

    expect (nit.trim.stack (e).stack.indexOf (__filename)).toBe (-1);

    e.stack = ["Error: ", "line 1", "line 2", "line 3", "line 4"].join ("\n");

    expect (nit.trim.stack (e, function (l, i) { return i % 2 == 1; }).stack).toBe (`Error: 
line 2
line 4`);

    expect (nit.trim.stack (e, function (l, i, a) { a.push ("new line " + i); return true; }, true).stack).toBe (`new line 0
line 2
new line 1
line 4`);

});
