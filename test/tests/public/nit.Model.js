test ("nit.Model", async () =>
{
    let checkedConstraints = [];

    const Unique = nit.defineConstraint ("Unique")
        .throws ("error.not_unique", "The '%{property.name}' has been used.")
        .validate (async function (value)
        {
            checkedConstraints.push (Unique);
            await nit.sleep (20);
            return value != "johndoe";
        })
    ;

    const MinLength = nit.defineConstraint ("MinLength")
        .throws ("error.insufficient_length", "The '%{property.name}' is too short.")
        .validate (function (value)
        {
            checkedConstraints.push (MinLength);
            return value.length > 10;
        })
    ;

    const User = nit.defineModel ("User")
        .field ("<username>", "string")
            .constraint ("unique")
        .field ("pass", "string")
            .constraint ("minLength")
    ;


    //----------------------------------
    let user = new User;

    expect (user.username).toBe ("");
    user.username = "johndoe";
    expect (user.username).toBe ("");
    user.pass = "password";

    let ctx = new nit.Model.ValidationContext ();
    let error;

    try { await user.validate (); } catch (e) { error = e; }
    expect (error).toBeInstanceOf (Error);
    expect (error.code).toBe ("error.model_validation_failure");
    expect (checkedConstraints).toEqual ([Unique, MinLength]);

    //----------------------------------
    user.pass = "";
    checkedConstraints = [];
    error = undefined;

    try { await user.validate (); } catch (e) { error = e; }
    expect (error).toBeInstanceOf (Error);
    expect (checkedConstraints).toEqual ([Unique]);

    //----------------------------------
    error = undefined;

    try { await user.validate (ctx); } catch (e) { error = e; }
    expect (ctx.owner).toBe (user);

    //----------------------------------
    user.username = "";
    checkedConstraints = [];
    error = undefined;

    try { await user.validate (); } catch (e) { error = e; }
    expect (checkedConstraints).toEqual ([]);
    expect (error.failures[0].code).toBe ("error.value_required");

    //----------------------------------
    let field = User.getField ("username");
    error = undefined;

    try { await field.validate ("", user); } catch (e) { error = e; }
    expect (error.code).toBe ("error.value_required");

    //----------------------------------
    user.username = "janedoe";
    user.pass = "123456789012345";
    checkedConstraints = [];
    error = undefined;

    try { await user.validate (); } catch (e) { error = e; }
    expect (error).toBeUndefined ();
    expect (checkedConstraints).toEqual ([Unique, MinLength]);
});
