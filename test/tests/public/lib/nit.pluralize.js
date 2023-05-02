test ("nit.pluralize ()", () =>
{
    expect (nit.pluralize ("ox")).toBe ("oxen");
    expect (nit.pluralize ("oxen", 1)).toBe ("ox");
    expect (nit.pluralize ("")).toBe ("");
    expect (nit.pluralize ("sheep")).toBe ("sheep");
    expect (nit.pluralize ("myEntry")).toBe ("myEntries");
    expect (nit.pluralize ("MY_ENTRY")).toBe ("MY_ENTRIES");
});
