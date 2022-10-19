test ("nit.Model", async () =>
{
    let checkedConstraints = [];

    const Unique = nit.defineConstraint ("constraints.Unique")
        .throws ("error.not_unique", "The '%{property.name}' has been used.")
        .validate (async function (value)
        {
            checkedConstraints.push (Unique);
            await nit.sleep (20);
            return value != "johndoe";
        })
    ;

    const MinLength = nit.defineConstraint ("constraints.MinLength")
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
        .field ("cred", "string")
            .constraint ("minLength")
    ;


    //----------------------------------
    let user = new User;

    expect (user.username).toBe ("");
    user.username = "johndoe";
    expect (user.username).toBe ("");
    user.cred = "password";

    let error;

    try { await User.validate (user); } catch (e) { error = e; }
    expect (error).toBeInstanceOf (Error);
    expect (error.code).toBe ("error.model_validation_failed");
    expect (checkedConstraints).toEqual ([Unique, MinLength]);

    //----------------------------------
    user.cred = "";
    checkedConstraints = [];
    error = undefined;

    try { await User.validate (user); } catch (e) { error = e; }
    expect (error).toBeInstanceOf (Error);
    expect (checkedConstraints).toEqual ([Unique]);

    //----------------------------------
    error = undefined;

    let ctx = new nit.Model.ValidationContext ();
    try { await User.validate (user, ctx); } catch (e) { error = e; }
    expect (ctx.owner).toBe (user);

    //----------------------------------
    user.username = "";
    checkedConstraints = [];
    error = undefined;

    ctx = new nit.Model.ValidationContext ();
    try { await User.validate (user, ctx); } catch (e) { error = e; }
    expect (checkedConstraints).toEqual ([]);
    expect (ctx.violations[0].code).toBe ("error.value_required");

    //----------------------------------
    let field = User.getField ("username");
    error = undefined;

    User.defineValidationContext (ValidationContext =>
    {
        ValidationContext
            .field ("db", "any")
        ;
    });

    ctx = new User.ValidationContext ();
    ctx.model = user;
    await field.validate ("", ctx);
    expect (ctx.violations[0].code).toBe ("error.value_required");

    //----------------------------------
    user.username = "janedoe";
    user.cred = "123456789012345";
    checkedConstraints = [];
    error = undefined;

    ctx = new nit.Model.ValidationContext ();
    try { await User.validate (user, ctx); } catch (e) { error = e; }
    expect (error).toBeUndefined ();
    expect (checkedConstraints).toEqual ([Unique, MinLength]);

    expect (await User.validate (user)).toBeInstanceOf (nit.Model.ValidationContext);
});


test ("nit.Model.create ()", async () =>
{
    const User = nit.defineModel ("User")
        .field ("<user>", "string")
        .field ("cred", "string")
    ;

    let user;

    expect (User.create ({ user: "john", cred: "1234" }).toPojo ()).toEqual ({ user: "john", cred: "1234" });
    expect (user = User.create ({ cred: "1234" })).toBeInstanceOf (User);

    expect (User.update (user, function (u) { u.cred = 5678; }).cred).toBe ("5678");
});


test ("nit.Model.preValidateField ()", async () =>
{
    nit.defineClass ("transforms.Trans", "nit.Model.Transform")
        .method ("preValidate", function (ctx)
        {
            User.preValidateInvocations.push ({ model: ctx.model });
        })
        .method ("postValidate", function (ctx)
        {
            User.postValidateInvocations.push ({ field: ctx.field });
        })
    ;

    const User = nit.defineModel ("User")
        .field ("<username>", "string")
        .field ("[cred]", "string")
        .do (User =>
        {
            User.preValidateInvocations = [];
            User.postValidateInvocations = [];
        })
        .transform ("trans")
    ;

    let user = new User ("john", "1234");

    await User.validate (user);

    expect (User.preValidateInvocations.length).toBe (1);
    expect (User.preValidateInvocations[0].model).toBe (user);
    expect (User.postValidateInvocations.length).toBe (1);
    expect (User.postValidateInvocations[0].field.name).toBe ("cred");
});
