module.exports = function (nit)
{
    return nit.defineConstraint ("AssetPath")
        .throws ("error.invalid_path", "The asset path '%{value}' is invalid.")
        .validate (function (value)
        {
            let file = nit.resolveAsset (value);

            return file && nit.fs.existsSync (file);
        })
    ;
};
