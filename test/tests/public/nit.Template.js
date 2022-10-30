test ("nit.Template.render () - if", () =>
{
    var tmpl = "{{#?names}}{{#names}}{{.}}, {{/}}{{/}}";
    var expected = "first, last, ";
    var result = nit.Template.render (tmpl, { names: ["first", "last"] });

    expect (result).toBe (expected);
});


test ("nit.Template.render () - object entries", () =>
{
    let object = { firstname: "John", lastname: "Doe" };

    expect (nit.Template.render ("{{#object|nit.entries}}{{$FIRST ? '' : ', '}}{{k}} = {{v}}{{/}}", { object }))
        .toBe ("firstname = John, lastname = Doe")
    ;

    object = { firstname: "John" };

    expect (nit.Template.render ("{{#object|nit.entries}}{{$FIRST ? 'F ' : ', '}}{{k}} = {{v}}{{/}}", { object }))
        .toBe ("F firstname = John")
    ;
});


test ("nit.Template.render () - escaping transform delimiter", () =>
{
    var tmpl = "{{#names}}{{|nit.kababCase|append ('|')}} {{/}}";
    var data = { names: ["JohnDoe", "JaneDoe"] };

    expect (function ()
        {
            return nit.Template.render (tmpl, data,
            {
                transforms:
                {
                    append: function (str, suffix)
                    {
                        return str + suffix;
                    }
                }
            });
        })
        .toThrow (/invalid transform decl/i)
    ;

    tmpl = "{{#names}}{{|nit.kababCase|append ('\\|')}} {{/}}";

    expect (nit.Template.render (tmpl, data,
    {
        transforms:
        {
            append: function (str, suffix)
            {
                return str + suffix;
            }
        }
    })).toBe ("john-doe| jane-doe| ");

});

test ("nit.Template.render () - else", () =>
{
    var tmpl = "{{#?names}}{{.}}, {{:}}no names {{names.length}}{{/}}";
    var expected = "no names 0";
    var result = nit.Template.render (tmpl, { names: [] });

    expect (result).toBe (expected);
});


test ("nit.Template.render () - else", () =>
{
    var tmpl = "{{#+names}}{{names.0}} and {{names.1}}{{:}}no names {{names.length}}{{/}}";
    var expected = "first and last";
    var result = nit.Template.render (tmpl, { names: ["first", "last"] });

    expect (result).toBe (expected);
});


test ("nit.Template.render () - if not", () =>
{
    var tmpl = "{{#?names}}{{names.0}} and {{names.1}}{{/}}";
    var expected = "first and last";
    var result = nit.Template.render (tmpl, { names: ["first", "last"] });

    expect (result).toBe (expected);
});


test ("nit.Template.render () - if empty", () =>
{
    var tmpl = "{{#-names}}no names{{:}}{{names.0}} and {{names.1}}{{/}}";
    var expected = "first and last";
    var result = nit.Template.render (tmpl, { names: ["first", "last"] });

    expect (result).toBe (expected);
});


test ("nit.Template.render () - inline partial", () =>
{
    var tmpl = `
    {{@my-frag}}
        {{#-names}}no names{{:}}{{names.0}} and {{names.1}}{{/}}
    {{/}}

    {{#?names}}{{*my-frag}}{{/}}`;

    var expected = `

            first and last
`;

    var result = nit.Template.render (tmpl, { names: ["first", "last"] });

    expect (result).toBe (expected);
});


test ("nit.Template.render () - inline partial and render", () =>
{
    var tmpl = `
    {{label}}
    {{@*my-frag}}
        {{#-names}}no names{{:}}{{names.0}} and {{names.1}}{{/}}
    {{/}}
    `;

    var expected = `
    Full name:
        first and last
    `;

    var tpl = nit.Template (tmpl);
    var result = tpl.render ({ label: "Full name:", names: ["first", "last"] });

    expect (result).toBe (expected);
    expect (tpl.partials["my-frag"]).toBeInstanceOf (Array);
    expect (tpl.render ({ names: ["one", "two"] }, {}, tpl.partials["my-frag"])).toBe (`        one and two
`);
});


test ("nit.Template.render () - inline partial", () =>
{
    var tmpl = `
    {{@inline-part}}
        {{#-names}}no names{{:}}{{names.0}} and {{names.1}}{{/}}
    {{/}}

    {{#?|len}}{{*inline-part}}{{/}}`;

    var expected = `

            5 and 4
`;

    var result = nit.Template.render (tmpl, { names: ["first", "last"] },
    {
        transforms:
        {
            len: function (d)
            {
                d.names = d.names.map (n => n.length);

                return d;
            }
        }
    });

    expect (result).toBe (expected);
});


