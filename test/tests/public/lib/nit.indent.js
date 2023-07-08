test ("nit.indent ()", () =>
{
    let str = `
AA
BB

CC
DD`;

    let indented = nit.indent (str, "  ", true);

    expect (indented).toBe (`  AA
  BB

  CC
  DD`);

    indented = nit.indent (str, true);

    expect (indented).toBe (`    AA
    BB

    CC
    DD`);

    expect (nit.indent ("AABB")).toBe ("AABB");
});
