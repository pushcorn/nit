test ("nit.utils.Tsort", () =>
{
    let tsort = nit.new ("nit.utils.Tsort");
    tsort.addEdge ("a", "b");
    tsort.addEdge ("b", "c");
    expect (tsort.sort ()).toEqual (["a", "b", "c"]);

    tsort = nit.new ("nit.utils.Tsort");
    tsort.add ("b", "a");
    tsort.add ("b", "a1");
    tsort.add ("c", "b");
    tsort.add ("c", "b");
    expect (tsort.sort ()).toEqual (["a", "a1", "b", "c"]);

    tsort = nit.new ("nit.utils.Tsort");
    tsort.addEdge ("b", "a");
    tsort.addEdge ("a", "b");
    expect (() => tsort.sort ()).toThrow (/failed to sort/i);
});
