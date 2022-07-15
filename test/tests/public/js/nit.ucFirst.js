test ("nit.ucFirst () capitalize the first character of a string.", () =>
{
    expect (nit.ucFirst ("aB")).toBe ("AB");
    expect (nit.ucFirst ("AB")).toBe ("AB");
    expect (nit.ucFirst ("123")).toBe ("123");
    expect (nit.ucFirst ("a.b")).toBe ("A.b");
});
