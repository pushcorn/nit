module.exports = function (nit)
{
    return nit.test.defineStrategy ("Custom")
        .field ("<description>", "string", "The test suite description.")
        .method ("task", function (task)
        {
            return this.given (task);
        })
        .onTest (function (task)
        {
            return task?.call (this, this);
        })
    ;
};
