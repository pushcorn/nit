test ("nit.Object.Property", () =>
{
    let A = nit.Object.defineSubclass ("A");
    let a = new A;
    let stringProp = nit.Object.Property.createFor (A, "items...", "string");

    nit.dp (A.prototype, stringProp.name, stringProp);
    expect (() => stringProp.cast ([], a)).toThrow (/items.*should be a string/);
    expect (stringProp.get.call (a)).toEqual ([]);
    expect (stringProp.get.call (a)).toEqual ([]);

    let funcProp = nit.Object.Property.createFor (A, "work", "function");
    expect (funcProp.cast (undefined, a)).toBeUndefined ();

    let dateProp = nit.Object.Property.createFor (A, "createdAt", "date");
    dateProp.defval = function () { return new Date; };
    dateProp.getter = function (v)
    {
        dateProp.getter.called = true;

        return v;
    };

    expect (dateProp.get.call (a)).toBeInstanceOf (Date);
    expect (dateProp.getter.called).toBe (true);

    let nameProp = nit.Object.Property.createFor (A, "<name>", "string");
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

    let emailProp = nit.Object.Property.createFor (A, "email", "string");
    nit.dp (A.prototype, emailProp.name, emailProp);
    a.email = undefined;
    expect (a.email).toBe ("");

    nit.Field ("email", "string"); // calls prop.get.setDescriptor ()

    expect (() => nit.Object.Property.createFor (A)).toThrow (/name.*is required/);
    expect (() => nit.Object.Property.createFor (A, "n", "unkown")).toThrow (/assigned to an invalid type/);

    expect (nit.Object.Property.prototype.cast ()).toBeUndefined ();


    let arrayProp = nit.Object.Property.createFor (A, "defval", "any");
    nit.dp (A.prototype, arrayProp.name, arrayProp);
    a.defval = [3, 4, 5];
    expect (a.defval).toEqual ([3, 4, 5]);
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
