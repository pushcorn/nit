test.method ("nit.utils.Templatable", "template", true)
    .should ("define the template constant and getter")
        .given ("select", "SELECT * FROM %{table}")
        .expectingPropertyToBeOfType ("class.SELECT", "nit.Template")
        .commit ()
;


test.object ("nit.utils.Templatable", { property: "sql", recreate: false })
    .should ("render the defined data")
        .before (s =>
        {
            const Page = nit.defineClass ("test.Page")
                .field ("<number>", "integer?")
                .field ("<size>", "integer?")
                .getter ("sql", function ()
                {
                    return `LIMIT ${this.size} OFFSET ${(this.number - 1) * this.size}`;
                })
            ;

            const Sql = s.class.defineSubclass ("test.Sql")
                .transform ("id", id => `"${id}"`)
                .staticMethod ("sql", function (template)
                {
                    return this.template ("sql", template);
                })
            ;

            const Join = Sql.defineSubclass ("test.Join")
                .sql ("%{#+type}%{type.toUpperCase ()} %{/}JOIN %{table|id} ON %{condition}")
                .field ("<table>", "string")
                .field ("<condition>", "string")
                .field ("[type]", "string")
                    .constraint ("choice", "left", "right")
            ;

            const Select = Sql.defineSubclass ("test.Select")
                .sql (`
                    SELECT *
                    FROM %{table|id}%{#joins}
                      %{sql}%{/}
                    WHERE id = '%{id}'%{#+page}
                    %{page.sql}%{/}
                `)
                .field ("table", "string")
                .field ("joins...", Join.name)
                .field ("page", Page.name)
                .getter ("id", function ()
                {
                    return "a";
                })
            ;

            s.instance = Select ()
                .Table ("users")
                .Join ("roles", "roles.id = users.role_id", "left")
                .Page (3, 10)
            ;
        })
        .returns (nit.trim.text`
            SELECT *
            FROM "users"
              LEFT JOIN "roles" ON roles.id = users.role_id
            WHERE id = 'a'
            LIMIT 10 OFFSET 20
        `)
        .commit ()
;