test ("nit.Template.render () - partial", () =>
{
    var tmpl = `{{#+names}}{{*my-part}}{{/}}`;
    var expected = `first and last`;

    var result = nit.Template.render (tmpl, { names: ["first", "last"] },
    {
        partials:
        {
            "my-part": `{{#-names}}no names{{:}}{{names.0}} and {{names.1}}{{/}}`
        }
    });

    expect (result).toBe (expected);
});


test ("nit.Template.render () - partial", () =>
{
    var tmpl = `{{#+names}}{{*my-part}}{{/}}`;
    var expected = `first and last`;

    nit.Template.registerPartial ("my-part", `{{#-names}}no names{{:}}{{names.0}} and {{names.1}}{{/}}`);

    var result = nit.Template.render (tmpl, { names: ["first", "last"] });

    expect (result).toBe (expected);
});


test ("nit.Template.render () - partial", () =>
{
    var tmpl = `{{#+names}}{{*my-part2}}{{/}}`;

    expect (() => nit.Template.render (tmpl, { names: ["first", "last"] })).toThrow (/not registered/);
});


test ("nit.Template.render () - partial", () =>
{
    var tmpl = `
    {{@my-part}}test{{/}}
    {{#+names}}{{*my-part}}{{/}}
`;

    expect (() => nit.Template.render (tmpl, { names: ["first", "last"] },
    {
        partials:
        {
            "my-part": `{{#-names}}no names{{:}}{{names.0}} and {{names.1}}{{/}}`
        }

    })).toThrow (/has been used/);
});


test ("nit.Template.render () - partial", () =>
{
    var tmpl = `
    {{@my-part}}test{{/}}
    {{#+names}}{{*my-part}}{{/}}
`;

    nit.Template.registerPartial ("my-part", `{{#-names}}no names{{:}}{{names.0}} and {{names.1}}{{/}}`);

    expect (() => nit.Template.render (tmpl, { names: ["first", "last"] })).toThrow (/has been used/);
});


test ("nit.Template.render () - partial", () =>
{
    var tmpl = `{{#+names}}{{*my-part}}{{/}}`;
    var expected = `first and last`;

    var result = nit.Template.render (tmpl, { names: ["first", "last"] },
    {
        partials:
        {
            "my-part": new nit.Template (`{{#-names}}no names{{:}}{{names.0}} and {{names.1}}{{/}}`).tokens
        }
    });

    expect (result).toBe (expected);
});


test ("nit.Template ()", () =>
{
    const USERS = { users: [{ firstname: "John" }, { firstname: "Jane" }] };

    let template = new nit.Template ("{{#users}}{{firstname}}, {{/}}");

    expect (template.render (USERS)).toBe ("John, Jane, ");

    expect (nit.Template.render (`\\
        {{#?groups}}\\
            {{#groups}}{{name}} {{/}}\\
        {{:}}\\
            {{#users}}{{firstname}} {{/}}\\
        {{/}}`
        ,
        USERS))
        .toBe ("John Jane ");

    expect (() =>
        nit.Template.render (`\\
            {{#?groups}}\\
                {{#groups}}{{name}} {{/}}\\
            {{/}}
            {{/}}`,
            USERS))
        .toThrow (/Unmatched.*closing/);
});


test ("nit.Template () - async rendering", async () =>
{
    async function getNames ()
    {
        await nit.sleep (10);

        return [{ name: "first" }, { name: "second" }];
    }


    async function getGroups ()
    {
        await nit.sleep (5);

        return [{ name: "first group" }, { name: "second group" }];
    }

    let tmpl = new nit.Template (`\\
        {{#|getNames}}{{name}}, {{/}}\\
        {{#|getGroups}}{{name}}, {{/}}\\
`,
    {
        transforms: { getNames, getGroups }
    });

    let result = tmpl.render ();

    expect (result).toBeInstanceOf (Promise);

    result = await result;

    expect (result).toBe ("first, second, first group, second group, ");
});


test ("nit.Template () - cascade async rendering", async () =>
{
    async function getNames ()
    {
        await nit.sleep (10);

        return [{ name: "first" }, { name: "second" }];
    }


    async function getGroups ()
    {
        await nit.sleep (5);

        return [{ name: "first group" }, { name: "second group" }];
    }

    let tmpl = new nit.Template (`\\
        {{#|getNames}}{{name}}, {{/}}\\
        {{#|getGroups|getNames}}{{name}}, {{/}}\\
`,
    {
        transforms: { getNames, getGroups }
    });

    let result = tmpl.render ();

    expect (result).toBeInstanceOf (Promise);

    result = await result;

    expect (result).toBe ("first, second, first, second, ");
});


