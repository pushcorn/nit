test ("nit.parseRegExp () converts a RegExp string into the RegExp object.", () =>
{
    expect (nit.parseRegExp ("/[a-z]/g")).toEqual (/[a-z]/g);
    expect (nit.parseRegExp ("ab")).toEqual (/ab/);
});
