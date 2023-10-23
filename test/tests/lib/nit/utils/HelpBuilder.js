test.method ("nit.utils.HelpBuilder", "paragraph")
    .should ("add a paragraph block")
        .given ("The paragraph text")
        .returnsInstanceOf ("nit.utils.HelpBuilder")
        .expectingPropertyToBe ("result.blocks.length", 1)
        .commit ()
;


test.method ("nit.utils.HelpBuilder", "table")
    .should ("add a table block")
        .given ({ cols: ["col 1", "col 2"] })
        .returnsInstanceOf ("nit.utils.HelpBuilder")
        .expectingPropertyToBe ("result.blocks.length", 1)
        .expectingPropertyToBe ("result.blocks.0.rows.0.cols.length", 2)
        .commit ()
;


test.method ("nit.utils.HelpBuilder", "build")
    .should ("build the blocks and return the text")
        .before (s => s.object
            .paragraph ("paragraph 1")
            .table ({ cols: ["col 1", "col 2"] })
        )
        .returns (`paragraph 1

col 1             col 2`)
        .commit ()
;


test.method ("nit.utils.HelpBuilder.Paragraph", "build")
    .should ("return the text for a paragraph")
        .up (s => s.createArgs = "A paragraph")
        .returns ("A paragraph")
        .commit ()
;


test.method ("nit.utils.HelpBuilder.TableRow", "build")
    .should ("return the text for a row")
        .up (s => s.HelpBuilder = nit.utils.HelpBuilder)
        .up (s => s.args = s.builder = new s.HelpBuilder ()
            .table (
            {
                cols:
                [
                    "row 1 col 1",
                    "row 1 col 2"
                ]
            })
            .table (
            {
                cols:
                [
                    "row 2 col 1 -----",
                    "row 2 col 2"
                ]
            })
            .table (
            {
                cols:
                [
                    "row 3 col 1",
                    "row 3 col 2\n[default: 3]"
                ]
            })
            .table (
            {
                cols:
                [
                    "row 4 col 1",
                    "row 4 col 2 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur ut euismod massa, sed consequat purus. Vestibulum rhoncus leo blandit, bibendum tortor quis, pellentesque quam.\n[default: 100]"
                ]
            })
        )
        .before (s => s.object = s.builder.blocks[0])
        .after (s => s.row2 = s.builder.blocks[1].build (s.builder))
        .after (s => s.row3 = s.builder.blocks[2].build (s.builder))
        .after (s => s.row4 = s.builder.blocks[3].build (s.builder))
        .returns ("row 1 col 1        row 1 col 2")
        .expectingPropertyToBe ("row2", "row 2 col 1 -----  row 2 col 2")
        .expectingPropertyToBe ("row3", nit.trim.text (`
        row 3 col 1        row 3 col 2
                           [default: 3]
        `))
        .expectingPropertyToBe ("row4", nit.trim.text (`
        row 4 col 1        row 4 col 2 Lorem ipsum dolor sit amet, consectetur
                           adipiscing elit. Curabitur ut euismod massa, sed consequat
                           purus. Vestibulum rhoncus leo blandit, bibendum tortor quis,
                           pellentesque quam.
                           [default: 100]
        `))
        .commit ()

    .should ("be able to layout rows for a narrow termal")
        .up (() => nit.resetRequireCache ())
        .up (() => process.stdout.columns = 60)
        .up (s => s.HelpBuilder = nit.require ("nit.utils.HelpBuilder"))
        .up (s => s.args = s.builder = new s.HelpBuilder ()
            .table (
            {
                cols:
                [
                    "row 1 col 1 val 1 desc 1",
                    "row 1 col 2"
                ]
            })
            .table (
            {
                cols:
                [
                    "row 2 col 1  val 1 desc 1 -----",
                    "row 2 col 2"
                ]
            })
            .table (
            {
                cols:
                [
                    "row 3 col 1 val 1 desc 1",
                    "row 3 col 2\n[default: 3]"
                ]
            })
            .table (
            {
                cols:
                [
                    "row 4 col 1",
                    "row 4 col 2 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur ut euismod massa, sed consequat purus. Vestibulum rhoncus leo blandit, bibendum tortor quis, pellentesque quam.\n[default: 100]"
                ]
            })
        )
        .before (s => s.object = s.builder.blocks[0])
        .after (s => s.row2 = s.builder.blocks[1].build (s.builder))
        .after (s => s.row3 = s.builder.blocks[2].build (s.builder))
        .after (s => s.row4 = s.builder.blocks[3].build (s.builder))
        .returns (` row 1 col 1 val 1 desc 1
    row 1 col 2
`)
        .expectingPropertyToBe ("row2", ` row 2 col 1  val 1 desc 1 -----
    row 2 col 2
`)
        .expectingPropertyToBe ("row3", ` row 3 col 1 val 1 desc 1
    row 3 col 2
    [default: 3]
`)
        .expectingPropertyToBe ("row4", ` row 4 col 1
    row 4 col 2 Lorem ipsum dolor sit amet, consectetur
    adipiscing elit. Curabitur ut euismod massa, sed
    consequat purus. Vestibulum rhoncus leo blandit,
    bibendum tortor quis, pellentesque quam.
    [default: 100]
`)
        .commit ()
;
