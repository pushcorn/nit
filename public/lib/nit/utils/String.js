module.exports = function (nit)
{
    return nit.defineClass ("nit.utils.String")
        .staticMethod ("intHash", function (str)
        {
            // https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript

            var hash = 0, chr;

            str += "";

            for (var i = 0; i < str.length; i++)
            {
                chr = str.charCodeAt (i);
                hash = ((hash << 5) - hash) + chr;
                hash |= 0; // Convert to 32bit integer
            }

            return hash;
        })
    ;
};
