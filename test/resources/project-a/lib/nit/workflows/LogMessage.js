module.exports = function (nit)
{
    return nit.defineWorkflow ("nit.workflows.LogMessage")
        .config (
        {
            steps:
            {
                type: "log",
                message: "aloha"
            }
        })
    ;
};
