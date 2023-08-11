test ("nit.Field", () =>
{
    let field;

    field = new nit.Field ("name");
    expect (field.name).toBe ("name");
    expect (field.type).toBe ("string");

    field = new nit.Field ("age", "integer", "The age", 10);
    expect (field.defval).toBe (10);
    expect (field.type).toBe ("integer");
    expect (() => field.type = {}).toThrow (/should be a string/);

    expect (() => new nit.Field ("<>")).toThrow (/field name is required/);

    let Max = nit.defineConstraint ("constraints.MaxInt")
        .appliesTo ("integer")
        .throws ("error.greater_than_max", "The value is greater than %{constraint.max}.")
        .property ("max", "integer", 10)
        .onValidate (function (ctx)
        {
            return ctx.value * 1 <= ctx.constraint.max;
        })
    ;

    let Min = nit.defineConstraint ("test.constraints.MinInt")
        .appliesTo ("integer")
        .throws ("error.less_than_min", "The value is less than %{constraint.min}.")
        .property ("min", "integer", 10)
        .onValidate (function (ctx)
        {
            return ctx.value * 1 <= ctx.constraint.min;
        })
    ;

    nit.defineClass ("constraints.InvalidCons");

    expect (() => field.constraint ("UndefCons")).toThrow (/constraint.*not defined/);
    expect (() => field.constraint ("InvalidCons")).toThrow (/not an instance of nit.Constraint/);

    let obj = new nit.Object;

    field.bind (obj);
    field.constraint ("maxInt");
    field.constraint ("test:min-int", { condition: "this.value > 5" });

    expect (field.getConstraint ("max-int")).toBeInstanceOf (Max);
    expect (field.getConstraint ("test:min-int")).toBeInstanceOf (Min);
    expect (field.validate (obj, 3)).toBe (3);
    expect (field.validate (obj, 9)).toBe (9);
    expect (nit.propertyDescriptors (obj).age.get[nit.Object.kProperty]).toBeInstanceOf (nit.Field);
    expect (() => obj.age = "abcd").toThrow (/should be an integer/);
    expect (() => obj.age = 100).toThrow (/greater than 10/);
    obj.age = 5;
    expect (obj.age).toBe (5);
    expect (nit.Object.getProperties (obj, nit.Field)[0]).toBe (field);

    function User () {}
    function Student () {}
    nit.extend (Student, User);
    field.bind (User.prototype);

    let nameField = new nit.Field ("name", "string", "The name");
    nameField.bind (Student.prototype);

    expect (() => nameField.constraint ("maxInt")).toThrow (/constraint.*cannot be applied/);
    expect (nit.Object.getProperties (User.prototype, nit.Field).length).toBe (1);
    expect (nit.Object.getProperties (Student.prototype, nit.Field).length).toBe (2);

    field = new nit.Field ("<height>", "integer");
    field.constraint ("maxInt", 300);
    field.bind (obj);
    expect (() => field.validate (obj, "aa")).toThrow (/constraint cannot be applied/);
    expect (() => field.validate (obj, "")).toThrow (/constraint cannot be applied/);
});


test ("nit.Field - nullable array", () =>
{
    const A = nit.defineClass ("A")
        .field ("[indexes...]", "string?", "The index files")
    ;

    let a = new A;
    expect (a.indexes).toBeUndefined ();

    a = new A ("index.html");
    expect (a.indexes).toEqual (["index.html"]);

    a.indexes = [];
    expect (a.indexes).toEqual ([]);

    a.indexes = undefined;
    expect (a.indexes).toBeUndefined ();

    expect (a.toPojo ()).toEqual ({ indexes: undefined });
});


test ("nit.Field - nullable array", () =>
{
    const B = nit.defineClass ("B")
        .staticProperty ("[indexes...]", "string?")
    ;

    expect (B.indexes).toBeUndefined ();

    B.indexes = [];
    expect (B.indexes).toEqual ([]);

    B.indexes = undefined;
    expect (B.indexes).toBeUndefined ();
});


test ("nit.Field - nullable array", () =>
{
    const C = nit.defineClass ("C")
        .staticProperty ("indexes...", "string?", { defval: ["idx.html"] })
    ;

    expect (C.indexes).toEqual (["idx.html"]);

    C.indexes = undefined;
    expect (C.indexes).toBeUndefined ();

    C.indexes = [];
    expect (C.indexes).toEqual ([]);
});