test ("nit.Template () - async rendering", async () =>
{
    async function getNames ()
    {
        await nit.sleep (10);

        return [{ name: "first" }, { name: "second" }];
    }

    let tmpl = new nit.Template (`\\
        {{@async}}{{#|getNames}}{{name}} {{/}}{{/}}\\
        {{*async}}\\
`,
    {
        transforms: { getNames }
    });

    let result = tmpl.render ();

    expect (result).toBeInstanceOf (Promise);

    result = await result;

    expect (result).toBe ("first second ");
});


test ("nit.Template () - async rendering", async () =>
{
    async function getNames ()
    {
        await nit.sleep (10);

        return [{ name: "first" }, { name: "second" }];
    }

    let tmpl = new nit.Template (`{{|getNames}}`,
    {
        transforms: { getNames }
    });

    let result = tmpl.render ();

    expect (result).toBeInstanceOf (Promise);

    result = await result;

    expect (result).toBe (`[{"name":"first"},{"name":"second"}]`);
});



test ("nit.Template () - transforms", async () =>
{
    let tmpl = new nit.Template ("{{#start|nit.series @(5, $$, 2)}}{{.}}{{#! $LAST }}-{{/}}{{/}}",
    {
        transforms: { nit }
    });

    expect (tmpl.render ({ start: 5 })).toBe ("5-7-9-11-13");
});


test ("nit.Template () - transforms", async () =>
{
    let tmpl = new nit.Template ("{{#size|nit.series (10, 2)}}{{.}}{{#! $LAST }}-{{/}}{{/}}",
    {
        transforms: { nit }
    });

    expect (tmpl.render ({ size: 3 })).toBe ("10-12-14");
});


test ("nit.Template () - invalid expr", () =>
{
    let oldLog = nit.log;
    {
        nit.log = function (e)
        {
            throw e;
        };

        expect (() => nit.Template.render ("{{&a - 3}}", { a: 5 })).toThrow (/bad syntax/i);
    }
    nit.log = oldLog;
});


test ("nit.Template.parseTransform ()", () =>
{
    expect (() => nit.Template.parseTransform ("name (a, b")).toThrow (/invalid.*declaration/i);
    expect (() => nit.Template.parseTransform ("name (a, b)")).toThrow (/transform.*not registered/i);

    expect (nit.Template.parseTransform ("escape", { escape: nit.noop })).toEqual (
    {
        name: "escape",
        customArgs: false,
        args: undefined,
        func: nit.noop
    });
});


test ("nit.Template.registerTransform ()", () =>
{
    nit.Template.registerTransform ("noop", nit.noop);

    expect (nit.Template.TRANSFORMS.noop).toBe (nit.noop);
});


test ("nit.Template.tokenize ()", () =>
{
    expect (nit.Template.tokenize ("{{user.{{current}}.firstname}}")).toEqual (
    [
        [
            "user.",
            ["current"],
            ".firstname"
        ]
    ]);

    expect (nit.Template.tokenize ("{{{{current}}.firstname {{next}}-}}")).toEqual (
    [
        [
            ["current"],
            ".firstname ",
            ["next"],
            "-"
        ]
    ]);

    expect (() => nit.Template.tokenize ("{{user.{{current.firstname}}")).toThrow (/not closed/);
    expect (() => nit.Template.tokenize ("{{{{current.firstname}}")).toThrow (/not closed/);
    expect (nit.Template.tokenize ("{{#a}}{{#b}}{{.}}{{/}}{{/}}")).toEqual ([["#a"], ["#b"], ["."], ["/"], ["/"]]);
    expect (nit.Template.tokenize ("{{a}}")).toBeInstanceOf (Array);
    expect (nit.Template.tokenize ("{{a}}")).toEqual ([["a"]]);
    expect (nit.Template.tokenize ("ab {{a}}")).toEqual (["ab ", ["a"]]);
    expect (nit.Template.tokenize ("[[a]]", "[[", "]]")).toEqual ([["a"]]);
    expect (nit.Template.tokenize ("\\[[a]]", "[[", "]]")).toEqual (["[[a]]"]);
    expect (() => nit.Template.tokenize ("[[a\\]]", "[[", "]]")).toThrow (/not closed/);
});
