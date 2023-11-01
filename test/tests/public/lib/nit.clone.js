test ("nit.clone () clones the given object.", () =>
{
    function func () {}

    function A () {}

    A.prototype.prop = "prop";

    function B () {}

    B.prop = "a property";

    function C () {}

    nit.extend (C, A);

    C.prototype.cprop = "a property for C";


    const circular = { name: "circ" };

    circular.self = circular;

    let filter = function ()
    {
        return true;
    };

    filter.circular = () => null;


    expect (nit.clone ([{ a: 3, b: undefined, c: Symbol ("C") }])).toEqual ([{ a: 3 }]);
    expect (nit.clone ({ a: 3, b: func })).toEqual ({ a: 3, b: func });
    expect (nit.clone (new A)).toEqual ({ prop: "prop" });
    expect (nit.clone (new C)).toEqual ({ prop: "prop", cprop: "a property for C" });
    expect (nit.clone (B)).toEqual ({ name: "B", prop: "a property" });

    expect (nit.clone (circular)).toEqual ({ name: "circ", self: "[circular]" });
    expect (nit.clone (circular, filter)).toEqual ({ name: "circ", self: null });

    let error = new Error ("ERR!");
    expect (nit.clone (error).message).toBe ("ERR!");
    expect (nit.clone (error).stack).toMatch (/^Error: ERR/);

    let D = function () { this.a = 1; };
    {
        D.prototype.clone = function () { return { e: 3, f: 4 }; };

        let d = new D ();

        expect (nit.clone (d)).toEqual ({ e: 3, f: 4 });
    }

    let date = new Date ();
    {
        expect (nit.clone (date)).toBe (date);
    }

    let arr = [3];
    {
        arr.prop = "prop";

        let r = [3];
        r.prop = "prop";

        expect (nit.clone (arr)).toEqual (r);
    }

    let shallow = { a: { b: 3 } };
    {
        let cloned = nit.clone.shallow (shallow);

        expect (cloned.a).toBe (shallow.a);
    }

    expect (nit.clone.shallow ([1, 2])).toEqual ([1, 2]);
    expect (nit.clone.shallow (A)).toBe (A);

    expect (nit.clone.filter (Symbol (1))).toBe (false);
    expect (nit.clone.filter (new Int8Array (8))).toBe (false);
    expect (nit.clone.filter (3)).toBe (true);

    expect (nit.clone.data ({ a: 1, b: nit })).toEqual ({ a: 1 });

    filter = (v) => nit.is.not.num (v) || v >= 3;
    {
        expect (nit.clone ({ a: 1, c: 9 }, filter)).toEqual ({ c: 9 });
        expect (nit.clone.data ({ a: 1, c: 9, b: nit }, filter)).toEqual ({ c: 9, b: nit });
    }
});
