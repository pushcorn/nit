module.exports = function (nit)
{
    return nit.defineConstraint ("AssetPath")
        .throws ("error.invalid_path", "The asset path '%{value}' is invalid.")
        .onValidate (function (ctx)
        {
            let file = nit.resolveAsset (ctx.value);

            if (file && nit.fs.existsSync (file))
            {
                if (file != ctx.value)
                {
                    ctx.owner[ctx.property.name] = file;
                }

                return true;
            }
        })
    ;
};
