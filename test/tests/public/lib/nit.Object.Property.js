test ("nit.Object.Property", () =>
{
    let A = nit.Object.defineSubclass ("A");
    let B = nit.Object.defineSubclass ("B");
    let a = new A;
    let stringProp = nit.Object.Property.new (A, "items...", "string");
    let objProp = nit.Object.Property.new (A, "b", "B");

    nit.dp (A.prototype, stringProp.name, stringProp);
    expect (() => stringProp.cast (a, [])).toThrow (/items.*should be a string/);
    expect (stringProp.get.call (a)).toEqual ([]);
    expect (stringProp.get.call (a)).toEqual ([]);
    expect (stringProp.class).toBeUndefined ();
    expect (objProp.class).toBe (B);

    let funcProp = nit.Object.Property.new (A, "work", "function");
    expect (funcProp.cast (a)).toBeUndefined ();

    let dateProp = nit.Object.Property.new (A, "createdAt", "date");
    dateProp.defval = function () { return new Date; };
    dateProp.getter = function (v)
    {
        dateProp.getter.called = true;

        return v;
    };

    expect (dateProp.get.call (a)).toBeInstanceOf (Date);
    expect (dateProp.getter.called).toBe (true);

    let nameProp = nit.Object.Property.new (A, "<name>", "string");
    nit.dp (A.prototype, nameProp.name, nameProp);

    a.items = "a";
    expect (a.items).toEqual (["a"]);
    a.items = ["a", "b"];
    expect (a.items).toEqual (["a", "b"]);
    a.items.push ("c");
    expect (a.items).toEqual (["a", "b", "c"]);
    a.items.unshift ("0");
    expect (a.items).toEqual (["0", "a", "b", "c"]);

    expect (() => a.name = "").toThrow (/name.*is required/);
    expect (() => a.name = ["a", "b"]).toThrow (/name.*should be a string/);

    a.name = "object a";
    expect (a.name).toBe ("object a");
    expect (() => a.name = "").toThrow (/name.*is required/);

    nameProp.setter = function (s)
    {
        return s + ".";
    };

    a.name = "a";
    expect (a.name).toBe ("a.");

    let emailProp = nit.Object.Property.new (A, "email", "string");
    nit.dp (A.prototype, emailProp.name, emailProp);
    a.email = undefined;
    expect (a.email).toBe ("");

    nit.Field ("email", "string"); // calls prop.get.setDescriptor ()

    expect (() => nit.Object.Property.new (A)).toThrow (/name.*is required/);
    expect (() => nit.Object.Property.new (A, "n", "unkown")).toThrow (/assigned to an invalid type/);

    expect (nit.Object.Property.prototype.cast ()).toBeUndefined ();


    let arrayProp = nit.Object.Property.new (A, "defval", "any");
    nit.dp (A.prototype, arrayProp.name, arrayProp);
    a.defval = [3, 4, 5];
    expect (a.defval).toEqual ([3, 4, 5]);

    let nullableProp = nit.Object.Property.new (A, "port", "integer?", 0);
    expect (nullableProp.defval).toBe (undefined);

    let defvalFuncProp = nit.Object.Property.new (A, "port", "integer", () => 9999);
    expect (defvalFuncProp.defval).toBeInstanceOf (Function);
    nit.dp (A.prototype, defvalFuncProp.name, defvalFuncProp);
    let aa = new A;
    aa.port = null;
    expect (aa.port).toBe (9999);
});


test ("nit.Object.Property.Writer", () =>
{
    let writer = new nit.Object.Property.Writer;

    const A = nit.defineClass ("A")
        .property ("priv", "integer", { writer })
    ;

    let a = new A;

    expect (a.priv).toBe (0);

    a.priv = 99;
    expect (a.priv).toBe (0);

    a.priv = writer.value (100);
    expect (a.priv).toBe (100);
});


test ("nit.Object.Property: push/unshift invalid values", () =>
{
    const B = nit.defineClass ("B") // eslint-disable-line no-unused-vars
        .field ("<val>", "string")
    ;

    const A = nit.defineClass ("A")
        .staticProperty ("bs...", "B")
    ;

    expect (A.bs.push ("a", "b")).toBe (2);
    expect (A.bs.push (null)).toBe (2);

    expect (A.bs.unshift  ("c", "d")).toBe (4);
    expect (A.bs.unshift (null)).toBe (4);
});


test ("nit.Object.Property.set () - should check if the value is the array proto before casting it to an array", () =>
{
    const A = nit.defineClass ("A")
        .field ("<obj>", "any")
            .constraint ("type", "string", "object", "function")
    ;

    let a = new A (Array.prototype);

    expect (a.obj).toBe (Array.prototype);
});


test ("nit.Object.Property.get () - array", () =>
{
    const A = nit.defineClass ("A")
        .staticProperty ("vals...", "RegExp", [/c/, /f/])
        .staticProperty ("ints...", "integer")
        .staticProperty ("ones...", "integer", 1)
        .field ("vals...", "RegExp", "the vals", [/a/, /b/])
    ;

    let a = new A;

    expect (a.vals).toEqual ([/a/, /b/]);
    expect (A.vals).toEqual ([/c/, /f/]);
    expect (A.ints).toEqual ([]);
    expect (A.ones).toEqual ([1]);
});
