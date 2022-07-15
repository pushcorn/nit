test ("nit.indefiniteArticle () returns the indefinite article for a word.", () =>
{
    expect (nit.indefiniteArticle ("sports")).toBe ("a");
    expect (nit.indefiniteArticle ("integer")).toBe ("an");
});
