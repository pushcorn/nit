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
    expect (nullableProp.defval).toBe (0);

    nullableProp = nit.Object.Property.new (A, "port", "integer?");
    expect (nullableProp.defval).toBeUndefined ();

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
        .field ("<obj>", "string|object|function")
    ;

    let a = new A (Array.prototype);

    expect (a.obj).toBe (Array.prototype);
});


test ("nit.Object.Property.set () - should throw if the value is not one of the allowed types", () =>
{
    const A = nit.defineClass ("A")
        .field ("<obj>", "string|object")
    ;

    expect (() => new A (nit.noop)).toThrow (/should be one of/);
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


test ("nit.Object.Property.caster ()", () =>
{
    const A = nit.defineClass ("A")
        .field ("<extensions...>", "string",
        {
            caster: function (v)
            {
                v = nit.trim (v);

                return v[0] != "." ? ("." + v) : v;
            }
        })
    ;

    let a = new A (...["a", "b", "c"]);

    expect (a.extensions).toEqual ([".a", ".b", ".c"]);
});



test ("nit.Object.Property.set () - array", () =>
{
    const A = nit.defineClass ("A")
        .field ("<extensions...>", "string")
    ;

    expect (new A ("a", "b", "c").extensions).toEqual (["a", "b", "c"]);
    expect (new A ("a", "", "c").extensions).toEqual (["a", "c"]);
});


test ("nit.Object.Property - empty args", () =>
{
    const Json = nit.defineClass ("Json")
        .field ("[json]", "any", "The JSON content.")
        .field ("[contentType]", "string", "The content type.", "application/json")
    ;

    expect (new Json ("bb").contentType).toBe ("application/json");
    expect (new Json ("bb", "").contentType).toBe ("");
    expect (new Json ("bb", undefined).contentType).toBe ("application/json");
    expect (new Json ("bb", "text/html").contentType).toBe ("text/html");

    let j = new Json ("bb", "text/html");
    expect (j.contentType).toBe ("text/html");
    j.contentType = null;
    expect (j.contentType).toBe ("application/json");
});


test ("nit.Object.Property - emptyAllowed", () =>
{
    const A = nit.defineClass ("A")
        .field ("words...", "string*")
    ;

    let a = new A ({ words: [3, "9", null, ""] });

    expect (a.words).toEqual (["3", "9", ""]);

    a.words.push (null);
    a.words.push (undefined);
    a.words.push ("");
    expect (a.words).toEqual (["3", "9", "", ""]);

    a.words = null;
    expect (a.words).toEqual ([]);
});


test ("nit.Object.Property - onLink/onUnlink", () =>
{
    const A = nit.defineClass ("A")
        .field ("b", "B",
        {
            onLink: function (b)
            {
                b.linked = true;
            }
            ,
            onUnlink: function (b)
            {
                delete b.linked;
            }
        })
    ;

    const C = nit.defineClass ("C")
        .field ("bs...", "B",
        {
            onLink: function (b)
            {
                b.linked = true;
            }
            ,
            onUnlink: function (b)
            {
                delete b.linked;
            }
        })
    ;

    const B = nit.defineClass ("B");

    let b = new B;
    let a = new A;
    let c = new C;

    a.b = b;
    expect (b.linked).toBe (true);

    a.b = null;
    expect (b.linked).toBeUndefined ();

    c.bs.push (b);
    expect (b.linked).toBe (true);

    c.bs.pop ();
    expect (b.linked).toBeUndefined ();

    c.bs.push (b);
    expect (b.linked).toBe (true);

    nit.arrayRemove (c.bs, b);
    expect (b.linked).toBeUndefined ();
});


test ("nit.Object.Property - backref", () =>
{
    const A = nit.defineClass ("A")
        .field ("[b]", "B", { backref: "a" })
    ;

    const B = nit.defineClass ("B")
        .field ("[a]", "A")
    ;

    let b = new B;
    let a = new A (b);

    expect (a.b.a).toBe (a);
    a.b = null;
    expect (b.a).toBeUndefined ();


    // array
    const AA = nit.defineClass ("AA")
        .field ("[bb...]", "BB", { backref: "aa" })
    ;

    const BB = nit.defineClass ("BB")
        .field ("[aa]", "AA")
    ;

    let bb = new BB;
    let aa = new AA (bb);

    expect (aa.bb[0].aa).toBe (aa);

    aa.bb.pop ();
    expect (bb.aa).toBeUndefined ();

    aa.bb.push (bb);
    expect (bb.aa).toBe (aa);

    aa.bb.shift ();
    expect (bb.aa).toBeUndefined ();

    aa.bb.push (bb);
    expect (bb.aa).toBe (aa);

    aa.bb = [];
    expect (bb.aa).toBeUndefined ();

    // non-object type
    const F = nit.defineClass ("F")
        .field ("[g]", "integer", { backref: "f" })
    ;

    let f = new F (3);
    expect (f.g.f).toBeUndefined ();

    const FF = nit.defineClass ("FF")
        .field ("[gg...]", "function", { backref: "ff" })
    ;

    let g1 = function () {};
    let g2 = function () {};
    let ff = new FF (g1, g2);
    expect (ff.gg[0].ff).toBeUndefined ();

    ff.gg.pop ();
    expect (g1.ff).toBeUndefined ();
    expect (g2.ff).toBeUndefined ();
});


test ("nit.Object - pargs", () =>
{
    const Obj = nit.Object.defineSubclass ("Obj")
        .property ("<vargs...>", "string")
        .property ("<opt1>", "string")
        .property ("[opt2]", "string")
    ;

    let obj = new Obj ("varg", "varg2");

    expect (nit.clone (obj)).toEqual ({ vargs: ["varg"], opt1: "varg2", opt2: "" });

    obj = new Obj ("varg", "varg2", "opt1");
    expect (nit.clone (obj)).toEqual ({ vargs: ["varg"], opt1: "varg2", opt2: "opt1" });

    obj = new Obj ("varg", "varg2", "opt1", "opt2");
    expect (nit.clone (obj)).toEqual ({ vargs: ["varg", "varg2"], opt1: "opt1", opt2: "opt2" });

    expect (Obj.pargNames).toEqual (["vargs", "opt1", "opt2"]);
});
