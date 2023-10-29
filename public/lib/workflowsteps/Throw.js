module.exports = function (nit)
{
    return nit.defineWorkflowStep ("Throw")
        .field ("<message>", "string", "The error message.", { exprAllowed: true })
        .field ("[code]", "string", "The error code.")
        .onRun (function ()
        {
            var self = this;

            nit.throw ({ code: self.code, message: self.message });
        })
    ;
};
