test ("nit.typedFunc ()", () =>
{
    let func = nit.typedFunc ({ category: "string", unique: "boolean", instance: "object" },
        function (category, unique, instance)
        {
            return { category, unique, instance };
        });

    expect (func ("conditions", { n: "v" }, true)).toEqual ({ category: "conditions", unique: true, instance: { n: "v" } });
});
