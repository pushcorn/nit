module.exports = function (nit, Self)
{
    return (Self = nit.defineClass ("nit.utils.Templatable"))
        .k ("getter")
        .defineInnerClass ("Transforms")
        .staticProperty ("openTag", "string", "%{")
        .staticProperty ("closeTag", "string", "}")

        .staticMemo ("propertyDescriptors", function ()
        {
            return nit.propertyDescriptors (this.prototype);
        })
        .staticLifecycleMethod ("render", function (templateName)
        {
            var self = this;
            var cls = self.constructor;
            var data = {};

            nit.each.obj (cls.propertyDescriptors, function (d, n)
            {
                if (d.get && d.get[Self.kGetter])
                {
                    return nit.each.SKIP;
                }

                data[n] = self[n];
            });

            return cls[cls.kRender].call (self, cls[templateName], data);
        })
        .onRender (function (template, data)
        {
            var self = this;
            var cls = self.constructor;

            return nit.Template.render (template, data,
            {
                openTag: cls.openTag,
                closeTag: cls.closeTag,
                transforms: cls.Transforms
            });
        })
        .onDefineSubclass (function (Subclass)
        {
            Subclass.defineInnerClass ("Transforms", this.Transforms.name);
        })
        .staticMethod ("template", function (name, template)
        {
            var tn = nit.snakeCase (name).toUpperCase ();

            function getter ()
            {
                return this.constructor.render.call (this, tn);
            }

            nit.dpv (getter, Self.kGetter, true);

            return this.constant (tn, nit.trim.text (template))
                .getter (nit.camelCase (name), getter)
            ;
        })
        .staticMethod ("transform", function (name, transform)
        {
            nit.dpv (this.Transforms, name, transform, true, true);

            return this;
        })
        .transform ("nit", nit)

        .staticMethod ("field", function (spec, type, description, defval) // eslint-disable-line no-unused-vars
        {
            var cls = this;

            Self.superclass.field.apply (cls, arguments);

            var field = cls.getLastField ();
            var method = field.array ? nit.singularize (field.name) : field.name;

            return cls.method ("$" + method, function (value)
            {
                var self = this;
                var fieldClass = field.class;

                if (!field.primitive && !(value instanceof fieldClass))
                {
                    value = nit.new (field.type, arguments);
                }

                if (field.array)
                {
                    this[field.name].push (value);
                }
                else
                {
                    this[field.name] = value;
                }

                return self;
            });
        })
    ;
};
