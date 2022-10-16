module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.utils.Crypto"))
        .use ("*crypto")
        .staticMethod ("hash", function (algo, data)
        {
            return Self.crypto
                .createHash (algo)
                .update (data, "binary")
                .digest ("hex")
            ;
        })
        .do (Self =>
        {
            ["md5", "sha1", "sha256", "sha512"].forEach (algo =>
            {
                Self.staticMethod (algo, data => Self.hash (algo, data));
            });
        })
    ;
};
