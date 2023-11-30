test ("nit.Template.parseBlocks ()", () =>
{
    let tmpl = `{{#name}}
    {{.}}
        {{:title}}
  {{.}}
        {{:}}
no name{{a.b|nit.serialize}}
        {{/}}`;

    tmpl = new nit.Template (tmpl);

    expect (tmpl.render ({ name: "my name" })).toBe ("\n    my name\n");
    expect (tmpl.render ({ title: "my title" })).toBe ("\n  my title\n");
    expect (tmpl.render ()).toBe ("\nno name\n");
});


test ("nit.Template.render () - if", () =>
{
    let tmpl = "{{#?names}}{{#names}}{{.}}, {{/}}{{/}}";
    let expected = "first, last, ";
    let result = nit.Template.render (tmpl, { names: ["first", "last"] });

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


test ("nit.Template.render () - transform property ($)", () =>
{
    [
        "{{#? !$.nit.is.empty.nested (matches) \\|\\| !$.nit.is.empty.nested (conditions)}}do work{{/}}",
        "{{#? !$.nit.is.empty.nested ([matches, conditions])}}do work{{/}}",
        "{{#+ [matches, conditions]}}do work{{/}}"
    ]
    .forEach (tmpl =>
    {
        expect (nit.Template.render (tmpl)).toBe ("");
        expect (nit.Template.render (tmpl, { matches: {} })).toBe ("");
        expect (nit.Template.render (tmpl, { matches: {}, conditions: "" })).toBe ("");
        expect (nit.Template.render (tmpl, { matches: {}, conditions: "cond" })).toBe ("do work");
        expect (nit.Template.render (tmpl, { matches: { a: 1 }, conditions: "cond" })).toBe ("do work");
        expect (nit.Template.render (tmpl, { matches: { a: 1 }, conditions: "" })).toBe ("do work");
    });
});


test ("nit.Template.render () - escaping transform delimiter", () =>
{
    let tmpl = "{{#names}}{{|nit.kababCase|append ('|')}} {{/}}";
    let data = { names: ["JohnDoe", "JaneDoe"] };

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
    let tmpl = "{{#?names}}{{.}}, {{:}}no names {{names.length}}{{/}}";
    let expected = "no names 0";
    let result = nit.Template.render (tmpl, { names: [] });

    expect (result).toBe (expected);
});


test ("nit.Template.render () - else", () =>
{
    let tmpl = "{{#+names}}{{names.0}} and {{names.1}}{{:}}no names {{names.length}}{{/}}";
    let expected = "first and last";
    let result = nit.Template.render (tmpl, { names: ["first", "last"] });

    expect (result).toBe (expected);
});


test ("nit.Template.render () - if not", () =>
{
    let tmpl = "{{#?names}}{{names.0}} and {{names.1}}{{/}}";
    let expected = "first and last";
    let result = nit.Template.render (tmpl, { names: ["first", "last"] });

    expect (result).toBe (expected);
});


test ("nit.Template.render () - if empty", () =>
{
    let tmpl = "{{#-names}}no names{{:}}{{names.0}} and {{names.1}}{{/}}";
    let expected = "first and last";
    let result = nit.Template.render (tmpl, { names: ["first", "last"] });

    expect (result).toBe (expected);
});


test ("nit.Template.render () - inline partial", () =>
{
    let tmpl = `
    {{@my-frag}}
        {{#-names}}no names{{:}}{{names.0}} and {{names.1}}{{/}}
    {{/}}

    {{#?names}}{{*my-frag}}{{/}}`;

    let result = nit.Template.render (tmpl, { names: ["first", "last"] });

    expect (result).toBe (`



first and last
`);
});


test ("nit.Template.render () - optional partial expansion", () =>
{
    let tmpl = `1234
{{*?optional}}5678`;

    expect (nit.Template.render (tmpl)).toBe (`1234
5678`);
});


test ("nit.Template.render () - inline partial and render", () =>
{
    let tmpl = `{{label}}

    {{@*my-frag}}
        {{#-names}}no names{{:}}{{names.0}} and {{names.1}}{{/}}
    {{/}}
    `;

    let expected = `Full name:


first and last

    `;

    let tpl = nit.Template (tmpl);
    let result = tpl.render ({ label: "Full name:", names: ["first", "last"] });

    expect (result).toBe (expected);
    expect (tpl.partials["my-frag"]).toBeInstanceOf (Array);
    expect (tpl.render ({ names: ["one", "two"] }, {}, tpl.partials["my-frag"])).toBe ("\none and two\n");
});


test ("nit.Template.render () - inline partial", () =>
{
    let tmpl = `
    {{@inline-part}}
        {{#-names}}no names{{:}}{{names.0}} and {{names.1}}{{/}}
    {{/}}

    {{#?|len}}{{*inline-part}}{{/}}`;

    let expected = `



5 and 4
`;

    let result = nit.Template.render (tmpl, { names: ["first", "last"] },
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
    let tmpl = `{{#+names}}{{*my-part}}{{/}}`;
    let expected = `first and last`;

    let result = nit.Template.render (tmpl, { names: ["first", "last"] },
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
    let tmpl = `{{#+names}}{{*my-part}}{{/}}`;
    let expected = `first and last`;

    nit.Template.registerPartial ("my-part", `{{#-names}}no names{{:}}{{names.0}} and {{names.1}}{{/}}`);

    let result = nit.Template.render (tmpl, { names: ["first", "last"] });

    expect (result).toBe (expected);
});


test ("nit.Template.render () - partial", () =>
{
    let tmpl = `{{#+names}}{{*my-part2}}{{/}}`;

    expect (() => nit.Template.render (tmpl, { names: ["first", "last"] })).toThrow (/not registered/);
});


test ("nit.Template.render () - partial", () =>
{
    let tmpl = `
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
    let tmpl = `
    {{@my-part}}test{{/}}
    {{#+names}}{{*my-part}}{{/}}
`;

    nit.Template.registerPartial ("my-part", `{{#-names}}no names{{:}}{{names.0}} and {{names.1}}{{/}}`);

    expect (() => nit.Template.render (tmpl, { names: ["first", "last"] })).toThrow (/has been used/);
});


test ("nit.Template.render () - partial", () =>
{
    let tmpl = `{{#+names}}{{*my-part}}{{/}}`;
    let expected = `first and last`;

    let result = nit.Template.render (tmpl, { names: ["first", "last"] },
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
    nit.debug ("nit.Template");

    let error;

    test.mock (nit, "log", function ()
    {
        error = arguments[1];
    });

    nit.Template.render ("{{&a - 3}}", { a: 5 });

    nit.debug.PATTERNS = [];

    expect (error.message).toMatch (/bad syntax/i);
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


test ("nit.Template.untokenize ()", () =>
{
    let tmpl = `
    {{@*layout}}
    <html>
        <head></head>
        <body>
            {{*content}}
            {{#? a}}
                large
            {{:? b > 4}}
        medium
            {{:}}
small
            {{/}}
        </body>
    </html>
    {{/}}
--
    {{@content}}
    this is content
    {{firstname|nit.camelCase}}
        {{#emails}}{{/}}
        {{#-names}}no names{{:}}{{names.0}} and {{names.1}}{{/}}
        {{@*title}}
            Title: {{.}}
        {{/}}
    {{/}}
    `;

    let t = new nit.Template (tmpl, false);
    let parts =
    {
        title: "Title: {{.}}"
    };

    [parts.layout, parts.content] = tmpl
        .split ("--")
        .map (t => nit.trim (t).split ("\n").slice (1, -1).join ("\n"))
        .map (t => nit.trim (t))
    ;

    for (let n in t.partials)
    {
        let token = t.partials[n];

        expect (nit.trim (nit.Template.untokenize (token))).toBe (parts[n]);
    }
});
