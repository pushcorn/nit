module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.utils.HelpBuilder"))
        .constant ("TERM_WIDTH", nit.coalesce (process.stdout.columns, 80))
        .constant ("NEWLINE", `<NL-${nit.uuid ()}>`)
        .defineInnerClass ("Block", Block =>
        {
            Block
                .lifecycleMethod ("build", true) // onBuild (builder, index)
            ;
        })
        .staticMethod ("defineBlock", function (name, builder)
        {
            return this.defineInnerClass (name, Self.Block.name, builder);
        })
        .defineBlock ("Paragraph", Paragraph =>
        {
            Paragraph
                .field ("[text]", "string", "The paragraph content.")
                .onBuild (function ()
                {
                    return this.text;
                })
            ;
        })
        .defineBlock ("TableRow", TableRow =>
        {
            TableRow
                .field ("[cols...]", "string", "The columns.")
                .staticMethod ("buildText", function (indent, tokens)
                {
                    let text = "";
                    let index = 0;
                    let newline = true;

                    while (tokens.length)
                    {
                        let token = tokens.shift ();

                        if (!newline)
                        {
                            text += " ";
                            ++index;
                        }
                        else
                        {
                            newline = false;
                        }

                        if (token == Self.NEWLINE)
                        {
                            text = text.replace (/\s+$/, "");
                            text += "\n" + indent;
                            index = indent.length;
                            newline = true;
                        }
                        else
                        if (index + token.length <= Self.TERM_WIDTH)
                        {
                            text += token;
                            index += token.length;
                        }
                        else
                        {
                            text = text.replace (/\s+$/, "");
                            text += "\n" + indent + token;
                            index = indent.length + token.length;
                        }
                    }

                    return text;
                })
                .staticMethod ("buildNarrow", function (builder, cols)
                {
                    let tokens = [" " + cols[0].trim (), Self.NEWLINE, ...nit.coalesce (cols[1], "").replace (/\n/g, " " + Self.NEWLINE + " ").split (/\s/)];
                    let indent = builder.columnSeparator + builder.columnSeparator;

                    return TableRow.buildText (indent, tokens) + "\n";
                })
                .staticMethod ("buildWide", function (builder, cols)
                {
                    let firstWidth = builder.columnWidths[0];
                    let tokens = [nit.rpad (cols[0], firstWidth, " ") + builder.columnSeparator.slice (1), ...nit.coalesce (cols[1], "").replace (/\n/g, " " + Self.NEWLINE + " ").split (/\s/)];
                    let indent = nit.rpad (" ", firstWidth, " ") + builder.columnSeparator;

                    return TableRow.buildText (indent, tokens);
                })
                .onBuild (function (builder)
                {
                    if (Self.TERM_WIDTH < builder.columnWidths[0] * 2 + builder.columnSeparator.length)
                    {
                        return TableRow.buildNarrow (builder, this.cols);
                    }
                    else
                    {
                        return TableRow.buildWide (builder, this.cols);
                    }
                })
            ;
        })
        .defineBlock ("Table", Table =>
        {
            Table
                .field ("<rows...>", Self.TableRow.name, "The table rows.")
                .onBuild (function (builder)
                {
                    return this.rows
                        .map (r => r.build (builder).replace (/[ ]*$/, ""))
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
                        columnWidths[i] = Math.max (this.minColWidth, columnWidths[i] || 0, c.length);
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
