test ("nit.lcFirst () makes the first character of a string lowercased.", () =>
{
    expect (nit.lcFirst ("aB")).toBe ("aB");
    expect (nit.lcFirst ("AB")).toBe ("aB");
    expect (nit.lcFirst ("123")).toBe ("123");
    expect (nit.lcFirst ("A.b")).toBe ("a.b");
});
