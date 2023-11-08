test ("nit.Model", async () =>
{
    let checkedConstraints = [];

    const Unique = nit.defineConstraint ("constraints.Unique")
        .throws ("error.not_unique", "The '%{property.name}' has been used.")
        .onValidate (async function (ctx)
        {
            checkedConstraints.push (Unique);
            await nit.sleep (20);
            return ctx.value != "johndoe";
        })
    ;

    const MinLength = nit.defineConstraint ("constraints.MinLength")
        .throws ("error.insufficient_length", "The '%{property.name}' is too short.")
        .onValidate (function (ctx)
        {
            checkedConstraints.push (MinLength);
            return ctx.value.length > 10;
        })
    ;

    nit.defineModel ("Job")
        .field ("<title>", "string")
    ;

    const User = nit.defineModel ("User")
        .field ("<username>", "string")
            .constraint ("unique")
        .field ("cred", "string")
            .constraint ("minLength")
        .field ("role", "string")
            .constraint ("choice", "user", "manager", "admin")
        .field ("job", "Job")
        .defineValidationContext (Context =>
        {
            Context
                .field ("data", "any")
            ;
        })
        .onPreValidate (function (ctx)
        {
            User.preValidateData = { entity: this, ctx };
        })
        .onValidate (function (ctx)
        {
            User.validateData = { entity: this, ctx };
        })
        .onPostValidate (function (ctx)
        {
            User.postValidateData = { entity: this, ctx };
        })
    ;

    expect (User.fieldMap.job.typeIsModel).toBe (true);
    expect (User.ValidationContext.fieldMap.data).toBeInstanceOf (nit.Field);

    await expect (async () => User.validate ()).rejects.toThrow (/username.*required/is);
    await expect (async () => User.validate (new User ("janedoe", { role: "assistant" }))).rejects.toThrow (/role.*invalid value/);
    await expect (async () => User.validate ({ username: "janedoe", role: "assistant" })).rejects.toThrow (/role.*invalid value/);

    expect (User.preValidateData.entity).toBeInstanceOf (User);
    expect (User.preValidateData.ctx).toBeInstanceOf (User.ValidationContext);
    expect (User.postValidateData.entity).toBeInstanceOf (User);
    expect (User.postValidateData.ctx).toBeInstanceOf (User.ValidationContext);
    expect (User.validateData.entity).toBeInstanceOf (User);
    expect (User.validateData.ctx).toBeInstanceOf (User.ValidationContext);

    //----------------------------------
    let user = new User;

    expect (user.username).toBe ("");
    user.username = "johndoe";
    expect (user.username).toBe ("johndoe");
    user.cred = "password";

    let error;

    try { await User.validate (user); } catch (e) { error = e; }
    expect (error).toBeInstanceOf (Error);
    expect (error.code).toBe ("error.model_validation_failed");
    expect (checkedConstraints).toEqual ([Unique, Unique, Unique, MinLength]);

    //----------------------------------
    user.cred = "";
    checkedConstraints = [];
    error = undefined;

    try { await User.validate (user); } catch (e) { error = e; }
    expect (error).toBeInstanceOf (Error);
    expect (checkedConstraints).toEqual ([Unique]);

    //----------------------------------
    error = undefined;

    let ctx = new User.ValidationContext ();
    try { await User.validate (user, ctx); } catch (e) { error = e; }
    expect (ctx.owner).toBe (user);

    //----------------------------------
    user.username = "";
    checkedConstraints = [];
    error = undefined;

    ctx = new User.ValidationContext ();
    try { await User.validate (user, ctx); } catch (e) { error = e; }
    expect (checkedConstraints).toEqual ([]);
    expect (ctx.violations[0].code).toBe ("error.value_required");

    //----------------------------------
    user.username = "janedoe";
    user.cred = "123456789012345";
    checkedConstraints = [];
    error = undefined;

    ctx = new User.ValidationContext ();
    try { await User.validate (user, ctx); } catch (e) { error = e; }
    expect (error).toBeUndefined ();
    expect (checkedConstraints).toEqual ([Unique, MinLength]);

    expect (await User.validate (user)).toBeInstanceOf (User);
});


test ("nit.Model.validate () - instance constraints handling", async () =>
{
    const Matcher = nit.defineModel ("Matcher")
        .field ("path", "string")
        .field ("pattern", "string")
        .check ("exclusive", "path", "pattern")
    ;

    let m = new Matcher ({ path: "/", pattern: "/*" });
    let error;

    try { await Matcher.validate (m); } catch (e) { error = e; }
    expect (error.context.validationContext.specified).toBe (2);

    let origValidate = nit.Class.validateObject;

    nit.Class.validateObject = function ()
    {
        if (this == Matcher)
        {
            throw new Error ("FAILED!");
        }
    };

    error = null;
    m = new Matcher ({ path: "/" });
    try { await Matcher.validate (m); } catch (e) { error = e; }
    nit.Class.validateObject = origValidate;
    expect (error.context.validationContext.violations[0].constraint).toBe ("");

    //---------------

    const Tag = nit.defineModel ("Tag")
        .field ("<name>", "string")
    ;

    const Capital = nit.defineModel ("Capital")
        .field ("<name>", "string")
        .field ("country", "Country")
        .field ("tags...", "Tag")
    ;

    const Country = nit.defineModel ("Country")
        .field ("<name>", "string")
        .field ("capital", "Capital")
    ;

    let country = new Country ("Taiwan");
    let capital = new Capital ("Taipei");
    let tag = new Tag ("a");

    capital.country = country;
    capital.tags = [tag];
    country.capital = capital;

    expect (Capital.validate (capital)).toBe (capital);
    expect (capital.tags[0].name).toBe ("a");

    capital.tags = [];
    expect (Capital.validate (capital)).toBe (capital);
});


test ("nit.Model.new ()", async () =>
{
    const User = nit.defineModel ("User")
        .field ("<u>", "string")
        .field ("cred", "string")
    ;

    let user;

    expect ((user = await User.new ({ u: "john", cred: "1234" })).toPojo ()).toEqual ({ u: "john", cred: "1234" });
    await expect (async () => User.new ({ cred: "1234" })).rejects.toThrow (/u.*required/);
    expect (User.assign (user, function (u) { u.cred = 5678; }).cred).toBe ("5678");

    expect (() => User.assign (user, { cred: nit.noop }, true)).toThrow (/should be a string/);
});
