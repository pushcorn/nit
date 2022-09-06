module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.utils.HelpBuilder"))
        .defineInnerClass ("Block", Block =>
        {
            Block
                .abstractMethod ("build", /* istanbul ignore next */ function (builder) {}) // eslint-disable-line no-unused-vars
            ;
        })
        .defineInnerClass ("Paragraph", Paragraph =>
        {
            Paragraph
                .extend (Self.Block)
                .field ("[text]", "string", "The paragraph content.")
                .method ("build", function ()
                {
                    return this.text;
                })
            ;
        })
        .defineInnerClass ("Table", Table =>
        {
            Table
                .extend (Self.Block)
                .defineInnerClass ("Col", Col =>
                {
                    Col
                        .field ("[text]", "string", "The column content.")
                        .method ("build", function (builder, index)
                        {
                            return nit.rpad (this.text, builder.columnWidths[index], " ");
                        })
                    ;
                })
                .defineInnerClass ("Row", Row =>
                {
                    Row
                        .field ("[cols...]", Table.Col.name, "The columns.")
                        .method ("build", function (builder)
                        {
                            return this.cols
                                .map ((c, i) => c.build (builder, i))
                                .join (builder.columnSeparator)
                            ;
                        })
                    ;
                })
                .field ("<rows...>", Table.Row.name, "The table rows.")

                .method ("build", function (builder)
                {
                    return this.rows
                        .map (r => r.build (builder).replace (/\s*$/, ""))
                        .join ("\n")
                    ;
                })
            ;
        })

        .field ("minColWidth", "integer", "Minimum column width.", 16)
        .field ("columnSeparator", "string", "The column separator.", "  ")
        .field ("blocks...", Self.Block.name, "The content blocks.")

        .memo ("columnWidths", function ()
        {
            let numCols = 0;
            let tables = this.blocks
                .filter (b => b instanceof Self.Table)
                .map (t =>
                {
                    numCols = Math.max (numCols, ...t.rows.map (r => r.cols.length));

                    return t;
                });

            let columnWidths = Array (numCols);

            tables.forEach (t =>
            {
                t.rows.forEach (r =>
                {
                    r.cols.forEach ((c, i) =>
                    {
                        columnWidths[i] = Math.max (this.minColWidth, columnWidths[i] || 0, c.text.length);
                    });
                });
            });

            return columnWidths;
        })

        .method ("paragraph", function (text)
        {
            this.blocks.push (new Self.Paragraph (text));

            return this;
        })
        .method ("table", function (rows)
        {
            this.blocks.push (new Self.Table ({ rows }));

            return this;
        })
        .method ("build", function ()
        {
            return this.blocks
                .map (b => b.build (this))
                .join ("\n\n")
            ;
        })
    ;
};
