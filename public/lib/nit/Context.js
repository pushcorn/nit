module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.Context"))
        .k ("_", "root", "parent", "delegateProperties")
        .staticMethod ("new", function ()
        {
            var cls = this;
            var args = nit.argsToObj (arguments);
            var pargs = nit.each (args, function (v, k)
            {
                if (nit.is.int (k))
                {
                    delete args[k];
                    return v;
                }
                else
                {
                    return nit.each.SKIP;
                }
            });

            var opts = nit.pick (args, cls.propertyNames);
            var data = nit.omit (args, cls.propertyNames);

            return nit.assign (nit.new (cls, pargs.concat (opts)), data);
        })
        .method (Self.kDelegateProperties, function ()
        {
            var self = this;
            var myProps = nit.propertyDescriptors (self, true);
            var parent = self[Self.kParent];

            nit.each (nit.propertyDescriptors (parent, true), function (p, name)
            {
                if (!~name.indexOf (nit.PPP) && !myProps[name])
                {
                    nit.Object.defineDelegate (self, name, Self.kParent + "." + nit.get.escape (name), p.configurable, false);
                }
            });

            return self;
        })
        .property (Self.kParent, Self.name,
        {
            onLink: function ()
            {
                this[Self.kDelegateProperties] ();
            }
        })
        .getter (Self.kRoot, false, false, function ()
        {
            var p = this;

            while (p[Self.kParent])
            {
                p = p[Self.kParent];
            }

            return p;
        })
    ;
};
