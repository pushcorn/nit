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
