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

    let Max = nit.defineConstraint ("MaxInt")
        .appliesTo ("integer")
        .throws ("error.greater_than_max", "The value is greater than %{constraint.max}.")
        .property ("max", "integer", 10)
        .validate (function (value, ctx)
        {
            return value * 1 <= ctx.constraint.max;
        })
    ;

    expect (() => field.addConstraint ("UndefCons")).toThrow (/constraint.*not defined/);

    let obj = {};

    field.bind (obj);
    field.addConstraint ("maxInt");
    expect (field.getConstraint ("maxInt")).toBeInstanceOf (Max);
    expect (field.validate (null, obj)).toBeUndefined ();
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

    expect (() => nameField.addConstraint ("maxInt")).toThrow (/constraint.*cannot be applied/);
    expect (nit.Object.getProperties (User.prototype, nit.Field).length).toBe (1);
    expect (nit.Object.getProperties (Student.prototype, nit.Field).length).toBe (2);

    field = new nit.Field ("<height>", "integer");
    field.addConstraint ("maxInt", 300);
    field.bind (obj);
    expect (() => field.validate ("aa", obj)).toThrow (/constraint cannot be applied/);
    expect (() => field.validate ("", obj)).toThrow (/constraint cannot be applied/);
});
