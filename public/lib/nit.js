(function (factory, getGlobal, getPromise, getSubscript)
{
    var global = getGlobal ();

    function nit () {}

    factory (nit, global, getPromise (), getSubscript ());


    if (global.document)
    {
        global.nit = nit;

        nit.dpv (global, "module", {}, true);

        nit.dp (global.module, "exports",
        {
            configurable: true,
            set: function (builder)
            {
                nit.ns.invoke (builder);
            }
        });
    }

    nit.set (module, "exports", nit);

}) (
function (nit, global, Promise, subscript, undefined) // eslint-disable-line no-shadow-restricted-names
{
    Error.stackTraceLimit = 100; // or Infinity;

    var OBJECT = Object;
    var OBJECT_PROTO = Object.prototype;
    var PROTO = OBJECT.getPrototypeOf.bind (OBJECT);
    var OBJECT_CREATE = OBJECT.create.bind (OBJECT);
    var ARR_PROTO = Array.prototype;
    var ARR_SLICE = ARR_PROTO.slice;
    var ARRAY = ARR_SLICE.call.bind (ARR_SLICE);
    var TYPED_ARRAY = PROTO (Int8Array.prototype).constructor;
    var NIT = "nit";
    var EUC = encodeURIComponent;
    var READY = false;
    var PROPERTY_WRITER;


    //--------------------------------------------
    // Base utility methods
    //--------------------------------------------

    nit.dp = OBJECT.defineProperty.bind (OBJECT);


    nit.dpg = function (o, p, getter, configurable, enumerable)
    {
        return nit.dp (o, p,
        {
            get: typeof getter == "function" ? getter : function () { return getter; },
            configurable: configurable,
            enumerable: enumerable === undefined ? configurable : enumerable
        });
    };


    nit.dpgs = function (o, gs, configurable, enumerable)
    {
        for (var p in gs)
        {
            nit.dpg (o, p, gs[p], configurable, enumerable);
        }

        return o;
    };


    nit.dpv = function (o, p, v, configurable, enumerable)
    {
        if (typeof v == "function"
            && !v.name
            && typeof p == "string"
            && p.indexOf (nit.PPP) != 0)
        {
            nit.dpv (v, "name", p, true, false);
        }

        return nit.dp (o, p,
        {
            value: v,
            configurable: configurable,
            enumerable: enumerable === undefined ? configurable : enumerable,
            writable: configurable
        });
    };


    nit.dpvs = function (o, vs, configurable, enumerable)
    {
        for (var p in vs)
        {
            nit.dpv (o, p, vs[p], configurable, enumerable);
        }

        return o;
    };

    nit.dpvs (nit,
    {
        ARG_EXPANDERS: {},
        CLASSES: {},
        CLASS_NAME_PATTERN: /^([a-zA-Z][a-zA-Z0-9]*\.)*([A-Z][a-z0-9]*)+$/,
        CLASS_REF_PATTERN: /^@([a-zA-Z][a-zA-Z0-9]*\.)*([A-Z][a-z0-9]*)+$/,
        CLASS_TAG: "@class",
        COMPONENT_DESCRIPTORS: {},
        CONFIG: {},
        ERROR_CODE_PATTERN: /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$/,
        EXPANDABLE_ARG_PATTERN: /\.\.(([a-z][a-z0-9_$]+)(\|[a-z][a-z0-9_$]+)*)(!?)$/i,
        PPP: "$__", // private property prefix
        IGNORED_PROPS: OBJECT.keys (OBJECT.getOwnPropertyDescriptors (OBJECT_PROTO)).concat ("global"),
        IGNORED_FUNC_PROPS: OBJECT.keys (OBJECT.getOwnPropertyDescriptors (Function.prototype)).concat ("prototype"),
        IGNORED_ARRAY_PROPS: OBJECT.keys (OBJECT.getOwnPropertyDescriptors (ARR_PROTO)),
        DATE_TIME_FORMAT_OPTIONS:
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            fractionalSecondDigits: undefined,
            timeZoneName: "longOffset"
        }
    });


    nit.dpvs (nit,
    {
        ENV: {},
        NS: { nit: nit }

    }, true, false);


    nit.dpgs (nit,
    {
        READY: function ()
        {
            return READY;
        }

    }, true);


    nit.dpg (nit, "stack", function ()
    {
        return new Error ().stack.split ("\n").slice (2).join ("\n");
    });


    nit.noop  = function () {};


    nit.do = function (obj, cb)
    {
        if (!cb && nit.is.func (obj))
        {
            cb = obj;
            obj = nit;
        }

        var result = cb.call (obj, obj);

        return result === undefined ? obj : result;
    };


    nit.sleep = function (timeout, cb)
    {
        return new Promise (function (resolve, reject)
        {
            setTimeout (function ()
            {
                try
                {
                    resolve (cb && cb ()); // eslint-disable-line callback-return
                }
                catch (e)
                {
                    reject (e);
                }

            }, timeout);
        });
    };


    nit.expr = subscript;


    nit.eval = function (expr, data)
    {
        return nit.expr (expr) (data);
    };


    nit.sanitizeVarName = function (name)
    {
        return name.replace (nit.sanitizeVarName.PATTERN, "_");
    };


    nit.sanitizeVarName.PATTERN = /[^0-9a-z_$]/ig;


    nit.uuid = function (dashed)
    {
        var uuid, f, c;

        if ((c = global.crypto))
        {
            if ((f = c.randomUUID))
            {
               uuid = f.call (c);
            }
            else
            if ((f = c.getRandomValues) && typeof Uint8Array != undefined)
            {
                // https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid

                uuid = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace (/[018]/g, function (v)
                {
                    return (v ^ f.call (c, new Uint8Array(1))[0] & 15 >> v / 4).toString (16);
                });
            }
        }

        if (!uuid)
        {
            // https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid#answer-8809472
            var d = Date.now ();
            var d2 = ((typeof performance !== "undefined") && performance.now && (performance.now () * 1000)) || 0;

            f = global.Math.random;
            uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace (/[xy]/g, function (c)
            {
                var r = f () * 16;

                if (d > 0)
                {
                    r = (d + r) %16 | 0;
                    d = Math.floor (d/16);
                }
                else
                {
                    r = (d2 + r) %16 | 0;
                    d2 = Math.floor (d2/16);
                }

                return (c === "x" ? r : (r & 0x3 | 0x8)).toString (16);
            });
        }

        return dashed ? uuid : uuid.replace (/-/g, "");
    };


    nit.string = function (v)
    {
        try
        {
            return v + "";
        }
        catch (e)
        {
            return OBJECT_PROTO.toString.call (v);
        }
    };


    nit.trim = function (s, chars)
    {
        s = s === null || s === undefined ? "" : nit.string (s);

        return s.replace (chars ? new RegExp ("^[" + chars + "]+|[" + chars + "]+$", "g") : nit.trim.PATTERN, "");
    };


    nit.trim.text = function (text) // to be used with template literals
    {
        if (text instanceof Array)
        {
            var args = nit.array (arguments).slice (1);

            text = nit.each (text, function (t, i)
            {
                var arg = args[i];

                return t + (nit.is.undef (arg) ? "" : arg);

            }).join ("");
        }

        var t = nit.trim (text, "\n");
        var leadingSpace = Array (t.length).join (" ");
        var first, last;

        return t
            .split ("\n")
            .map (function (l, i)
            {
                if (l.trim ())
                {
                    if (first === undefined)
                    {
                        first = i;
                        last = i;
                    }
                    else
                    {
                        last = i;
                    }
                }

                return l;
            })
            .filter (function (l, i) { return i >= first && i <= last; })
            .map (function (l)
            {
                var s = l.match (/^\s*/)[0];

                leadingSpace = l.trim () && s.length < leadingSpace.length ? s : leadingSpace;

                return { l: l.slice (s.length), s: s };
            })
            .map (function (ls) { return ls.s.slice (leadingSpace.length) + ls.l; })
            .join ("\n")
            .trim ()
        ;
    };


    nit.trim.PATTERN = /^\s+|\s+$/g;


    nit.createFunction = function (name, body, argNames, context)
    {
        name = nit.trim (name);
        argNames = (argNames || []).join (", ");
        context = context || {};
        context.nit = nit;

        var construct;
        var sn = nit.sanitizeVarName (name);

        if ((nit.is.func (body) && (construct = body)) || body === true)
        {
            body = "return nit.constructObject (" + sn + ", this, arguments);";
        }
        else
        {
            body = body || "";
        }

        var fps = OBJECT.keys (context).concat ("return function " + sn + " (" + argNames + ") { " + body + " };");
        var fvs = nit.values (context);
        var func = Function.apply (null, fps).apply (null, fvs); // eslint-disable-line no-new-func

        if (construct)
        {
            nit.dpv (func, "constructObject", construct, true, false);
        }

        return nit.dpv (func, "name", name, true, false);
    };


    nit.constructObject = function (cls, obj, args)
    {
        if (typeof cls == "object")
        {
            args = obj;
            obj = cls;
            cls = obj.constructor;
        }

        var that = obj; // the original this

        if (!(obj instanceof cls))
        {
            obj = OBJECT_CREATE (cls.prototype);
        }

        if (cls.constructObject)
        {
            obj = cls.constructObject (obj, ARRAY (args || []), that) || obj;
        }

        return obj;
    };


    // https://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically
    nit.funcArgNames = function (func)
    {
        var me = nit.funcArgNames;

        func = (func + "").replace (me.STRIP_PATTERN, "");
        func = func.split (")", 1)[0].split ("(", 2).pop ().trim ();

        return func ? func.split (me.DELIMITER_PATTERN) : [];
    };


    nit.funcArgNames.STRIP_PATTERN = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,)]*))/mg;
    nit.funcArgNames.DELIMITER_PATTERN = /\s*,\s*/;


    nit.extend = function (subclass, superclass)
    {
        var proto = subclass.prototype = OBJECT_CREATE (superclass.prototype);

        OBJECT.setPrototypeOf (subclass, superclass);

        nit.dpv (proto, "constructor", subclass, true, false);

        return subclass;
    };


    nit.getSuperclass = function (cls)
    {
        var proto = cls && cls.prototype;

        proto = proto && PROTO (proto);

        if (proto && proto != OBJECT_PROTO)
        {
            return proto.constructor;
        }
    };


    nit.classChain = function (cls)
    {
        cls = typeof cls == "object" ? cls.constructor : cls;

        var chain = [];
        var sc = cls;

        do
        {
            chain.push (sc);
            sc = nit.getSuperclass (sc);
        }
        while (sc && sc != OBJECT);

        return chain;
    };


    nit.propertyDescriptors = function (obj, all)
    {
        var descriptors = {};
        var chain = [];
        var o;

        for (o = obj; o && o != OBJECT_PROTO; o = PROTO (o))
        {
            chain.unshift (o);
        }

        while ((o = chain.shift ()))
        {
            var ds = OBJECT.getOwnPropertyDescriptors (o);
            var ignored = typeof o == "function" ? nit.IGNORED_FUNC_PROPS : nit.IGNORED_PROPS;

            for (var n in ds)
            {
                if ((all || ds[n].enumerable) && !~ignored.indexOf (n))
                {
                    delete descriptors[n];
                    descriptors[n] = ds[n];
                }
            }
        }

        return descriptors;
    };


    nit.copyProperties = function (source, target, exclusions, overwrite)
    {
        var sourceProps = nit.propertyDescriptors (source, true);
        var targetProps = nit.propertyDescriptors (target, true);

        exclusions = exclusions || [];

        nit.each.obj (sourceProps, function (p, n)
        {
            if ((overwrite || !(n in targetProps)) && !~exclusions.indexOf (n))
            {
                nit.dp (target, n, p);
            }
        });
    };


    nit.mix = function (target, source, exclusions)
    {
        if (source.mix)
        {
            source.mix (target, exclusions);
        }
        else
        {
            nit.copyProperties (source, target, exclusions);
            nit.copyProperties (source.prototype, target.prototype, exclusions);
        }

        return target;
    };


    nit.kvSplit = function (str, delimiter, fromEnd)
    {
        delimiter = delimiter || " ";

        var idx = str[fromEnd ? "lastIndexOf" : "indexOf"] (delimiter);

        return ~idx ? [str.slice (0, idx), str.slice (idx + 1)] : (fromEnd ? ["", str] : [str]);
    };


    nit.lpad = function (str, length, padStr)
    {
        return (Array (length).join (padStr === undefined ? 0 : padStr) + str).slice (-length);
    };


    nit.rpad = function (str, length, padStr)
    {
        return (str + Array (length).join (padStr === undefined ? 0 : padStr)).slice (0, length);
    };


    nit.keys = function (obj, all)
    {
        return Object.keys (nit.propertyDescriptors (obj, all));
    };


    nit.values = function (obj, all)
    {
        return nit.keys (obj, all).map (function (k) { return obj[k]; });
    };


    nit.index = function (arr, key, val)
    {
        var indexed = {};

        if (nit.is.obj (arr))
        {
            arr = nit.values (arr);
        }

        if (!arr || !arr.length)
        {
            return indexed;
        }

        var hasVal = arguments.length > 2;

        for (var i = 0; i < arr.length; ++i)
        {
            var v = arr[i];
            var k = nit.is.func (key) ? key (v, i) : (key ? v[key] : v);

            indexed[k] = hasVal ? (nit.is.func (val) ? val (v, i) : val) : v;
        }

        return indexed;
    };


    nit.assign = function (target)
    {
        target = target || {};

        var args = ARRAY (arguments);
        var filter;

        if (args.length > 2 && nit.is.func (args.slice (-1)[0]))
        {
            filter = args.pop ();
        }

        for (var i = 1, j = args.length; i < j; ++i)
        {
            var src = args[i];

            if (src)
            {
                nit.keys (src).forEach (function (k)
                {
                    var v = src[k];

                    if (!filter || filter (v, target[k], k))
                    {
                        target[k] = v;
                    }
                });
            }
        }

        return target;
    };


    nit.assign.defined = function ()
    {
        var args = ARRAY (arguments).concat (nit.is.not.undef);

        return nit.assign.apply (nit, args);
    };


    nit.o = nit.object = function ()
    {
        return nit.assign.apply (nit, [OBJECT_CREATE (nit.object.prototype)].concat (ARRAY (arguments)));
    };

    nit.dpv (nit.object, "name", "nit.object");


    nit.memoize = function (fn)
    {
        var called = false;
        var result;

        function memo ()
        {
            if (!called)
            {
                called = true;
                result = fn.apply (this, arguments);

                if (result instanceof Promise)
                {
                    result.then (function (r)
                    {
                        result = r;
                    });
                }
            }

            return result;
        }

        nit.dpv (memo, "reset", function ()
        {
            called = false;
            result = undefined;
        });

        return memo;
    };


    nit.memoize.dpg = function (target, name, initializer, configurable, enumerable, validator)
    {
        var cfg = nit.typedArgsToObj (ARRAY (arguments).slice (1),
        {
            name: "string",
            initializer: "function",
            configurable: "boolean",
            enumerable: "boolean",
            validator: "function"
        });

        name = cfg.name;
        initializer = cfg.initializer;
        configurable = nit.coalesce (cfg.configurable, true);
        enumerable = nit.coalesce (cfg.enumerable, true);
        validator = cfg.validator;

        var privProp = nit.PPP + name;

        function getter ()
        {
            var owner = this;

            if (!owner.hasOwnProperty (privProp) || (validator && !validator.call (owner)))
            {
                var v = initializer.call (owner, owner);

                if (v instanceof Promise)
                {
                    v.then (function (r)
                    {
                        owner[privProp] = r;
                    });
                }

                nit.dpv (owner, privProp, v, true, false);
            }

            return owner[privProp];
        }

        return nit.dpg (target, name, getter, configurable, enumerable);
    };


    nit.int = function (v, defval)
    {
        var i = parseInt (v, 10);

        return isNaN (i) ? (arguments.length > 1 ? defval : 0) : i;
    };


    nit.float = function (v, defval)
    {
        var f = parseFloat (v);

        return isNaN (f) ? (arguments.length > 1 ? defval : 0) : f;
    };


    nit.typeOf = function (obj)
    {
        return OBJECT_PROTO.toString.call (obj)
            .slice (8, -1)
            .toLowerCase ();
    };


    nit.is = function (obj, type)
    {
        if (obj === null || obj === undefined)
        {
            return false;
        }

        return nit.typeOf (obj) == type.toLowerCase ();
    };

    nit.is.str        = nit.is.string    = function (v) { return typeof v == "string"; };
    nit.is.num        = nit.is.number    = function (v) { v = nit.string (v).trim (); return v !== "" && !isNaN (Number (v)); };
    nit.is.int        = nit.is.integer   = function (v) { return nit.is.num (v) && (Math.floor (v) + "") == (v + ""); };
    nit.is.func       = nit.is.function  = function (v) { return typeof v == "function"; };
    nit.is.bool       = nit.is.boolean   = function (v) { return typeof v == "boolean"; };
    nit.is.arr        = nit.is.array     = function (v) { return v instanceof Array; };
    nit.is.obj        = nit.is.object    = function (v) { return v !== null && !(v instanceof Array) && typeof v == "object"; };
    nit.is.float      = function (v) { return nit.is.num (v) && !nit.is.int (v); };
    nit.is.async      = function (v) { return nit.is (v, "AsyncFunction"); };
    nit.is.undef      = function (v) { return v === null || v === undefined; };
    nit.is.buffer     = function (v) { return typeof Buffer !== "undefined" && v instanceof Buffer; };
    nit.is.arrayish   = function (v) { return v && v != ARR_PROTO && !nit.is.buffer (v) && (v instanceof Array || v instanceof TYPED_ARRAY || nit.is (v, "arguments") || (typeof v == "object" && typeof v.hasOwnProperty == "function" && v.hasOwnProperty ("length"))); };
    nit.is.errorish   = function (v) { return !!(v && typeof v == "object" && (v instanceof Error || "message" in v && "stack" in v)); };
    nit.is.symbol     = function (v) { return nit.is (v, "symbol"); };
    nit.is.typedArray = function (v) { return v instanceof TYPED_ARRAY; };
    nit.is.promise    = function (v) { return v instanceof Promise; };
    nit.is.instanceOf = function (o, cls) { return o instanceof cls; };
    nit.is.subclassOf = function (subclass, superclass, inclusive) { return !!(subclass && (subclass.prototype instanceof superclass || inclusive && subclass === superclass)); };
    nit.is.keyword    = function (v) { return " break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof new return super switch this throw try typeof var void while with yield ".indexOf (" " + v + " ") !== -1; };
    nit.is.pojo       = function (v) { return v && typeof v == "object" && !!v.constructor && v.constructor.prototype.hasOwnProperty ("isPrototypeOf"); };
    nit.is.dto        = function (v) { return v instanceof nit.object || nit.is.pojo (v); };
    nit.is.any        = function () { return true; };


    nit.is.privateClass = function (cls)
    {
        return nit.lookupClass (cls.name) != cls;
    };


    nit.is.equal = function (a, b)
    {
        var same = false;

        if (a instanceof Date && b instanceof Date)
        {
            same = a * 1 == b * 1;
        }
        else
        if (a !== null
            && b !== null
            && typeof a == "object"
            && typeof b == "object")
        {
            var ka  = nit.is.arr (a) ? OBJECT.keys (a) : nit.keys (a);
            var kb  = nit.is.arr (b) ? OBJECT.keys (b) : nit.keys (b);

            if ((same = ka.length == kb.length))
            {
                for (var i = 0; i < ka.length; ++i)
                {
                    var k = ka[i];

                    if (!nit.is.equal (a[k], b[k]))
                    {
                        same = false;
                        break;
                    }
                }
            }
        }
        else
        {
            same = nit.is.equal.strict (a, b);
        }

        return same;
    };


    nit.is.equal.strict = function (a, b)
    {
        return a === b;
    };


    nit.is.equal.partial = function (a, b) // b contains the partial value or subtree
    {
        var va, vb;

        if (nit.is.obj (a) && nit.is.obj (b))
        {
            for (var k in b)
            {
                va = a[k];
                vb = b[k];

                if (nit.is.func (va))
                {
                    va = nit.clone (va);
                }

                if (nit.is.func (vb))
                {
                    vb = nit.clone (vb);
                }

                if (!nit.is.equal.partial (va, vb))
                {
                    return false;
                }
            }

            return true;
        }
        else
        if (nit.is.arr (a) && nit.is.arr (b))
        {
            for (var i = 0; i < b.length; ++i)
            {
                vb = b[i];

                if (!a.some (function (va) { return nit.is.equal.partial (va, vb); }))
                {
                    return false;
                }
            }

            return true;
        }
        else
        {
            return nit.is.equal (a, b);
        }
    };


    nit.is.empty = function (v)
    {
        if (v === null
            || v === undefined
            || v === ""
            || (v instanceof Array && !v.length))
        {
            return true;
        }

        if (nit.is.pojo (v) || v instanceof nit.object)
        {
            return !OBJECT.keys (v).length;
        }

        return false;
    };


    nit.is.empty.nested = function (v)
    {
        if (nit.is.empty (v))
        {
            return true;
        }

        if (v instanceof Array)
        {
            return v.every (nit.is.empty.nested);
        }
        else
        if (nit.is.pojo (v) || v instanceof nit.object)
        {
            for (var k in v)
            {
                if (!nit.is.empty.nested (v[k]))
                {
                    return false;
                }
            }

            return true;
        }

        return false;
    };


    nit.is.truthy = function (v)
    {
        return nit.is.bool (v)
            ? v === true
            : (nit.is.num (v)
                ? v !== 0
                : !nit.is.empty (v));
    };


    nit.is.not = (function build (source)
    {
        return OBJECT.keys (source)
            .reduce (function (a, k)
            {
                var test = source[k];

                a[k] = function ()
                {
                    return !test.apply (null, arguments);
                };

                nit.assign (a[k], build (test));

                return a;

            }, {});

    }) (nit.is);


    nit.freeze = function (o)
    {
        Object.freeze (o);

        if (nit.is.arr (o))
        {
            o.forEach (function (v) { nit.freeze (v); });
        }
        else
        if (nit.is.obj (o))
        {
            nit.keys (o, true).forEach (function (k) { nit.freeze (o[k]); });
        }

        return o;
    };


    nit.registerClass = function (name, cls) // or (cls)
    {
        if (nit.is.func (name))
        {
            cls = name;
            name = cls.name;
        }

        nit.dpv (nit.CLASSES, name, cls, true, true);

        return cls;
    };


    nit.registerClass.lazy = function (name, loader)
    {
        nit.memoize.dpg (nit.CLASSES, name, true, true, loader);
    };


    nit.lookupClass = function (name)
    {
        var cls;

        if (nit.is.func (cls = name)
            || nit.is.func (cls = nit.CLASSES[name])
            || nit.is.func (cls = global[name]))
        {
            return cls;
        }
    };


    nit.coalesce = function ()
    {
        for (var i = 0, args = ARRAY (arguments); i < args.length; ++i)
        {
            if (!nit.is.undef (args[i]))
            {
                return args[i];
            }
        }
    };


    nit.undefIf = function (v, test)
    {
        return (nit.is.func (test) ? test (v) : nit.is.equal (v, test)) ? undefined : v;
    };


    var DOT_ESC_RE = /\\\./g;
    var DOT_TOKEN = "<" + nit.uuid () + ">";
    var DOT_TOKEN_RE = new RegExp (DOT_TOKEN, "g");


    nit.get = function (obj, dotPath, defval)
    {
        if (!(dotPath = nit.trim (dotPath)))
        {
            return obj;
        }

        if (obj && (typeof obj == "object" || typeof obj == "function"))
        {
            var kv = nit.kvSplit (dotPath.replace (DOT_ESC_RE, DOT_TOKEN), ".");
            var k = kv[0].replace (DOT_TOKEN_RE, ".");
            var rest = kv[1];

            if (k in obj)
            {
                var v = obj[k];

                if (rest)
                {
                    if (v && (typeof v == "object" || typeof v == "function"))
                    {
                        return nit.get (v, rest.replace (DOT_TOKEN_RE, "\\."), defval);
                    }
                    else
                    {
                        return defval;
                    }
                }
                else
                {
                    return nit.is.undef (v) ? defval : v;
                }
            }
            else
            {
                return defval;
            }
        }
    };


    nit.set = function (obj, dotPath, value)
    {
        if (!(dotPath = nit.trim (dotPath)))
        {
            return obj;
        }

        if (obj && (typeof obj == "object" || typeof obj == "function"))
        {
            var kv = nit.kvSplit (dotPath.replace (DOT_ESC_RE, DOT_TOKEN), ".");
            var k = kv[0].replace (DOT_TOKEN_RE, ".");
            var rest = kv[1];

            if (rest)
            {
                var v = obj[k];

                if (!v || (typeof v != "object" && typeof v != "function"))
                {
                    v = obj[k] = {};
                }

                nit.set (v, rest.replace (DOT_TOKEN_RE, "\\."), value);
            }
            else
            {
                obj[k] = value;
            }

            return obj;
        }
        else
        {
            throw new Error ("The obj must be an object or a function.");
        }
    };


    nit.timezone = function ()
    {
        return Intl.DateTimeFormat ().resolvedOptions ().timeZone;
    };


    // returns the local date time string
    nit.timestamp = function (date, timezone, keepOffset, formatOptions) // eslint-disable-line no-unused-vars
    {
        var opts = nit.typedArgsToObj (arguments,
        {
            date: ["integer", "string", "Date"],
            timezone: "string",
            keepOffset: "boolean",
            formatOptions: "object"
        });

        date = opts.date || new Date ();

        if (nit.is.str (date))
        {
            date = nit.parseDate (date);
        }
        else
        if (nit.is.int (date))
        {
            date = new Date (date);
        }

        var timestamp = Intl.DateTimeFormat ("sv", OBJECT.assign ({ timeZone: nit.undefIf (opts.timezone, "") }, nit.DATE_TIME_FORMAT_OPTIONS, opts.formatOptions))
            .format (date)
            .replace ("\u2212", "-")
            .replace (/(-\d{2}) /, "$1T")
            .replace (",", ".")
            .split (/\sGMT/)
        ;

        return opts.keepOffset ? timestamp.join ("") : timestamp[0];
    };


    nit.log = function ()
    {
        nit.log.logger.apply (nit.log.logger, arguments);
    };


    nit.log.LEVELS = ["debug", "info", "warn", "error"];

    nit.log.logger = console.log.bind (console);

    nit.log.formatMessage = function ()
    {
        var args = ARRAY (arguments);
        var message = args[0];

        if (typeof message == "string")
        {
            message = nit.format.apply (nit, args);
        }
        else
        if (message instanceof Error)
        {
            message = message.stack;
        }
        else
        {
            message = JSON.stringify (message);
        }

        return message;
    };


    nit.log.LEVELS.forEach (function (level)
    {
        var ucLevel = level.toUpperCase ();

        nit.log[level] = nit.log[level[0]] = function ()
        {
            nit.log ("[" + ucLevel + "]", nit.log.formatMessage.apply (null, arguments));
        };
    });


    nit.glob = function (name, pattern)
    {
        if (!(pattern instanceof RegExp))
        {
            pattern = nit.glob.parse (pattern);
        }

        var negate = !!pattern.negate;
        var matched = !!name.match (pattern);

        return (!negate && matched) || (negate && !matched);
    };


    nit.glob.parse = function (pattern)
    {
        pattern = nit.trim (pattern);

        var negate = pattern[0] == "~";
        var re = new RegExp ("^" + pattern.slice (negate ? 1 : 0)
            .replace (/\./g, "[.]")
            .replace (/\?/g, ".")
            .replace (/\*/g, ".*")
            .replace (/%/g, "[^.]+")
            + "$", "i"
        );

        re.negate = negate;

        return re;
    };


    nit.debug = function (pattern, message) // eslint-disable-line no-unused-vars
    {
        var args = ARRAY (arguments);
        var patterns = nit.debug.PATTERNS;

        if (!(pattern = args.shift ()))
        {
            return;
        }

        if (!args.length)
        {
            patterns.push (nit.glob.parse (pattern));
        }
        else
        if (patterns.length && nit.debug.allows (pattern))
        {
            nit.log.apply (nit, ["[DEBUG] (" + pattern + ")"].concat (args));
        }
    };


    nit.debug.PATTERNS = [];


    nit.debug.allows = function (name)
    {
        return nit.debug.PATTERNS.some (function (p) { return nit.glob (name, p); });
    };


    // -----------------------
    // String utils
    // -----------------------

    nit.indefiniteArticle = function (s)
    {
        return nit.trim (s).match (/^[aeiou]/i) ? "an" : "a";
    };


    nit.ucFirst = function (str)
    {
        str = nit.trim (str);

        return str && (str[0].toUpperCase () + str.slice (1));
    };


    nit.lcFirst = function (str)
    {
        str = nit.trim (str);

        return str && (str[0].toLowerCase () + str.slice (1));
    };


    nit.camelCase = function (str)
    {
        str = nit.trim (str);

        if (~str.indexOf ("-") || ~str.indexOf ("_"))
        {
            return str.toLowerCase ().replace (nit.camelCase.PATTERN, nit.camelCase.REPLACER);
        }

        return nit.lcFirst (str);
    };


    nit.camelCase.REPLACER = function (m, c)
    {
        return c.toUpperCase ();
    };

    nit.camelCase.PATTERN = /[-_](.)/g;


    nit.pascalCase = function (str)
    {
        return nit.ucFirst (nit.camelCase (str));
    };


    nit.kababCase = function (str)
    {
        return nit.camelCase (str).replace (nit.kababCase.PATTERN, nit.kababCase.REPLACER);
    };


    nit.kababCase.REPLACER = function (m)
    {
        return "-" + m.toLowerCase ();
    };

    nit.kababCase.PATTERN = /[A-Z]/g;


    nit.snakeCase = function (str)
    {
        return nit.camelCase (str).replace (nit.snakeCase.PATTERN, nit.snakeCase.REPLACER);
    };


    nit.snakeCase.REPLACER = function (m)
    {
        return "_" + m.toLowerCase ();
    };


    nit.snakeCase.PATTERN = /[A-Z]/g;


    nit.escapeRegExp  = function (exp)
    {
        return nit.trim (exp).replace (nit.escapeRegExp.PATTERN, "\\$1");
    };


    nit.escapeRegExp.PATTERN = /([.*+?^=!:${}()|/[\]\\])/g;


    nit.parseRegExp = function (exp)
    {
        var match = exp.match (nit.parseRegExp.PATTERN);

        if (match)
        {
            return new RegExp (match[1], match[2]);
        }
        else
        {
           return new RegExp (exp);
        }
    };

    nit.parseRegExp.PATTERN  = /^\/(.*?)\/([gimuy]*)$/;


    // Parse the string into local time.
    // If the timezone is provided, then it treats the input as the local time at that timezone.
    var nit_parseDate = nit.parseDate = function (str, timezone)
    {
        if (str instanceof Date)
        {
            return str;
        }

        var match = nit_parseDate.match;
        var m = match (str);

        if (!m)
        {
            return;
        }

        if (timezone)
        {
            var opts = m.hasMillisecond ? { fractionalSecondDigits: 3 } : undefined;
            var utc = new Date (Date.UTC (m.year, m.month, m.day, m.hour, m.minute, m.second, m.millisecond));
            var utcTs = nit.timestamp (utc, timezone, true, opts);
            var utcParts = match (utcTs);
            var target = new Date (utc - utcParts.offset);
            var targetTs = nit.timestamp (target, timezone, true, opts);
            var targetParts = match (targetTs);

            var prevHour = new Date (target - 3600000);
            var prevHourTs = nit.timestamp (prevHour, timezone, true, opts);
            var prevHourParts = match (prevHourTs);

            var nextHour = new Date (target * 1 + 3600000);
            var nextHourTs = nit.timestamp (nextHour, timezone, true, opts);
            var nextHourParts = match (nextHourTs);

            if (prevHourParts.offset == nextHourParts.offset)
            {
                if (prevHourParts.timestamp == m.timestamp)
                {
                    return prevHour;
                }

                if (nextHourParts.offset < utcParts.offset)
                {
                    return nextHour;
                }
            }
            else
            if (prevHourParts.offset < nextHourParts.offset)
            {
                if (targetParts.timestamp < m.timestamp)
                {
                    return nextHour;
                }
            }
            else
            {
                if (nextHourParts.timestamp == m.timestamp && nextHourParts.offset == targetParts.offset)
                {
                    return nextHour;
                }
                else
                if (prevHourParts.timestamp == m.timestamp)
                {
                    return prevHour;
                }
            }

            return target;
        }

        var diff;
        var tzOffset = new Date (m.year, m.month, m.day).getTimezoneOffset ();

        if (m.hasOffset)
        {
            diff = tzOffset + m.offHour * 60 + m.offMin;

            m.hour -= ~~(diff / 60);
            m.minute -= diff % 60;
        }

        return new Date (m.year, m.month, m.day, m.hour, m.minute, m.second, m.millisecond);
    };


    // parse ISO8601 date string into an object
    // for time only, at least the hh:mm must be provided
    // for date only, at least the YYYY-MM must be provided
    nit.parseDate.match = function (str)
    {
        var d = nit.trim (str).match (nit.parseDate.PATTERN);

        if (d)
        {
            var now = new Date ();
            var m =
            {
                year: d[2] !== undefined ? ~~d[2] : now.getFullYear (),
                month: d[3] !== undefined ? (~~d[3] - 1) : now.getMonth (),
                day: d[4] !== undefined ? ~~d[4] : now.getDate (),
                hour: (d[6] !== undefined ? ~~d[6] : 0),
                minute: (d[7] !== undefined ? ~~d[7] : 0),
                second: d[8] !== undefined ? ~~d[8] : 0,
                millisecond: d[9] !== undefined ? ~~d[9] : 0,
                hasMillisecond: d[9] !== undefined,
                hasOffset: d[10] !== undefined,
                offHour: d[10] == "Z" ? 0 : ~~d[11],
                offMin: ~~d[12] * (d[11] && d[11][0] == "-" ? -1 : 1)
            };

            m.offset = (m.offHour * 60 + m.offMin) * 60 * 1000;
            m.timestamp = m.year + "-" + nit.lpad (m.month + 1, 2, 0) + "-" + nit.lpad (m.day, 2, 0)
                + " " + nit.lpad (m.hour, 2, 0) + ":" + nit.lpad (m.minute, 2, 0) + ":" + nit.lpad (m.second, 2, 0)
                + (m.hasMillisecond ? "." + nit.lpad (m.millisecond, 3, 0) : "")
            ;

            return m;
        }
    };


    nit.parseDate.ADJUSTMENTS =
    {
        year: 60 * 60 * 1000,
        month: 60 * 60 * 1000,
        day: 60 * 60 * 1000,
        hour: 60 * 60 * 1000,
        minute: 60 * 1000,
        second: 1000,
        millisecond: 1
    };

    //                 0                                1              2        3    4     5               6     7     8     9      10        11     12
    // sample result: ["2015-03-04T09:45:22.333+04:00", "2015-03-04T", "2015", "03", "04", "09:45:22.333", "09", "45", "22", "333", "+04:00", "+04", "00"]
    nit.parseDate.PATTERN  = /^((\d{4})(?:-(\d{1,2}))(?:-(\d{1,2}))?[ T]?|)((\d{1,2})(?::(\d{1,2}))(?::(\d{1,2}))?(?:\.(\d+))?)?(Z|([+-]\d{1,2})(?::?(\d{2}))?)?$/;


    nit.k = function (cls) // generate a namespaced key for a function
    {
        ARRAY (arguments)
            .slice (1)
            .forEach (function (k)
            {
                var key = "k" + nit.pascalCase (nit.sanitizeVarName (k));
                var fqn = cls.name + "." + nit.camelCase (k);

                nit.dpv (cls, key, fqn);
            })
        ;

        return cls;
    };


    // -----------------------
    // Array utils
    // -----------------------

    nit.array = function (args, flatten)
    {
        if (args === null || args === undefined)
        {
            return [];
        }
        else
        if (nit.is.arrayish (args))
        {
            args = ARRAY (args);

            if (flatten)
            {
                var res = [];

                while (args.length)
                {
                    var arg = args.shift ();

                    if (nit.is.arrayish (arg))
                    {
                        args.unshift.apply (args, arg);
                    }
                    else
                    {
                        res.push (arg);
                    }
                }

                return res;
            }
            else
            {
                return args;
            }
        }
        else
        {
            return [args];
        }
    };


    nit.arrayRemove = function (arr, test)
    {
        var removed = [];

        if (!nit.is.arr (arr))
        {
            return removed;
        }

        if (typeof test != "function")
        {
            var value = test;

            test = function (v) { return v === value; };
        }

        for (var i = 0; i < arr.length; ++i)
        {
            var item = arr[i];

            if (test (item))
            {
                arr.splice (i, 1);

                removed.push (item);

                --i;
            }
        }

        return removed;
    };


    nit.arrayCombine = function (keys, values)
    {
        return keys.reduce (function (o, k, i)
        {
            o[k] = values[i];

            return o;

        }, {});
    };


    nit.arrayCombine.nested = function (keys, arrays)
    {
        return arrays[0].map (function (a, i)
        {
            return nit.arrayCombine (keys, arrays.map (function (arr) { return arr[i]; }));
        });
    };


    nit.arrayUnique = function (arr, comparator)
    {
        arr = nit.array (arr);

        if (!arr.length)
        {
            return [];
        }

        if (arr.length == 1)
        {
            return arr;
        }

        var result = [arr[0]];
        comparator = (comparator === true ? nit.is.equal.strict : comparator) || nit.is.equal;

        for (var i = 1; i < arr.length; ++i)
        {
            var a = arr[i];
            var found = false;

            for (var j = 0; j < result.length; ++j)
            {
                var b = result[j];

                if ((found = comparator (a, b)))
                {
                    break;
                }
            }

            if (!found)
            {
                result.push (a);
            }
        }

        return result;
    };


    nit.arrayInsert = function (array, obj, ref)
    {
        if (!nit.is.undef (ref))
        {
            var isRefFunc = nit.is.func (ref);

            for (var i = 0; i < array.length; ++i)
            {
                var item = array[i];

                if (isRefFunc ? ref (item) : item === ref)
                {
                    array.splice (i, 0, obj);
                    break;
                }
            }
        }
        else
        {
            array.push (obj);
        }

        return array;
    };


    nit.sort = function (arr, comparators, descending)
    {
        var comps = {};
        var descs = {};
        var cfg = nit.typedArgsToObj (arguments,
        {
            arr: "array",
            comparators: ["string", "function", "object"],
            descending: ["boolean", "object"]
        });

        arr = cfg.arr;
        comparators = cfg.comparators;
        descending = cfg.descending;

        if (nit.is.str (comparators))
        {
            comps[comparators] = "auto";
        }
        else
        if (nit.is.func (comparators))
        {
            comps[""] = comparators;
        }
        else
        {
            comps = comparators || { "": "auto" };
        }

        if (nit.is.bool (descending))
        {
            descs[""] = descending;
        }
        else
        if (nit.is.obj (descending))
        {
            descs = descending;
        }

        var compFuncs = nit.each (comps, function (comp, prop)
        {
            return function (a, b)
            {
                var va = nit.get (a, prop);
                var vb = nit.get (b, prop);
                var desc = nit.coalesce (descs[prop], descending) === true;

                comp = nit.coalesce (comps[prop], "");
                comp = nit.is.func (comp) ? comp : NIT_SORT_COMPARATORS[comp || "auto"];

                return comp (va, vb) * (desc ? -1 : 1);
            };

        }, true);

        return arr.sort (function (a, b)
        {
            var result = 0;

            nit.each (compFuncs, function (cf)
            {
                if ((result = cf (a, b)))
                {
                    return nit.each.STOP;
                }
            });

            return result;
        });
    };


    var NIT_SORT_COMPARATORS = nit.sort.COMPARATORS =
    {
        undef: function (a, b)
        {
            var ua = nit.is.undef (a);
            var ub = nit.is.undef (b);

            return (ua && ub || !ua && !ub) ? 0 : (ua ? 1 : -1);
        }
        ,
        string: function (a, b)
        {
            return NIT_SORT_COMPARATORS.undef (a, b) || ((a += "") > (b += "") ? 1 : (a < b ? -1 : 0));
        }
        ,
        cistring: function (a, b)
        {
            return NIT_SORT_COMPARATORS.undef (a, b) || NIT_SORT_COMPARATORS.string ((a + "").toLowerCase (), (b + "").toLowerCase ());
        }
        ,
        integer: function (a, b)
        {
            return NIT_SORT_COMPARATORS.undef (a, b) || ((a = nit.int (a) - nit.int (b)) > 0 ? 1 : (a < 0 ? -1 : 0));
        }
        ,
        float: function (a, b)
        {
            return NIT_SORT_COMPARATORS.undef (a, b) || ((a = nit.float (a) - nit.float (b)) > 0 ? 1 : (a < 0 ? -1 : 0));
        }
        ,
        auto: function (a, b)
        {
            var comp = "string";

            if (nit.is.float (a) || nit.is.float (b))
            {
                comp = "float";
            }
            else
            if (nit.is.int (a) || nit.is.int (b))
            {
                comp = "integer";
            }

            return NIT_SORT_COMPARATORS[comp] (a, b);
        }
    };


    // ----------------
    // Object utils
    // ----------------


    nit.pick = function (o, props) // eslint-disable-line no-unused-vars
    {
        var result = {};
        var v;

        nit.array (ARRAY (arguments).slice (1), true).forEach (function (prop)
        {
            if ((v = nit.get (o, prop)) !== undefined)
            {
                nit.set (result, prop, v);
            }
        });

        return result;
    };


    nit.omit = function (o, props) // eslint-disable-line no-unused-vars
    {
        var result = nit.clone.shallow (o);

        nit.array (ARRAY (arguments).slice (1), true).forEach (function (prop)
        {
            var target = "";

            if (~prop.indexOf ("."))
            {
                var kv = nit.kvSplit (prop, ".", true);

                target = kv[0];
                prop = kv[1];
            }

            if (nit.is.obj (target = nit.get (result, target)))
            {
                delete target[prop];
            }
        });

        return result;
    };


    nit.flip = function (o)
    {
        return nit.arrayCombine (nit.values (o), nit.keys (o));
    };


    nit.entries = function (o)
    {
        o = o || {};

        var entries = [];

        for (var k in o)
        {
            entries.push ({ k: k, v: o[k] });
        }

        return entries;
    };


    nit.clone = function (object, filter, all)
    {
        filter = filter || nit.clone.filter;

        var getKeys = filter.keys || nit.keys;

        if (typeof object == "function")
        {
            object = getKeys (object, all)
                .reduce (function (o, k)
                {
                    try
                    {
                        o[k] = object[k];
                    }
                    catch (e)
                    {
                    }

                    return o;

                }, { name: object.name });
        }

        var cloned  = {};
        var nodes   = [{ obj: object, k: "result", result: cloned, ancestors: [] }];
        var node;

        while ((node = nodes.shift ()))
        {
            var obj = node.obj;
            var r, k;

            if (!filter (obj, node.k, node))
            {
                continue;
            }

            if (obj && typeof obj == "object")
            {
                if (~node.ancestors.indexOf (obj))
                {
                    obj = filter.circular ? filter.circular (obj) : "[circular]";
                }
                else
                if (typeof obj.clone == "function")
                {
                    node.ancestors.push (obj);

                    obj = obj.clone ();
                }
            }

            if (obj
              && typeof obj == "object"
              && !(obj instanceof Array)
              && !(obj instanceof Date)
              && !(obj instanceof RegExp))
            {
                r = {};

                var ks = getKeys (obj, all);

                for (k = 0; k < ks.length; ++k)
                {
                    try
                    {
                        nodes.push ({ obj: obj[ks[k]], k: ks[k], result: r, ancestors: node.ancestors.concat (obj) });
                    }
                    catch (e)
                    {
                    }
                }

                obj = r;
            }
            else
            if (obj instanceof Array)
            {
                r = Array (obj.length);

                for (k = 0; k < obj.length; ++k)
                {
                    try
                    {
                        nodes.push ({ obj: obj[k], k: k, result: r, ancestors: node.ancestors.slice (), array: true });
                    }
                    catch (e)
                    {
                    }
                }

                var props = nit.propertyDescriptors (obj, all);

                for (var p in props)
                {
                    if (!nit.is.int (p))
                    {
                        try
                        {
                            nodes.push ({ obj: obj[p], k: p, result: r, ancestors: node.ancestors.slice (), array: true });
                        }
                        catch (e)
                        {
                        }
                    }
                }

                obj = r;
            }

            node.result[node.k] = obj;
        }

        return cloned.result;
    };


    nit.clone.deep = function (obj)
    {
        return nit.clone (obj, function (obj, k, node)
        {
            return !(node.array && ~nit.IGNORED_ARRAY_PROPS.indexOf (k));

        }, true);
    };


    nit.clone.shallow = function (obj, all)
    {
        if (obj instanceof Array)
        {
            return obj.slice ();
        }
        else
        if (typeof obj == "object")
        {
            return nit.keys (obj, all)
                .reduce (function (a, k) { a[k] = obj[k]; return a; }, {})
            ;
        }
        else
        {
            return obj;
        }
    };


    nit.clone.filter = function (obj)
    {
        return !nit.is.symbol (obj) && !nit.is.typedArray (obj);
    };


    nit.clone.data = function (obj, filter)
    {
        filter = filter || nit.clone.data.filter;

        return nit.clone (obj, filter);
    };


    nit.clone.data.filter = function (obj)
    {
        return nit.is.not.func (obj) && nit.clone.filter (obj);
    };


    nit.inspect = function (o)
    {
        console.dir (nit.clone (o), { depth: undefined });

        return nit;
    };


    nit.indent = function (str, indent, always)
    {
        if (nit.is.bool (indent))
        {
            always = indent;
            indent = "";
        }

        indent = indent || "    ";
        str = nit.trim (str).split (/[\r\n]/g);

        if (!always && str.length == 1)
        {
            return str[0];
        }
        else
        {
            return str.map (function (s, i) { return (i == 0 || s.length ? indent : "") + s; }).join ("\n");
        }
    };


    nit.toJson = function (o, indent)
    {
        var data = nit.is.undef (o) ? o : nit.clone (o);

        if (arguments.length > 1)
        {
            if (nit.is.num (indent))
            {
                indent = nit.lpad ("", indent + 1, " ");
            }
            else
            if (nit.is.bool (indent))
            {
                indent = indent ? "    " : "";
            }
            else
            if (!nit.is.str (indent))
            {
                indent = "";
            }
        }

        return JSON.stringify (data, null, indent);
    };


    nit.toVal = function (str)
    {
        if (typeof str == "string")
        {
            if (str[0] == "\\")
            {
                return str.slice (1);
            }

            if (str == "true")
            {
                return true;
            }

            if (str == "false")
            {
                return false;
            }

            if (str == "null")
            {
                return null;
            }

            if (nit.is.num (str))
            {
                return +str;
            }

            if (nit.toVal.ARRAY_EXP.test (str) || nit.toVal.OBJECT_EXP.test (str))
            {
                try
                {
                    return nit.eval (str);
                }
                catch (e)
                {
                    nit.log (e);
                }
            }
        }

        return str;
    };

    nit.toVal.ARRAY_EXP  = /^\[[\s\S]*\]$/;
    nit.toVal.OBJECT_EXP = /^\{[\s\S]*\}$/;


    nit.uriEncode = function (data, name)
    {
        var isArr = nit.is.arr (data);
        var isObj = nit.is.obj (data);

        name = nit.array (name);

        if (isArr || isObj)
        {
            return nit.each (data, function (v, k)
            {
                return nit.uriEncode (v, name.concat (k));

            }, isObj).join ("&");
        }
        else
        {
            if (name.length)
            {
                var rest = name.map (EUC);
                var first = rest.shift ();

                name = first + (rest.length ? "[" + rest.join ("][") + "]" : "") + "=";
            }
            else
            {
                name = "";
            }

            return name + (nit.is.undef (data) ? "" : EUC (data));
        }
    };


    nit.serialize = function (value, indent)
    {
        if (value instanceof Date)
        {
            return value.toISOString ();
        }

        if (nit.is.buffer (value))
        {
            return value.toString ("binary");
        }

        if (nit.is.symbol (value))
        {
            return value.toString ();
        }

        if (nit.is.obj (value) || nit.is.arr (value))
        {
            return nit.toJson (value, indent);
        }

        return (nit.is.undef (value) ? "" : value) + "";
    };


    nit.series = function (size, start, step)
    {
        var series = [];
        start = start || 0;
        step = step || 1;

        for (var i = 0; i < size; ++i)
        {
            series.push (start + i * step);
        }

        return series;
    };


    nit.each = function (o, func, objMode)
    {
        var keys    = [];
        var results = [];
        var items   = [];

        if (objMode || nit.is.obj (o) && nit.is.not.arrayish (o))
        {
            for (var k in o)
            {
                keys.push (k);
                items.push (o[k]);
            }
        }
        else
        {
            items = o = nit.array (o);
            keys = nit.series (items.length);
        }

        if (!items.length)
        {
            return results;
        }

        var isExpr = typeof func == "string";

        if (isExpr)
        {
            func = nit.expr (func);
        }

        var returnPromise = nit.is.async (func);

        for (var i = 0; i < keys.length; ++i)
        {
            var result = isExpr ? func ({ $VALUE: items[i], $KEY: keys[i], $OBJECT: o }) : func (items[i], keys[i], o);

            if (result == nit.each.STOP)
            {
                break;
            }

            if (result != nit.each.SKIP)
            {
                results.push (result === undefined ? items[i] : result);
            }
        }

        return returnPromise ? Promise.all (results) : results;
    };


    nit.each.obj = function (o, func)
    {
        var values = nit.each (o, func, true);
        var keys = nit.keys (o);

        return nit.is.promise (values)
            ? values.then (function (values) { return nit.arrayCombine (keys, values); })
            : nit.arrayCombine (keys, values);
    };

    nit.dpv (nit.each, "STOP", {});
    nit.dpv (nit.each, "CANCEL", nit.each.STOP);
    nit.dpv (nit.each, "SKIP", {});


    nit.find = function (o, func) // or find (o, k, v)
    {
        var args  = ARRAY (arguments);

        if (args.length == 3)
        {
            var k = args[1];
            var v = args[2];

            func = function (item)
            {
                return nit.get (item, k) === v;
            };
        }
        else
        if (!nit.is.func (func))
        {
            var val = func;

            func = function (v) { return val === v; };
        }

        var kvs = nit.each (o, function (v, k)
        {
            return [k, v];
        });


        function checkResult (res, v)
        {
            return res ? (res instanceof nit.find.Result ? res.value : v) : next ();
        }

        function next ()
        {
            var kv = kvs.shift ();

            if (!kv)
            {
                return;
            }

            var k = kv[0];
            var v = kv[1];
            var res = func (v, k);

            if (res instanceof Promise)
            {
                return res.then (function (res)
                {
                    return checkResult (res, v);
                });
            }
            else
            {
                return checkResult (res, v);
            }
        }

        return next ();
    };


    nit.find.Result = nit.createFunction ("nit.find.Result",
        function (obj, args) { obj.value = args[0]; },
        ["value"]
    );


    nit.argsToObj = function (args, pargs, cleanup)
    {
        var obj = {};
        var idx = 0;

        nit.each (nit.array (args), function (arg)
        {
            if (nit.is.pojo (arg))
            {
                nit.assign (obj, arg);
            }
            else
            {
                obj[idx++] = arg;
            }
        });

        if (pargs)
        {
            pargs.forEach (function (parg, i)
            {
                if (obj[i] !== undefined)
                {
                    obj[parg] = obj[i];
                }
            });
        }

        return cleanup ? nit.argsToObj.cleanup (obj) : obj;
    };


    nit.argsToObj.cleanup = function (obj)
    {
        for (var i in obj)
        {
            if (+i == i)
            {
                delete obj[i];
            }
        }

        return obj;
    };


    nit.typedArgsToObj = function (args, config)
    {
        // Combine args of different types into an object.
        // Config is an object where key is the property name and value is the type(s) of that property.

        args = ARRAY (args);

        var obj = {};
        var props = OBJECT.keys (config);
        var arg;
        var found;

        while (args.length)
        {
            arg = args.shift ();
            found = false;

            for (var i = 0; i < props.length; ++i)
            {
                var prop  = props[i];
                var types = config[prop];

                if (!(types instanceof Array))
                {
                    types = config[prop] = [types];
                }

                for (var j = 0; j < types.length; ++j)
                {
                    var t = types[j];
                    var f = nit.is[t];
                    var cls;

                    if (f)
                    {
                        found = f (arg);
                    }
                    else
                    if (nit.is.func (t))
                    {
                        found = arg instanceof t;
                    }
                    else
                    if ((cls = nit.lookupClass (t)))
                    {
                        found = arg instanceof cls;
                    }

                    if (found)
                    {
                        obj[prop] = arg;
                        break;
                    }
                }

                if (found)
                {
                    props.splice (i, 1);
                    break;
                }
            }

            if (!found && nit.is.obj (arg))
            {
                nit.assign (obj, arg);
            }
        }

        return obj;
    };


    nit.debounce = function (cb, delay)
    {
        var tid;
        var cfg = nit.typedArgsToObj (arguments,
        {
            cb: "function",
            delay: "integer"
        });

        cb = cfg.cb;
        delay = cfg.delay || nit.debounce.DELAY;

        return nit.dpv (function ()
        {
            clearTimeout (tid);

            tid = setTimeout (cb.apply.bind (cb, this, ARRAY (arguments)), delay);

        }, "name", cb.name);
    };


    nit.debounce.DELAY = 1000;


    nit.config = function (k, v)
    {
        var cfg = nit.CONFIG;

        if (arguments.length == 2 || (k && k.slice (-1) == "-"))
        {
            var match = k.match (nit.EXPANDABLE_ARG_PATTERN);
            var exp = match && match[1] || "";

            if (exp)
            {
                k = k.slice (0, match.index);

                // do not expand
                if (match[4] == "!")
                {
                    exp = ".." + exp;
                }
                else
                {
                    var expanders = exp.split ("|");
                    var expand = function (v)
                    {
                        if (expanders.length)
                        {
                            v = nit.expandArg (expanders.shift (), v, cfg);

                            if (v instanceof Promise)
                            {
                                return v.then (function (v)
                                {
                                    return expand (v);
                                });
                            }
                            else
                            {
                                return expand (v);
                            }
                        }
                        else
                        {
                            nit.config (k, v);
                        }
                    };

                    return expand (v);
                }
            }

            var op = k.match (nit.config.OP_PATTERN);
            var kk, vv;

            if (op && (op = op[0]))
            {
                k = k.slice (0, -1) + exp;

                switch (op)
                {
                    case "*": // iterate subkeys
                        for (kk in v)
                        {
                            nit.config (k + "." + kk, v[kk]);
                        }
                        break;

                    case "?": // set only when undefined
                        if (nit.get (cfg, k) === undefined)
                        {
                            nit.set (cfg, k, v);
                        }
                        break;

                    case "+": // merge
                        vv = nit.get (cfg, k);

                        if (vv && typeof vv == "object")
                        {
                            if (nit.is.arr (vv))
                            {
                                vv.push.apply (vv, nit.array (v));
                            }
                            else
                            {
                                nit.assign (vv, v);
                            }
                        }
                        else
                        {
                            nit.set (cfg, k, v);
                        }
                        break;

                    case "-": // delete
                        if (k)
                        {
                            var ks = nit.kvSplit (k, ".", true);

                            vv = nit.get (cfg, ks[0]);

                            delete vv[ks[1]];
                        }
                        break;
                }
            }
            else
            {
                nit.set (cfg, k + exp, v);
            }
        }
        else
        if (k)
        {
            return nit.get (cfg, k);
        }
        else
        {
            return cfg;
        }
    };


    nit.config.OP_PATTERN = /[*?+-]$/;


    // -------------------------
    // A simple string template
    // -------------------------

    nit.Template = nit.do (nit.registerClass (nit.createFunction ("nit.Template",
        function (self, args)
        {
            var cls = self.constructor;
            var config = nit.typedArgsToObj (args,
            {
                template: "string",
                openTag: "string",
                closeTag: "string",
                serialize: "function",
                trim: "boolean"
            });

            for (var i in cls.defaults)
            {
                var def = cls.defaults[i];

                self[i] = i in config ? config[i] : (nit.is.obj (def) ? nit.assign ({}, def) : def);
            }

            nit.each (self.partials, function (partial, n)
            {
                if (nit.is.str (partial))
                {
                    self.partials[n] = self.parse (partial);
                }
            });

            self.tokens = self.parse (self.template);
        })),
        function (Template)
        {
            nit.dpvs (Template.prototype,
            {
                parse: function (template)
                {
                    var self = this;

                    return self.parseBlocks (Template.tokenize (template, self.openTag, self.closeTag, self.trim));
                }
                ,
                parseBlocks: function (tokens, level)
                {
                    level = level || 0;

                    var self = this;
                    var root = { children: [] };
                    var current = root;
                    var blocks = [];
                    var branchBlocks = [];
                    var branchExpr;

                    nit.each (tokens, function (token)
                    {
                        var children  = current.children;
                        var expr      = token instanceof Array;

                        if (expr)
                        {
                            token = self.parseBlocks (token, level + 1);

                            var type = token[0][0];
                            var n;

                            switch (type)
                            {
                                case "@": // inline partial
                                case "#": // block
                                case ":": // else block
                                    token.type = type;
                                    n = token[0] = token[0].slice (1);
                                    token.children = [];

                                    if (type == "@")
                                    {
                                        if (n[0] == "*")
                                        {
                                            token.expand = true;
                                            n = token[0] = n.slice (1);
                                        }

                                        token.name = n;

                                        if (self.partials[n] || Template.PARTIALS[n])
                                        {
                                            throw new Error ("The partial name '" + n + "' has been used.");
                                        }

                                        self.partials[n] = token.children;
                                    }
                                    else
                                    if (type == ":")
                                    {
                                        blocks.pop ();
                                    }

                                    blocks.push (current = token);

                                    if (type != "@")
                                    {
                                        var check = token[0][0];

                                        if (check && Template.CHECKS[check])
                                        {
                                            token.check = check;
                                            token[0] = token[0].slice (1);
                                        }

                                        if (type == "#")
                                        {
                                            token.branches = [];
                                            branchBlocks.push (branchExpr = token);
                                        }
                                        else // ":"
                                        {
                                            if (nit.trim (token[0]))
                                            {
                                                token.elif = true;
                                            }
                                            else
                                            {
                                                token.else = true;
                                            }

                                            branchExpr.branches.push (token);

                                            return;
                                        }
                                    }
                                    break;

                                case "*": // partial expansion
                                    token.type = type;
                                    n = token.name = token[0] = token[0].slice (1);
                                    token.optional = n[0] == "?";
                                    break;

                                case "/":
                                    if (!blocks.pop ())
                                    {
                                        throw new Error ("Unmatched block closing tag.");
                                    }

                                    current = blocks.slice (-1)[0] || root;
                                    branchBlocks.pop ();
                                    branchExpr = branchBlocks[branchBlocks.length - 1];
                                    return;
                            }
                        }

                        children.push (token);
                    });

                    if (!level)
                    {
                        var nodes = [root.children];
                        var nid   = 0;
                        var n;

                        while ((n = nodes.shift ()))
                        {
                            n.id = nid++;

                            if (n.children)
                            {
                                nodes.push (n.children);
                            }

                            if (n.branches)
                            {
                                nodes.push.apply (nodes, n.branches);
                            }

                            for (var i = 0; i < n.length; ++i)
                            {
                                if (n[i] instanceof Array)
                                {
                                    nodes.push (n[i]);
                                }
                            }
                        }
                    }

                    return root.children;
                }
                ,
                render: function (data, context, tokens)
                {
                    var self = this;

                    context = nit.assign ({}, context,
                    {
                        $ROOT: data,
                        $PENDING_RESULTS: [],
                        $TOKEN_RESULTS: {},
                        $TEMPLATE: self

                    });

                    function render (data)
                    {
                        var result = self.renderTokens (tokens || self.tokens, data, context);

                        if (context.$PENDING_RESULTS.length)
                        {
                            return Promise
                                .all (context.$PENDING_RESULTS)
                                .then (function ()
                                {
                                    context.$PENDING_RESULTS = [];

                                    return render (data);
                                })
                            ;
                        }

                        return result;
                    }

                    return render (data);
                }
                ,
                addPendingResult: function (context, token, result, dataIndex)
                {
                    context.$PENDING_RESULTS.push (result.then (function (result)
                    {
                        dataIndex = dataIndex || 0;

                        return context.$TOKEN_RESULTS[token.id + ":" + dataIndex] = result;
                    }));
                }
                ,
                evaluate: function (expr, data, context)
                {
                    var escPipe = "<" + nit.uuid () + ">";
                    var escPipeRe = new RegExp (escPipe, "g");
                    var self = this;
                    var transforms = expr
                        .replace (/\\\|/g, escPipe)
                        .split ("|")
                        .map (function (t)
                        {
                            return t.replace (escPipeRe, "|");
                        });

                    var path = transforms.shift ().trim ();
                    var value;

                    if (!path.length || path == ".")
                    {
                        value = data;
                    }
                    else
                    {
                        try
                        {
                            var allTransforms = nit.assign ({}, self.transforms, Template.TRANSFORMS);

                            value = nit.eval (path, nit.assign ({ $: allTransforms }, data, context));
                        }
                        catch (e)
                        {
                            nit.debug (Template.name, e);
                        }
                    }

                    function evaluate (value)
                    {
                        var trans = transforms.shift ();

                        if (trans)
                        {
                            var ctx = nit.assign ({}, context, { $$: value, $DATA: data });
                            var args = [value];

                            trans = Template.parseTransform (trans, self.transforms);

                            if (trans.args)
                            {
                                if (trans.customArgs)
                                {
                                    args = nit.eval ("[" + trans.args + "]", ctx);
                                }
                                else
                                {
                                    args = args.concat (nit.toVal ("[" + trans.args + "]"));
                                }
                            }

                            value = trans.func.apply (ctx, args);
                        }

                        if (value instanceof Promise)
                        {
                            return value.then (evaluate);
                        }

                        return transforms.length ? evaluate (value) : value;
                    }

                    return evaluate (value);
                }
                ,
                renderTokens: function (tokens, data, context, evaluate, dataIndex)
                {
                    var self    = this;
                    var result  = "";
                    var resKey  = tokens.id + ":" + (dataIndex = dataIndex || 0);

                    if (resKey in context.$TOKEN_RESULTS)
                    {
                        return context.$TOKEN_RESULTS[resKey];
                    }

                    nit.each (tokens, function (token)
                    {
                        var expr = typeof token != "string";

                        if (expr)
                        {
                            var type = token.type;
                            var val, children, n;

                            switch (type)
                            {
                                case "@":
                                    if (!token.expand)
                                    {
                                        break;
                                    }

                                case "*": // eslint-disable-line no-fallthrough
                                    if (token.expand)
                                    {
                                        children = token.children;
                                    }
                                    else
                                    {
                                        n = token.name;
                                        children = self.partials[n] || Template.PARTIALS[n] || (token.optional && []);

                                        if (!children)
                                        {
                                            throw new Error ("The partial '" + n + "' was not registered.");
                                        }
                                    }

                                    result += self.renderTokens (children, data, context, false, dataIndex);
                                    break;

                                case "#":
                                    var branches = [token].concat (token.branches);

                                    for (var i  = 0; i < branches.length; ++i)
                                    {
                                        var branch = branches[i];
                                        var items = self.renderTokens (branch, data, context, true, dataIndex);

                                        if (branch.check)
                                        {
                                            items = Template.CHECKS[branch.check] (items) ? [data] : [];
                                        }
                                        else
                                        if (branch.type == ":" && branch.else)
                                        {
                                            items = [data];
                                        }

                                        items = nit.array (items);

                                        var count = items.length;

                                        nit.each (items, function (d, idx)
                                        {
                                            var ctx = nit.assign ({}, context,
                                            {
                                                $INDEX: idx,
                                                $COUNT: count,
                                                $FIRST: idx == 0,
                                                $LAST:  idx == count - 1,
                                                $DATA:  branch.check ? undefined : data
                                            });

                                            result += self.renderTokens (branch.children, d, ctx, false, dataIndex + ":" + idx);
                                        });

                                        if (count)
                                        {
                                            break;
                                        }
                                    }
                                    break;

                                default:
                                    val = self.renderTokens (token, data, context, true, dataIndex);
                                    result += self.serialize (val);
                            }
                        }
                        else
                        {
                            result += token;
                        }
                    });

                    if (evaluate)
                    {
                        result = self.evaluate (result, data, context);

                        if (result instanceof Promise)
                        {
                            self.addPendingResult (context, tokens, result, dataIndex);
                            result = "";
                        }
                        else
                        if (nit.is.not.undef (result))
                        {
                            context.$TOKEN_RESULTS[tokens.id + ":" + dataIndex] = result;
                        }
                    }

                    return result;
                }
            }, true, false);


            nit.dpvs (Template,
            {
                TRANSFORM_PATTERN: /^([$a-z0-9_.-]+)\s*(@?\((.*)\))?$/i,
                BLOCK_SYMBOLS: "#:@/",
                BLOCK_LEADING_WS: /\n[ \t]*$/,
                BLOCK_TRAILING_WS: /^[ \t]*\n/,
                CHECKS:
                {
                    "?": nit.is.truthy,
                    "!": nit.is.not.truthy,
                    "-": nit.is.empty.nested,
                    "+": nit.is.not.empty.nested
                }
                ,
                TRANSFORMS: { nit: nit },
                PARTIALS: {},

                defaults:
                {
                    template:     "",
                    openTag:      "{{",
                    closeTag:     "}}",
                    trim:         true,
                    serialize:    nit.serialize,
                    transforms:   {},
                    partials:     {}
                }
                ,
                render: function (tmpl, data, config, context) // eslint-disable-line no-unused-vars
                {
                    var argv = nit.typedArgsToObj (arguments,
                    {
                        tmpl: "string",
                        data: ["undef", "object"],
                        config: "object",
                        context: "object"
                    });

                    return new Template (argv.tmpl, argv.config).render (argv.data, argv.context);
                }
                ,
                parseTransform: function (decl, localTransforms)
                {
                    var match = decl.trim ().match (Template.TRANSFORM_PATTERN);

                    if (!match)
                    {
                        throw new Error ("Invalid transform declaration: " + decl);
                    }

                    var name  = match[1];
                    var args  = match[3];
                    var trans = localTransforms || {};
                    var func  = name && (nit.get (trans, name) || nit.get (Template.TRANSFORMS, name));

                    if (!func)
                    {
                        throw new Error ("The transform '" + name + "' was not registered.");
                    }

                    return { name: name, func: func, args: args, customArgs: !!(match[2] && match[2][0] == "@") };
                }
                ,
                registerTransform: function (name, func)
                {
                    Template.TRANSFORMS[name] = func;

                    return Template;
                }
                ,
                registerPartial: function (name, partial, openTag, closeTag)
                {
                    openTag = openTag || Template.defaults.openTag;
                    closeTag = closeTag || Template.defaults.closeTag;

                    Template.PARTIALS[name] = new Template (partial, openTag, closeTag).tokens;

                    return Template;
                }
                ,
                tokenize: function (tmpl, openTag, closeTag, trim)
                {
                    openTag = openTag || Template.defaults.openTag;
                    closeTag = closeTag || Template.defaults.closeTag;

                    var uuid      = nit.uuid ();
                    var openChar  = openTag[0];
                    var closeChar = closeTag[0];
                    var escOpen   = "<O-" + uuid + ">";
                    var escClose  = "<C-" + uuid + ">";
                    var hasEsc    = false;

                    if (trim)
                    {
                        tmpl = tmpl.replace (/\\\n[ ]*/g, "");
                    }

                    // use \{{ to escape the open tag character
                    tmpl = tmpl.replace (new RegExp ("\\\\([" + nit.escapeRegExp (openChar + closeChar) + "])", "g"), function (match, char)
                    {
                        hasEsc = true;

                        return char == openChar ? escOpen : escClose;
                    });

                    var rootTokens    = [];
                    var currentToken  = rootTokens;
                    var parents       = [];


                    function findTag (str, tag)
                    {
                        var index;

                        do
                        {
                            index = str.indexOf (tag, index);

                            if (index > -1)
                            {
                                return { index: index, length: tag.length };
                            }
                        }
                        while (index != -1);
                    }


                    function findOpen (str)
                    {
                        return findTag (str, openTag);
                    }


                    function findClose (str)
                    {
                        return findTag (str, closeTag);
                    }


                    function throwNotClosed (str)
                    {
                        str = str
                            .replace (new RegExp (escOpen, "g"), "\\" + openChar)
                            .replace (new RegExp (escClose, "g"), "\\" + closeChar);

                        throw new Error ("The open tag is not closed. (Given: " + str + ")");
                    }


                    function parse (str)
                    {
                        var open = findOpen (str);

                        if (!open)
                        {
                            currentToken.push (str);

                            return { str: str, end: str.length + 1, more: "" };
                        }

                        if (open.index)
                        {
                            currentToken.push (str.slice (0, open.index));
                        }

                        var rest      = str.slice (open.index + open.length);
                        var nextOpen  = findOpen (rest);
                        var close     = findClose (rest);
                        var more      = "";
                        var tokens    = [];
                        var result;
                        var end;

                        if (!close)
                        {
                            throwNotClosed (str);
                        }

                        var endIdx = 0;

                        parents.push (currentToken);
                        currentToken.push (currentToken = []);

                        if (nextOpen && nextOpen.index < close.index) // nested - {{prefix.{{name}}.suffix}}
                        {
                            do
                            {
                                var pre = rest.slice (0, nextOpen.index);

                                if (nextOpen.index)
                                {
                                    currentToken.push (pre);
                                }

                                tokens.push (pre);

                                endIdx  += pre.length;
                                rest    = rest.slice (nextOpen.index);
                                result  = parse (rest);

                                endIdx  += result.end;
                                rest    = result.more;
                                close   = findClose (rest);

                                tokens.push (result);

                                if (!close)
                                {
                                    throwNotClosed (pre);
                                }

                                nextOpen = findOpen (rest);
                            }
                            while (nextOpen && close.index > nextOpen.index);
                        }

                        end   = open.index + open.length + endIdx + close.index + close.length;
                        more  = str.slice (end);
                        str   = str.slice (0, open.index);

                        parse (rest.slice (0, close.index));

                        currentToken = parents.pop ();

                        return { str: str, end: end, more: more };
                    }


                    var result  = parse (tmpl);
                    var tokens  = [result];
                    var more;

                    while (result.more && more != result.more)
                    {
                        more    = result.more;
                        result  = parse (more);

                        tokens.push (result);
                    }

                    var blkSymbols  = Template.BLOCK_SYMBOLS;
                    var blkLeading  = Template.BLOCK_LEADING_WS;
                    var blkTrailing = Template.BLOCK_TRAILING_WS;
                    var prev, next;

                    for (var i = 0; i < rootTokens.length; ++i)
                    {
                        var rt = rootTokens[i];

                        if (typeof rt == "string")
                        {
                            if (hasEsc)
                            {
                                rootTokens[i] = rt
                                    .replace (new RegExp (escOpen, "g"), openChar)
                                    .replace (new RegExp (escClose, "g"), closeChar);
                            }
                        }
                        else
                        if (trim && ~blkSymbols.indexOf (rt[0][0]))
                        {
                            if (typeof (prev = rootTokens[i - 1]) == "string" && prev.match (blkLeading))
                            {
                                rootTokens[i - 1] = prev.replace (blkLeading, "\n");
                            }

                            if (typeof (next = rootTokens[i + 1]) == "string" && next.match (blkTrailing))
                            {
                                rootTokens[i + 1] = next.replace (blkTrailing, "\n");
                            }
                        }
                    }

                    return rootTokens;
                }
                ,
                untokenize: function (token, openTag, closeTag, level)
                {
                    level = level || 0;
                    openTag = openTag || Template.defaults.openTag;
                    closeTag = closeTag || Template.defaults.closeTag;

                    if (token instanceof Array)
                    {
                        var children = "";
                        var branches = "";
                        var isBlock = false;
                        var self = this;
                        var untokenize = function (t) { return self.untokenize (t, openTag, closeTag, level + 1); };

                        switch (token.type)
                        {
                            case "@":
                            case "#":
                            case ":":
                                isBlock = true;


                                if (!nit.is.empty (token.children))
                                {
                                    children = token.children.map (untokenize).join ("");
                                }

                                if (!nit.is.empty (token.branches))
                                {
                                    branches = token.branches.map (untokenize).join ("");
                                }
                                break;
                        }

                        var str = (level || token.type ? openTag : "")
                            + (token.type || "")
                            + (token.expand ? "*" : "")
                            + (token.check || "")
                            + token.map (untokenize).join ("")
                            + (level || token.type ? closeTag : "")
                        ;

                        if (isBlock)
                        {
                            str += children
                                + branches
                                + (token.type != ":" ? (openTag + "/" + closeTag) : "")
                            ;
                        }

                        return str;
                    }
                    else
                    {
                        return token;
                    }
                }

            }, true, false);
        })
    ;


    // -----------------------------------------
    // Functions
    // -----------------------------------------


    nit.format = function (/* str, args */)
    {
        var parsed = nit.format.parse (arguments);

        return nit.Template.render (parsed.message, parsed.data, nit.format.defaults);
    };


    nit.format.parse = function (args)
    {
        args = ARRAY (args)
            .map (function (arg)
            {
                try
                {
                    return typeof arg == "object" || typeof arg == "function" ? nit.clone.shallow (arg) : arg;
                }
                catch (e)
                {
                    return arg;
                }
            })
        ;

        var message = nit.trim (args.shift ());
        var data = nit.argsToObj (args, null, false);

        nit.each (data, function (v, k)
        {
            if (nit.is.int (k))
            {
                delete data[k++];
                data["$" + k] = v; // pos args: $1, $2, ...
            }
        });

        return { message: message, data: data };
    };


    nit.format.defaults =
    {
        openTag: "%{",
        closeTag: "}",
        transforms: { nit: nit }
    };


    nit.m = function (scope, key, message)
    {
        if (arguments.length == 3)
        {
            key = nit.trim (nit.is.func (scope) ? scope.name : scope)
                .split (".")
                .concat (key)
                .join (nit.m.SCOPE_DELIMITER);
        }
        else
        {
            message = key;
            key = scope;
        }

        nit.m.MESSAGES[key] = message;

        return nit;
    };


    nit.m.SCOPE_DELIMITER = "|";
    nit.m.KEY_PATTERN = /^[0-9a-z_|.$]+$/i;
    nit.m.MESSAGES = {};

    nit
        .m ("error.class_not_defined", "The class '%{name}' was not defined.")
        .m ("error.component_not_found", "The component '%{component}' was not found. (Category: %{category})")
        .m ("error.invalid_component", "The component '%{component}' is not an instance of %{superclass}. (Category: %{category})")
    ;


    nit.t = function () // (scope, key, args...) or (key, args...)
    {
        var delimiter = nit.m.SCOPE_DELIMITER;
        var args = nit.array (arguments);
        var scope = args[0];
        var key = args[1];
        var ks, t, k;

        if (nit.is.obj (scope))
        {
            scope = scope.constructor;
        }

        if (nit.is.func (scope))
        {
            args.shift ();
            ks = scope.name
                .split (".")
                .concat (key.split (delimiter));
        }
        else
        {
            key = scope;
            scope = undefined;
            ks = key.split (delimiter);
        }

        if (!ks.join (delimiter).match (nit.m.KEY_PATTERN))
        {
            return key;
        }

        args.shift ();

        while ((ks.length > 1)
            && (k = ks.join (delimiter))
            && !(t = nit.m.MESSAGES[k]))
        {
            ks.splice (ks.length > 2 ? ks.length - 2 : 0, 1);
        }

        if (!t && scope && (scope = scope.classChain && scope.classChain[1] || nit.getSuperclass (scope)))
        {
            return nit.t.apply (null, [scope, key].concat (args));
        }

        key = ks[0];
        t = t || nit.m.MESSAGES[key] || key;

        return args.length ? nit.format.apply (null, [t].concat (args)) : t;
    };


    nit.throw = function (code) // ctx { code, message, ... }
    {
        var self = this;
        var args = ARRAY (arguments);
        var ctx = nit.is.obj (code) ? code : { code: code };

        code = ctx.code;
        ctx.source = ctx.source || self; // the source object that triggered the error
        ctx.owner = ctx.owner || self; // the object that owns the error
        ctx.message = ctx.message || (code.match (nit.ERROR_CODE_PATTERN) ? nit.t (self, code) : code);
        ctx.data = nit.argsToObj (args.slice (1), null, false);

        args = [ctx.message, self, ctx].concat (args.slice (1));

        var error = new Error (nit.format.apply (nit, args));

        nit.dpv (error, "context", ctx);

        throw nit.dpv (error, "code", code, false, true);
    };


    nit.ns = function (ns, obj)
    {
        if (arguments.length > 1)
        {
            var p = nit.kvSplit (ns, ".").shift ();

            nit.ns.init (p);
            nit.set (nit.NS, ns, obj);

            return obj;
        }
        else
        {
            return nit.get (nit.NS, ns);
        }
    };


    nit.ns.initializing = {};
    nit.ns.initializer = undefined;


    nit.ns.init = function (name) // initialize top-level namespace only
    {
        if (!name)
        {
            return;
        }

        var initializing = nit.ns.initializing;
        var NS = nit.NS;

        if (!NS[name] && !initializing[name])
        {
            initializing[name] = true;
            NS[name] = nit.ns.initializer && nit.ns.initializer (name) || {};
            delete initializing[name];
        }

        return NS[name];
    };


    nit.ns.invoke = function (func)
    {
        var minified = nit.name != NIT;
        var argNames = nit.funcArgNames (func);
        var args = argNames.map (function (n) { return nit.ns.reserved[n] || (n.match (/^[a-z]/) ? nit.ns.init (func.length == 1 && minified ? NIT : n) : undefined); });

        return func.apply (global, args);
    };


    nit.ns.export = function ()
    {
        nit.assign (global, nit.NS);
        nit.NS = global;
    };


    nit.ns.reserved =
    {
        global: global
    };


    nit.new = function (cls, args)
    {
        if (nit.is.str (cls))
        {
            var name = cls;
            cls = nit.lookupClass (cls);

            if (!cls)
            {
                nit.throw ("error.class_not_defined", { name: name });
            }
        }

        var obj = OBJECT_CREATE (cls.prototype);

        args = ARRAY (arguments).slice (1);

        var first = args[0];

        if (first instanceof Array || nit.typeOf (first) == "arguments")
        {
            args = ARRAY (first).concat (args.slice (1));
        }

        return cls.apply (obj, args) || obj;
    };


    nit.invoke = function (func, args, defval)
    {
        var obj = this;
        var result;

        args = nit.array (args);

        if (nit.is.arr (func))
        {
            obj = func[0];
            func = func[1];
        }

        if (!nit.is.undef (obj) && nit.is.str (func))
        {
            func = obj[func];
        }

        if (nit.is.func (func))
        {
            result = func.apply (obj, args);
        }

        if (result instanceof Promise)
        {
            return result.then (function (result)
            {
                return result === undefined ? defval : result;
            });
        }
        else
        {
            return result === undefined ? defval : result;
        }
    };


    nit.registerArgExpander = function (name, expand)
    {
        nit.ARG_EXPANDERS[name] = expand;

        return nit;
    };


    nit.registerArgExpander ("cfg", function (key)
    {
        return nit.config (key);
    });


    nit.registerArgExpander ("tpl", function (tmpl, data)
    {
        return nit.Template.render (tmpl, data);
    });


    nit.registerArgExpander ("fmt", function (tmpl, data)
    {
        return nit.format (tmpl, data);
    });


    nit.registerArgExpander ("val", function (str)
    {
        return nit.toVal (str);
    });


    nit.registerArgExpander ("env", function (key)
    {
        return nit.get (nit.ENV, key);
    });


    nit.registerArgExpander ("envMap", function (key)
    {
        var argv = nit.typedArgsToObj (nit.array (key),
        {
            from: "string",
            to: "string"
        });

        var from = argv.from || "";
        var to = argv.to || "";
        var map = {};

        if (!from)
        {
            nit.throw ("The 'from' env variable name is required.");
        }

        if (from.slice (-1) != "_")
        {
            from += "_";
        }

        if (to && to.slice (-1) != ".")
        {
            to += ".";
        }

        for (var k in nit.ENV)
        {
            if (k.indexOf (from) === 0)
            {
                var v = nit.ENV[k];
                k = k.slice (from.length);
                k = k.replace (/_/g, ".").toLowerCase ();

                nit.set (map, to + k, v);
            }
        }

        return map;
    });


    nit.registerArgExpander ("ns", function (key)
    {
        return nit.ns (key);
    });


    nit.expandArg = function (name, expArg, data)
    {
        var expander = nit.ARG_EXPANDERS[name];

        if (!expander)
        {
            nit.throw ("The arg expander '%{name}' was not registered.", { name: name });
        }

        return expander (expArg, data);
    };


    nit.Queue = nit.do (nit.registerClass (nit.createFunction ("nit.Queue",
        function (obj, args)
        {
            nit.dpvs (obj,
            {
                tasks: [].concat (ARRAY (args)),
                running: false

            }, true, false);
        })),
        function (Queue)
        {
            Queue.Stop = nit.do (nit.registerClass (nit.createFunction ("nit.Queue.Stop",
                function (obj, args)
                {
                    obj.next = args[0];
                })),
                function (Stop)
                {
                    nit.dpvs (Stop.prototype,
                    {
                        next: undefined

                    }, true, false);
                })
            ;

            nit.dpvs (Queue.prototype,
            {
                tasks: [],
                running: false,
                onSuccess: undefined,
                onFailure: undefined,
                onComplete: undefined,
                push: function (tasks) // eslint-disable-line no-unused-vars
                {
                    var self = this;
                    var st = self.tasks;

                    st.push.apply (st, nit.array (arguments, true));

                    return self;
                }
                ,
                lpush: function (tasks) // eslint-disable-line no-unused-vars
                {
                    var self = this;
                    var st = self.tasks;

                    st.unshift.apply (st, nit.array (arguments, true));

                    return self;
                }
                ,
                pop: function ()
                {
                    return this.tasks.pop ();
                }
                ,
                lpop: function ()
                {
                    return this.tasks.shift ();
                }
                ,
                success: function (onSuccess)
                {
                    this.onSuccess = onSuccess;
                    return this;
                }
                ,
                failure: function (onFailure)
                {
                    this.onFailure = onFailure;
                    return this;
                }
                ,
                complete: function (onComplete)
                {
                    this.onComplete = onComplete;
                    return this;
                }
                ,
                toTask: function ()
                {
                    var self = this;

                    return function (ctx)
                    {
                        return self.run ({ parent: ctx, result: ctx.result });
                    };
                }
                ,
                run: function (onSuccess, onFailure, onComplete, ctx) // eslint-disable-line no-unused-vars
                {
                    var self  = this;
                    var argv = nit.typedArgsToObj (arguments,
                    {
                        onSuccess: "function",
                        onFailure: "function",
                        onComplete: "function",
                        ctx: "object"
                    });

                    for (var i in argv)
                    {
                        if (i in self)
                        {
                            self[i] = argv[i];
                        }
                    }

                    if (self.running)
                    {
                        return;
                    }

                    self.running = true;
                    ctx = argv.ctx || {};
                    ctx.queue = self;
                    ctx.error = undefined;

                    var currentTasks = self.tasks;
                    var finalizing = false;
                    var finalizingError;


                    function finalize (error)
                    {
                        if (finalizing)
                        {
                            finalizingError = error;
                        }
                        else
                        {
                            finalizing = true;

                            if ((ctx.error = error))
                            {
                                if (!self.onFailure)
                                {
                                    finalizingError = error;
                                }

                                currentTasks = [self.onFailure, self.onComplete];
                            }
                            else
                            {
                                currentTasks = [self.onSuccess, self.onComplete];
                            }
                        }

                        return run ();
                    }


                    function checkResult (result)
                    {
                        if (result instanceof nit.Queue)
                        {
                            currentTasks.unshift (result.toTask ());
                            return run ();
                        }
                        else
                        if (result instanceof nit.Queue.Stop)
                        {
                            currentTasks = [result.next];
                            return run ();
                        }
                        else
                        if (result instanceof Promise)
                        {
                            return result
                                .then (checkResult)
                                .catch (finalize)
                            ;
                        }
                        else
                        {
                            ctx.result = result === undefined ? ctx.result : result;
                            return run ();
                        }
                    }


                    function run ()
                    {
                        var task = currentTasks.shift ();

                        if (task)
                        {
                            if (task instanceof nit.Queue)
                            {
                                task = task.toTask ();
                            }

                            try
                            {
                                var result = nit.is.func (task) ? task (ctx) : task;

                                return checkResult (result);
                            }
                            catch (e)
                            {
                                return finalize (e);
                            }
                        }
                        else
                        if (currentTasks.length)
                        {
                            return run ();
                        }
                        else
                        if (!finalizing)
                        {
                            return finalize ();
                        }

                        self.running = false;

                        if (finalizingError)
                        {
                            throw finalizingError;
                        }

                        return ctx.result;
                    }

                    return run ();
                }
            }, true, false);
        });


    nit.parallel = function ()
    {
        var tasks = nit.array (arguments, true)
            .map (function (t)
            {
                return nit.is.func (t) ? t () : t;
            })
        ;

        return Promise.all (tasks);
    };


    nit.sequential = function ()
    {
        return nit.Queue.apply (null, nit.array (arguments, true)).run ();
    };


    nit.promisify = function (object, method, resultOnly) // or (func)
    {
        var argv = nit.typedArgsToObj (arguments,
        {
            object: ["object", "function"],
            method: ["string", "function"],
            resultOnly: "boolean"
        });

        object = argv.object;
        method = argv.method;
        resultOnly = argv.resultOnly; // not an error-first callback

        if (nit.is.func (object) && !method)
        {
            method = object;
            object = null;
        }
        else
        if (nit.is.str (method))
        {
            method = object[method];
        }

        return function ()
        {
            var args = nit.array (arguments);
            var self = this;

            return new Promise (function (res, rej)
            {
                args.push (function (err, result)
                {
                    if (resultOnly)
                    {
                        res (err);
                    }
                    else
                    if (err)
                    {
                        rej (err);
                    }
                    else
                    {
                        res (result);
                    }
                });

                method.apply (object || self, args);
            });
        };
    };


    // -----------------------------------------
    // Object & Classes
    // -----------------------------------------

    nit.Object = nit.dpvs (nit.registerClass (nit.createFunction ("nit.Object", "return nit.constructObject (nit_Object, this, arguments);")),
    {
        TYPE_PARSERS: [],
        ITypeParser: nit.do (nit.registerClass (nit.createFunction ("nit.Object.ITypeParser")), function (ITypeParser)
        {
            nit.assign (ITypeParser.prototype,
            {
                supports: function (type) { return false; }, // eslint-disable-line no-unused-vars
                defval: undefined,
                cast: function (v, type) {}, // eslint-disable-line no-unused-vars
                order: 100
            });
        })
        ,
        registerTypeParser: function (parser, order)
        {
            var cls = nit.Object;

            parser.order = order || parser.order;

            cls.TYPE_PARSERS.push (parser);
            cls.TYPE_PARSERS.sort (function (a, b) { return a.order - b.order; });

            return this;
        }
        ,
        registerStringTypeParser: function (name)
        {
            var cls = this;
            var parserCls = this.PrimitiveTypeParser;
            cls.registerTypeParser (new parserCls (name, "", function (v) { return nit.is.undef (v) ? "" : parserCls.valueToString (v); }));

            return cls;
        }
        ,
        findTypeParser: function (type, nullable)
        {
            var parser;

            return this.TYPE_PARSERS.some (function (p) { return p.supports (type, nullable) && (parser = p); }) && parser;
        }
        ,
        Property: nit.do (nit.registerClass (nit.createFunction ("nit.Object.Property", true)), function (Property)
        {
            var Writer = Property.Writer = nit.registerClass (nit.createFunction (Property.name + ".Writer", function (obj)
            {
                obj.id = nit.uuid ();
            }));


            var Value = Property.Writer.Value = nit.registerClass (nit.createFunction (Writer.name + ".Value", function (obj, args)
            {
                obj.id = args[0];
                obj.value = args[1];
            }));


            Writer.prototype.value = function (v)
            {
                return new Value (this.id, v);
            };


            PROPERTY_WRITER = new Writer;


            Property.constructObject = function (obj, args)
            {
                return nit.assign (obj, nit.argsToObj (args, ["spec", "type", "defval", "configurable", "enumerable"], true));
            };


            Property.invalidValueCode = function (prop)
            {
                return "error." + (prop.mixedType ? "invalid_mixed_type" : (prop.primitive ? "invalid_value_type" : "invalid_instance_type"));
            };


            Property.filterValues = function (prop, owner, values)
            {
                var isAny = prop.type == "any";

                return values
                    .map (function (v) // eslint-disable-line array-callback-return
                    {
                        if (!prop.nullable || !nit.is.empty (v))
                        {
                            if (isAny
                                || (!prop.array && !prop.required)
                                || (prop.emptyAllowed && !nit.is.undef  (v))
                                || !nit.is.empty (v))
                            {
                                v = prop.cast (owner, v);
                            }

                            if (isAny
                                || (!prop.array && !prop.required)
                                || (prop.emptyAllowed && !nit.is.undef  (v))
                                || !nit.is.empty (v))
                            {
                                return v;
                            }
                        }
                    })
                    .filter (function (v) { return isAny || !nit.is.undef (v); })
                ;
            };


            Property.patchArray = function (prop, owner, arr)
            {
                ["push", "unshift"].forEach (function (method)
                {
                    var arrayMethod = ARR_PROTO[method];
                    var isAny = prop.type == "any";

                    nit.dpv (arr, method, function (v) // eslint-disable-line no-unused-vars
                    {
                        var vs = Property.filterValues (prop, owner, ARRAY (arguments));

                        Property.link (prop, owner, vs);

                        return vs.length || isAny ? arrayMethod.apply (arr, vs) : arr.length;
                    });
                });

                ["pop", "shift"].forEach (function (method)
                {
                    var arrayMethod = ARR_PROTO[method];

                    nit.dpv (arr, method, function ()
                    {
                        var v = arrayMethod.call (arr);

                        Property.unlink (prop, owner, v);

                        return v;
                    });
                });

                ["splice"].forEach (function (method)
                {
                    var arrayMethod = ARR_PROTO[method];

                    nit.dpv (arr, method, function ()
                    {
                        var args = ARRAY (arguments);
                        var added = Property.filterValues (prop, owner, args.slice (2));
                        var removed = arrayMethod.apply (arr, args);

                        Property.unlink (prop, owner, removed);
                        Property.link (prop, owner, added);

                        return removed;
                    });
                });
            };


            Property.defval = function (prop, owner, defval)
            {
                defval = nit.is.func (defval) ? prop.defval (prop, owner) : nit.clone (defval);

                if (prop.array)
                {
                    if (!nit.is.arr (defval))
                    {
                        if (!nit.is.empty (defval) && prop.parser.defval !== defval)
                        {
                            defval = [defval];
                        }
                        else
                        {
                            defval = [];
                        }
                    }

                    if (prop.nullable && !defval.length)
                    {
                        defval = undefined;
                    }
                }

                return defval;
            };


            Property.get = function (prop, owner)
            {
                var privProp = prop.privProp;
                var v = owner[privProp];

                if (!owner.hasOwnProperty (privProp))
                {
                    var defval = Property.defval (prop, owner, prop.defval);

                    Property.set (prop, owner, defval, true);

                    v = owner[privProp];
                }

                return prop.getter ? prop.getter.call (owner, v, prop) : v;
            };


            Property.set = function (prop, owner, v, writer)
            {
                if (writer !== true)
                {
                    if (writer)
                    {
                        if (v instanceof Value && writer.id == v.id)
                        {
                            v = v.value;
                        }
                        else
                        {
                            return;
                        }
                    }
                }

                var isArr = nit.is.arr (v);
                var isAny = prop.type == "any";
                var privProp = prop.privProp;

                if (isArr && !prop.array && !isAny)
                {
                    nit.throw.call (owner, { code: Property.invalidValueCode (prop), source: prop, owner: owner }, { value: v, property: prop });
                }

                v = Property.filterValues (prop, owner, isArr ? v : nit.array (v));

                if (prop.array && !isArr && prop.nullable && !v.length)
                {
                    v = undefined;
                }
                else
                if (prop.array || (isArr && isAny))
                {
                    Property.patchArray (prop, owner, v);
                }
                else
                {
                    v = v.length ? v[0] : prop.cast (owner);
                }

                if (writer !== true)
                {
                    if (prop.setter)
                    {
                        v = prop.setter.call (owner, v, prop);
                    }

                    if (prop.required && nit.is.empty (v))
                    {
                        nit.throw.call (owner, { code: "error.value_required", source: prop, owner: owner, class: owner.constructor.name }, { property: prop });
                    }
                }

                if (nit.is.func (v) && !v.name) // reset the anonymous function name
                {
                    nit.dpv (v, "name", "", true, false);
                }

                if (!owner.hasOwnProperty (privProp))
                {
                    nit.dpv (owner, privProp, v, true, false);
                }
                else
                {
                    Property.unlink (prop, owner, owner[privProp]);

                    owner[privProp] = v;
                }

                Property.link (prop, owner, v);

                if (prop.shouldValidate (owner)
                    && !nit.is.promise (v)
                    && (!nit.is.empty (v) || prop.required))
                {
                    return prop.validate (owner, v);
                }
            };


            Property.link = function (prop, owner, value)
            {
                nit.array (value).forEach (function (v)
                {
                    if (prop.onLink)
                    {
                        prop.onLink.call (owner, v, prop);
                    }

                    if (prop.backref && nit.is.obj (v))
                    {
                        v[prop.backref] = owner;
                    }
                });
            };


            Property.unlink = function (prop, owner, value)
            {
                nit.array (value).forEach (function (v)
                {
                    if (prop.onUnlink)
                    {
                        prop.onUnlink.call (owner, v, prop);
                    }

                    if (prop.backref && nit.is.obj (v))
                    {
                        v[prop.backref] = undefined;
                    }
                });
            };


            Property.cast = function (prop, owner, value, parser)
            {
                var cv;

                if (nit.is.undef (value))
                {
                    if (prop.nullable || nit.is.undef (prop.defval))
                    {
                        return value;
                    }

                    value = nit.is.func (prop.defval) ? prop.defval (prop, owner) : nit.clone (prop.defval);
                }

                if ((cv = (parser || prop.parser).cast (value, prop.type)) === undefined)
                {
                    nit.throw.call (owner, { code: Property.invalidValueCode (prop), source: prop, owner: owner }, { value: value, property: prop });
                }

                return cv;
            };


            Property.validate = function (prop, owner, value) // validate constraints
            {
                var vals = nit.is.arr (value) ? value : [value];
                var q = nit.Queue ();

                nit.each (vals, function (value)
                {
                    var ctx = prop.createValidationContext (owner, value);

                    q.push (nit.each (prop.constraints, function (cons)
                    {
                        return function ()
                        {
                            return cons.validate (ctx);
                        };
                    }));
                });

                return q.run (function () { return value; });
            };


            Property.new = function (cls, spec, type, defval, configurable, enumerable)
            {
                var cfg = Property.constructObject ({}, ARRAY (arguments).slice (1));

                spec = nit.trim (cfg.spec);
                type = cfg.type || Property.prototype.type;
                defval = cfg.defval;
                configurable = cfg.configurable;
                enumerable = cfg.enumerable === undefined ? configurable : cfg.enumerable;

                var ch = spec[0];
                var required = false;
                var positional = false;
                var array = !!cfg.array;
                var writer = cfg.writer;
                var typeMod = type.slice (-1);
                var nullable;
                var emptyAllowed;
                var name;

                if (~"?*".indexOf (typeMod))
                {
                    type = type.slice (0, -1);
                    emptyAllowed = typeMod == "*";
                    nullable = typeMod == "?";
                }

                delete cfg.writer;

                if (ch == "[" || ch == "<")
                {
                    name = spec.slice (1, -1);
                    required = ch == "<";
                    positional = true;
                }
                else
                {
                    name = spec;
                }

                if (name.slice (-3) == "...")
                {
                    array = true;
                    name = name.slice (0, -3);
                }

                var parser = nit.Object.findTypeParser (type, nullable);
                var get = cfg.get || Property.get;
                var set = cfg.set || Property.set;
                var prop = new Property (spec, type, undefined, configurable, enumerable,
                {
                    defval: defval,
                    name: name,
                    required: required,
                    positional: positional,
                    nullable: nullable,
                    emptyAllowed: emptyAllowed,
                    array: array,
                    kind: cfg.kind || Property.prototype.kind,
                    setter: cfg.setter,
                    getter: cfg.getter,
                    caster: cfg.caster,
                    backref: cfg.backref,
                    onLink: cfg.onLink,
                    onUnlink: cfg.onUnlink,
                    primitive: !(parser instanceof nit.Object.ClassTypeParser),
                    mixedType: parser instanceof nit.Object.MixedTypeParser,
                    parser: parser,
                    privProp: nit.PPP + name,
                    constraints: nit.array (cfg.constraints),
                    get: function () { return get (prop, this); },
                    set: function (v) { return set (prop, this, v, writer); }
                });

                nit.dpv (prop.get, "setDescriptor", function (p)
                {
                    prop = p;

                }, true, false);

                if (!name)
                {
                    nit.throw.call (cls, "error.name_required", { property: prop });
                }

                if (!parser)
                {
                    nit.throw.call (cls, "error.invalid_type", { property: prop });
                }

                if (nit.is.undef (defval) && !nullable)
                {
                    prop.defval = parser.defval;
                }

                for (var i in cfg)
                {
                    if (!(i in prop) && !nit.is.int (i))
                    {
                        prop[i] = cfg[i];
                    }
                }

                return prop;
            };


            nit.assign (Property.prototype,
            {
                spec: "",
                name: "",
                required: false,
                type: "string",
                array: false,
                defval: undefined,
                positional: false,
                configurable: undefined,
                enumerable: undefined,
                nullable: false,
                emptyAllowed: false,
                primitive: false,
                mixedType: false,
                kind: "property",
                get: undefined,
                set: undefined,
                getter: undefined,
                setter: undefined,
                backref: undefined,
                onLink: undefined,
                onUnlink: undefined,
                caster: undefined,
                parser: undefined,
                privProp: "",
                constraints: [],
                // A constraint is an object with a "validate" method
                // which parameter is an object of owner, value, and property.

                shouldValidate: function (owner) // eslint-disable-line no-unused-vars
                {
                    return true;
                }
                ,
                cast: function (owner, value, parser)
                {
                    var prop = this;

                    if (prop.caster)
                    {
                        value = prop.caster.call (owner, value, prop, parser);
                    }

                    return Property.cast (prop, owner, value, parser);
                }
                ,
                createValidationContext: function (owner, value)
                {
                    return { value: value, owner: owner, property: this };
                }
                ,
                validate: function (owner, value)
                {
                    return Property.validate (this, owner, value);
                }
            });

            nit.dpgs (Property.prototype,
            {
                class: function ()
                {
                    return this.primitive ? undefined : nit.lookupClass (this.type);
                }
            });
        })
        ,
        do: function (prop, cb) // eslint-disable-line no-unused-vars
        {
            var self = this;
            var cfg = nit.typedArgsToObj (arguments,
            {
                prop: "string",
                cb: "function"
            });

            return nit.do (cfg.prop ? nit.get (self, cfg.prop) : self, function (obj)
            {
                nit.invoke ([self, cfg.cb], [obj]);

                return self;
            });
        }
        ,
        m: function (key, message) // eslint-disable-line no-unused-vars
        {
            nit.m.apply (nit, [this].concat (ARRAY (arguments)));

            return this;
        }
        ,
        k: function ()
        {
            return nit.k.apply (nit, [this].concat (ARRAY (arguments)));
        }
        ,
        t: function ()
        {
            return nit.t.apply (nit, [this].concat (ARRAY (arguments)));
        }
        ,
        throw: function (code) // eslint-disable-line no-unused-vars
        {
            nit.throw.apply (this, arguments);
        }
        ,
        extend: function (superclass, mixins) // eslint-disable-line no-unused-vars
        {
            var cls = nit.extend (this, superclass);

            nit.each (nit.array (arguments).slice (1), function (mixin)
            {
                nit.mix (cls, mixin);
            });

            if (cls.invalidatePropertyCache)
            {
                cls.invalidatePropertyCache ("classChain");
            }

            return cls;
        }
        ,
        registerInnerClass: function (name, cls)
        {
            var self = this;

            if (nit.is.func (name))
            {
                cls = name;
                name = cls.name;
            }

            if (!name)
            {
                self.throw ("error.inner_class_name_required");
            }

            name = name.split (".").pop ();

            nit.dpv (cls, "name", self.name + "." + name, true, false);
            nit.dpv (self, name, cls, true, false);
            nit.dpv (cls, "outerClass", self, true, false);
            nit.registerClass (cls);

            return self;
        }
        ,
        defineInnerClass: function (name, superclass, builder, local, categorize, pargs) // eslint-disable-line no-unused-vars
        {
            var self = this;
            var cfg = nit.typedArgsToObj (arguments,
            {
                name: "string",
                superclass: "string",
                builder: "function",
                local: "boolean",
                categorize: ["string", "boolean"],
                pargs: "array"
            });

            var fqn = self.name + "." + cfg.name;

            cfg.superclass = cfg.superclass || self.INNER_CLASS_TYPE;
            cfg.local = cfg.local || nit.CLASSES[self.name] != self;
            superclass = nit.lookupClass (cfg.superclass);

            if (!superclass)
            {
                self.throw ("error.superclass_not_defined", cfg);
            }

            var ns = nit.kvSplit (cfg.name, ".", true);
            var p = ns[0];
            var target = self;

            if (p)
            {
                p.split (".").forEach (function (n)
                {
                    if (!target[n])
                    {
                        nit.dpv (target, n, {}, true, true);
                    }

                    target = target[n];
                });
            }

            target = nit.get (self, p);
            name = ns[1];

            var innerClass;

            if (nit.is.func (superclass.defineSubclass))
            {
                innerClass = superclass.defineSubclass (fqn, cfg.local, cfg.pargs);
            }
            else
            {
                innerClass = nit.extend (nit.createFunction (fqn, true, cfg.pargs), superclass);
            }

            nit.dpv (target, name, innerClass, true, nit.is.obj (target) || cfg.local); // enumerable for local classes
            nit.dpv (innerClass, "outerClass", self, true, false);

            if (!cfg.local)
            {
                nit.registerClass (innerClass);
            }

            if (cfg.builder)
            {
                cfg.builder.call (self, innerClass);
            }

            if ((categorize = cfg.categorize))
            {
                var prefix = nit.is.str (categorize) ? categorize + "." : "";

                self.staticMethod ("define" + name, function (name, superclass, builder) // eslint-disable-line no-unused-vars
                {
                    var cfg = nit.typedArgsToObj (arguments,
                    {
                        name: "string",
                        superclass: "string",
                        builder: "function"
                    });

                    return this.defineInnerClass (prefix + cfg.name, cfg.superclass || innerClass.name, cfg.builder);
                });
            }

            return self;
        }
        ,
        defineProperty: function (owner, spec, type, defval, configurable, enumerable)
        {
            var cls = this;
            var prop = nit.Object.Property.new (cls, spec, type, defval, configurable, enumerable);

            nit.dpv (prop.get, cls.kProperty, prop);
            nit.dp (owner, prop.name, prop);

            return cls;
        }
        ,
        defineDelegate: function (target, from, to, configurable, enumerable)
        {
            var cls = this;
            var cfg = nit.Object.Property.constructObject ({}, [from, "any", undefined, configurable, enumerable]);
            var parts = to.split (".");
            var key = parts.pop ();
            var prefix = parts.join (".");

            cfg.configurable = nit.coalesce (cfg.configurable, true);
            cfg.enumerable = nit.coalesce (cfg.enumerable, false);

            var prop = nit.Object.Property.new (cls, cfg);

            prop.get = function ()
            {
                return nit.get (this, to);
            };

            prop.set = function (v)
            {
                var obj = nit.get (this, prefix);

                if (!nit.is.undef (obj))
                {
                    obj[key] = v;
                }
            };

            nit.dpv (prop.set, cls.kProperty, prop); // so that getProperties () will not include this prop
            nit.dp (target, prop.name, prop);

            return cls;
        }
        ,
        defineGetter: function (target, name, getter, configurable, enumerable)
        {
            var cls = this;
            var cfg = nit.typedArgsToObj (ARRAY (arguments).slice (1),
            {
                name: "string",
                getter: ["function", "string"],
                configurable: "boolean",
                enumerable: "boolean"
            });

            var g = cfg.getter;
            var isStr = nit.is.str (g);
            var prefix = isStr && ~g.indexOf (".") ? nit.kvSplit (g, ".", true)[0] : "";

            name = cfg.name;
            getter = !isStr ? g : function ()
            {
                var owner = this;
                var val = nit.get (owner, g);

                if (nit.is.func (val) && prefix)
                {
                    val = val.bind (nit.get (owner, prefix));
                }

                return val;
            };

            configurable = nit.coalesce (cfg.configurable, true);
            enumerable = nit.coalesce (cfg.enumerable, true);

            nit.dpg (target, name, getter, configurable, enumerable);

            return cls;
        }
        ,
        invalidateProperty: function (name, owner)
        {
            var cls = this;

            owner = owner || cls;

            delete owner[nit.PPP + name];

            return cls;
        }
        ,
        invalidatePropertyCache: function ()
        {
            var cls = this;

            nit.array (arguments).concat ("properties", "propertyNames", "propertyMap", "pargs", "pargNames", "pargMap")
                .forEach (function (p) { cls.invalidateProperty (p); })
            ;

            return cls;
        }
        ,
        validatePropertyDeclarations: function ()
        {
            var cls = this;
            var prevParg;
            var arrayParg;

            if (cls[cls.kValidatePropertyDeclarationsDisabled])
            {
                return cls;
            }

            cls.invalidatePropertyCache ();

            cls.properties.forEach (function (p)
            {
                if (p.positional)
                {
                    if (p.array)
                    {
                        if (arrayParg)
                        {
                            cls.throw ("error.multiple_positional_variadic_args", { firstArg: arrayParg.name, secondArg: p.name });
                        }

                        arrayParg = p;
                    }

                    if (prevParg && !prevParg.required && p.required)
                    {
                        cls.throw ("error.required_arg_after_optional", { optionalArg: prevParg.name, requiredArg: p.name });
                    }

                    prevParg = p;
                }
            });

            return cls;
        }
        ,
        constant: function (name, value, freeze)
        {
            if (freeze)
            {
                value = nit.freeze (value);
            }

            return nit.dpg (this, name, function () { return value; }, false, false);
        }
        ,
        defineMeta: function (spec, type, defval, configurable, enumerable) // eslint-disable-line no-unused-vars
        {
            var cls = this;
            var Property = nit.Object.Property;
            var cfg = Property.constructObject ({}, arguments);

            cfg.configurable = nit.coalesce (cfg.configurable, true);
            cfg.enumerable = nit.coalesce (cfg.enumerable, true);
            cfg.get = function (prop, owner)
            {
                var privProp = prop.privProp;

                if (!owner.hasOwnProperty (privProp) && owner == cls)
                {
                    nit.Object.Property.get (prop, owner);
                }

                return owner.hasOwnProperty (privProp) ? owner[privProp] : owner.superclass[prop.name];
            };

            var prop = nit.Object.Property.new (cls, cfg);

            nit.dpv (prop.get, cls.kProperty, prop);
            nit.dpv (prop.get, cls.kMeta, true);
            nit.dp (cls, prop.name, prop);

            return cls;
        }
        ,
        meta: function (key, value)
        {
            var meta = {};

            if (nit.is.obj (key))
            {
                meta = key;
            }
            else
            {
                meta[key] = value;
            }

            var cls = this;

            for (key in meta)
            {
                var isMeta = nit.classChain (cls).find (function (cls)
                {
                    var prop = Object.getOwnPropertyDescriptor (cls, key);

                    return prop && prop.get[nit.Object.kMeta];
                });

                if (isMeta)
                {
                    cls[key] = meta[key];
                }
            }

            return cls;
        }
        ,
        staticGetter: function (name, getter, configurable, enumerable)
        {
            var cls = this;

            return cls.defineGetter (cls, { enumerable: false }, name, getter, configurable, enumerable);
        }
        ,
        staticMemo: function (name, initializer, configurable, enumerable, validator)
        {
            return nit.memoize.dpg (this, { enumerable: false }, name, initializer, configurable, enumerable, validator);
        }
        ,
        staticProperty: function (spec, type, defval, configurable, enumerable) // eslint-disable-line no-unused-vars
        {
            var cls = this;
            var cfg = nit.Object.Property.constructObject ({}, arguments);

            cfg.configurable = nit.coalesce (cfg.configurable, true);
            cfg.enumerable = nit.coalesce (cfg.enumerable, false);

            return cls.defineProperty (cls, cfg);
        }
        ,
        staticDelegate: function (from, to, configurable, enumerable)
        {
            var cls = this;

            return cls.defineDelegate (cls, from, to, configurable, enumerable);
        }
        ,
        staticMethod: function (name, method)
        {
            return nit.dpv (this, name, method, true, false);
        }
        ,
        staticMemoMethod: function (name, method)
        {
            var cls = this;
            var memoProp = name + "Result";

            cls.staticMemo (memoProp, method, true, false);

            return cls.staticMethod (name, function () { return this[memoProp]; });
        }
        ,
        staticSymbolMethod: function (name, method)
        {
            if ((name = nit.get (global.Symbol, name)))
            {
                this.staticMethod (name, method);
            }

            return this;
        }
        ,
        staticLifecycleMethod: function (name, impl, hook) // hook could be a function or the boolean value 'true'
        {
            if (nit.is.bool (impl))
            {
                var tmp = impl;

                impl = hook;
                hook = tmp;
            }

            var cls = this;
            var key = cls.name + "." + name;
            var hookMethod = "on" + nit.ucFirst (name);

            if (hook === true) // The callback should be provided, otherwise throw an error when invoked.
            {
                hook = function ()
                {
                    this.throw ("error.lifecycle_hook_not_implemented", { method: name, class: cls.name });
                };
            }

            return cls
                .k (name)
                .staticMethod (hookMethod, function (hook)
                {
                    return this.staticMethod (key, hook);
                })
                .do (function ()
                {
                    if (hook)
                    {
                        this[hookMethod] (hook);
                    }
                })
                .staticMethod (name, function ()
                {
                    var cls = this;
                    var method = impl || cls[key];

                    return method ? method.apply (cls, arguments) : cls;
                })
            ;
        }
        ,
        lifecycleMethod: function (name, impl, hook) // hook could be a function or the boolean value 'true'
        {
            if (nit.is.bool (impl))
            {
                var tmp = impl;

                impl = hook;
                hook = tmp;
            }

            var cls = this;
            var key = cls.name + "." + name;
            var hookMethod = "on" + nit.ucFirst (name);

            if (hook === true) // The callback should be provided, otherwise throw an error when invoked.
            {
                hook = function ()
                {
                    this.throw ("error.lifecycle_hook_not_implemented", { method: name, class: this.constructor.name });
                };
            }

            return cls
                .k (name)
                .staticMethod (hookMethod, function (hook)
                {
                    return this.staticMethod (key, hook);
                })
                .do (function ()
                {
                    if (hook)
                    {
                        this[hookMethod] (hook);
                    }
                })
                .method (name, function ()
                {
                    var self = this;
                    var cls = self.constructor;
                    var method = impl || cls[key];

                    return method ? method.apply (self, arguments) : self;
                })
            ;
        }
        ,
        invokeClassChainMethod: function (method, args, reverse, result)
        {
            var cls = this;
            var q = nit.Queue ();
            var chain = cls.classChain.slice ();
            var target = cls;

            if (nit.is.arr (method))
            {
                target = method[0];
                method = method[1];
            }

            if (reverse)
            {
                chain.reverse ();
            }

            chain
                .forEach (function (cls)
                {
                    if (cls.hasOwnProperty (method))
                    {
                        q.push (function ()
                        {
                            return nit.invoke.call (target, cls[method], args);
                        });
                    }
                })
            ;

            return q.tasks.length ? q.run (function () { return result; }) : result;
        }
        ,
        memo: function (name, initializer, configurable, enumerable, validator)
        {
            var cls = this;

            nit.memoize.dpg (cls.prototype, name, initializer, configurable, enumerable, validator);

            return cls;
        }
        ,
        getter: function (name, getter, configurable, enumerable)
        {
            var cls = this;

            return cls.defineGetter (cls.prototype, name, getter, configurable, enumerable);
        }
        ,
        property: function (spec, type, defval, configurable, enumerable) // eslint-disable-line no-unused-vars
        {
            var cls = this;
            var cfg = nit.Object.Property.constructObject ({}, arguments);

            cfg.configurable = nit.coalesce (cfg.configurable, true);
            cfg.enumerable = nit.coalesce (cfg.enumerable, true);

            return cls.defineProperty (cls.prototype, cfg)
                .validatePropertyDeclarations ()
            ;
        }
        ,
        delegate: function (from, to, configurable, enumerable)
        {
            var cls = this;

            return cls.defineDelegate (cls.prototype, from, to, configurable, enumerable);
        }
        ,
        method: function (name, method)
        {
            nit.dpv (this.prototype, name, method, true, false);

            return this;
        }
        ,
        memoMethod: function (name, method)
        {
            var cls = this;
            var memoProp = name + "Result";

            cls.memo (memoProp, method, true, false);

            return cls.method (name, function () { return this[memoProp]; });
        }
        ,
        symbolMethod: function (name, method)
        {
            if ((name = nit.get (global.Symbol, name)))
            {
                this.method (name, method);
            }

            return this;
        }
        ,
        categorize: function (prefix, local) // eslint-disable-line no-unused-vars
        {
            var declCfg = nit.typedArgsToObj (arguments,
            {
                prefix: "string",
                local: "boolean"
            });

            var self  = this;
            var ns    = self.name.split (".");
            var type  = ns.pop ();
            var fqn   = (ns.length ? ns.join (".") : NIT) + ".define" + type;

            function defineSubclass (name, superclass, construct, local, pargs) // eslint-disable-line no-unused-vars
            {
                var cfg = nit.typedArgsToObj (arguments,
                {
                    name: "string",
                    superclass: "string",
                    construct: "function",
                    local: "boolean",
                    pargs: "array"
                });

                local = nit.coalesce (cfg.local, declCfg.local);
                superclass = cfg.superclass || self;

                if (cfg.superclass
                    && !(superclass = nit.lookupClass (cfg.superclass)))
                {
                    self.throw ("error.superclass_not_defined", cfg);
                }

                if (!nit.is.subclassOf (superclass, self, true))
                {
                    self.throw ("error.invalid_superclass_type", cfg, { parent: self.name });
                }

                if (declCfg.prefix && !~cfg.name.indexOf ("."))
                {
                    cfg.name = declCfg.prefix + "." + cfg.name;
                }

                return superclass.defineSubclass (cfg.name, cfg.construct, local, cfg.pargs);
            }

            nit.dpv (defineSubclass, "name", fqn, true, false);
            nit.ns (fqn, defineSubclass);

            return self;
        }

    }, true, false);


    nit.Object
        .k ("property", "meta", "defvals", "validatePropertyDeclarationsDisabled")
        .m ("error.name_required", "The %{property.kind} name is required.")
        .m ("error.value_required", "The %{property.kind} '%{property.name}' is required. (Class: %{class})")
        .m ("error.class_name_required", "The class name cannot be empty.")
        .m ("error.invalid_property_type", "The property type '%{type}' is invalid.")
        .m ("error.invalid_type", "The %{property.kind} '%{property.name}' was assigned to an invalid type '%{property.type}'.")
        .m ("error.invalid_value_type", "The value of '%{property.name}' should be %{property.type|nit.indefiniteArticle} %{property.type}. (Given: %{value|nit.Object.serialize})")
        .m ("error.invalid_instance_type", "The value of '%{property.name}' should be an instance of %{property.type}. (Given: %{value|nit.Object.serialize})")
        .m ("error.invalid_mixed_type", "The value of '%{property.name}' should be one of the following type: %{property.type.split ('\\|').join (', ')}. (Given: %{value.constructor.name})")
        .m ("error.multiple_positional_variadic_args", "Only one positional variadic argument can be defined. Either '%{firstArg}' or '%{secondArg}' must be removed.")
        .m ("error.required_arg_after_optional", "The optional positional argument '%{optionalArg}' cannot be followed by a required argument '%{requiredArg}'.")
        .m ("error.not_implemented", "Method not implemented!")
        .m ("error.lifecycle_hook_not_implemented", "The hook for the lifecycle method '%{method}' of the class '%{class}' was not implemented!")
        .m ("error.dependency_not_met", "The dependency '%{name}' was not defined.")
        .m ("error.invoke_method_not_defined", "The invoke method for the type-checked method was not defined.")
        .m ("error.inner_class_name_required", "The inner class name is required.")
        .m ("error.superclass_not_defined", "The superclass '%{superclass}' was not defined.")
        .m ("error.invalid_superclass_type", "The superclass '%{superclass}' is not a subclass of %{parent}.")
        .m ("error.class_not_defined", "The class '%{name}' was not defined.")

        .defineInnerClass ("PrimitiveTypeParser", "nit.Object.ITypeParser", ["type", "defval", "cast"], function (PrimitiveTypeParser)
        {
            PrimitiveTypeParser.constructObject = function (obj, args)
            {
                nit.assign (obj, { type: args[0], defval: args[1], cast: args[2] });
            };


            PrimitiveTypeParser.valueToString = function (v)
            {
                return typeof v == "object" || typeof v == "function" ? undefined : (v + "");
            };


            PrimitiveTypeParser.prototype.supports = function (type)
            {
                return type == this.type;
            };
        })
        .defineInnerClass ("ClassTypeParser", "nit.Object.ITypeParser", function (ClassTypeParser)
        {
            nit.assign (ClassTypeParser.prototype,
            {
                supports: function (type, nullable)
                {
                    // If nullable is true, then it will not try to load the class to prevent
                    // cascade loading issues.

                    return !!(type && (!nullable && this.lookupClass (type) || type.match (nit.CLASS_NAME_PATTERN)));
                }
                ,
                lookupClass: function (type)
                {
                    return nit.lookupClass (type);
                }
                ,
                new: function (cls, v)
                {
                    return new cls (v);
                }
                ,
                cast: function (v, type)
                {
                    if (nit.is.undef (v))
                    {
                        return;
                    }

                    if (!type)
                    {
                        nit.Object.throw ("error.class_name_required");
                    }

                    var self = this;
                    var cls = self.lookupClass (type);

                    if (!cls)
                    {
                        nit.Object.throw ("error.class_not_defined", { name: type });
                    }

                    var isPojo = nit.is.pojo (v) || v instanceof nit.object;

                    if (v instanceof cls)
                    {
                        return v;
                    }
                    else
                    if (nit.is.obj (v) && !isPojo)
                    {
                        return;
                    }

                    if (nit.is.str (v) && v.match (nit.CLASS_REF_PATTERN))
                    {
                        cls = self.lookupClass (v.slice (1));
                        v = undefined;
                    }
                    else
                    if (isPojo && nit.CLASS_TAG in v)
                    {
                        cls = self.lookupClass (v[nit.CLASS_TAG]);
                        v = nit.assign ({}, v);
                    }

                    if (cls && (v === undefined || isPojo || cls.pargs && cls.pargs.length))
                    {
                        return self.new (cls, v);
                    }
                }
            });
        })
        .defineInnerClass ("MixedTypeParser", "nit.Object.ITypeParser", function (MixedTypeParser)
        {
            nit.assign (MixedTypeParser.prototype,
            {
                supports: function (type, nullable)
                {
                    var self = this;

                    return ~type.indexOf ("|") && type.split ("|").every (function (t)
                    {
                        return nit.Object.TYPE_PARSERS.some (function (p)
                        {
                            return p != self && p.supports (t, nullable);
                        });
                    });
                }
                ,
                cast: function (v, type)
                {
                    var self = this;
                    var types = type.split ("|");

                    for (var i = 0; i < types.length; ++i)
                    {
                        var t = types[i];
                        var casted;

                        try
                        {
                            if (nit.Object.TYPE_PARSERS.some (function (p) { return p != self && p.supports (t) && (casted = p.cast (v, t)) !== undefined; }))
                            {
                                return casted;
                            }
                        }
                        catch (e)
                        {
                        }
                    }
                }
            });
        })
        .do (function (Object)
        {
            Object
                .registerStringTypeParser ("string")
                .registerTypeParser (new Object.PrimitiveTypeParser ("boolean", false, function (v) {  v += ""; return v == "true" ? true : (v == "false" ? false : undefined); }))
                .registerTypeParser (new Object.PrimitiveTypeParser ("number", 0, function (v) { return nit.is.num (v) ? +v : undefined; }))
                .registerTypeParser (new Object.PrimitiveTypeParser ("integer", 0, function (v) { return nit.is.int (v) ? +v : undefined; }))
                .registerTypeParser (new Object.PrimitiveTypeParser ("object", function () { return nit.object (); }, function (v) { return typeof v == "object" ? (nit.is.pojo (v) ? nit.object (nit.clone (v)) : v) : undefined; }))
                .registerTypeParser (new Object.PrimitiveTypeParser ("pojo", function () { return {}; }, function (v) { return nit.is.pojo (v) ? nit.clone (v) : undefined; }))
                .registerTypeParser (new Object.PrimitiveTypeParser ("function", undefined, function (v) { return typeof v == "function" ? v : undefined; }))
                .registerTypeParser (new Object.PrimitiveTypeParser ("date", undefined, function (v) { var d = new Date (v); return isNaN (d) ? undefined : d; }))
                .registerTypeParser (new Object.PrimitiveTypeParser ("any", undefined, function (v) { return v; }))
                .registerTypeParser (new Object.ClassTypeParser (), 200)
                .registerTypeParser (new Object.MixedTypeParser (), 300)
            ;
        })
        .constant ("PRIMARY_PROPERTY_TYPE", "nit.Object.Property")
        .constant ("INNER_CLASS_TYPE", "nit.Object")
        .staticProperty (nit.Object.kDefvals, "object", nit.object (), false, false)
        .staticMemo ("simpleName", function ()
        {
            return this.name.split (".").pop ();
        })
        .staticMemo ("classChain", function ()
        {
            return nit.classChain (this);
        })
        .staticMemo ("properties", function ()
        {
            return this.getProperties ();
        })
        .staticMemo ("propertyNames", function ()
        {
            return this.properties.map (function (p) { return p.name; });
        })
        .staticMemo ("propertyMap", function ()
        {
            return nit.index (this.properties, "name");
        })
        .staticMemo ("pargs", function ()
        {
            return this.properties.filter (function (p) { return p.positional; });
        })
        .staticMemo ("pargNames", function ()
        {
            return this.pargs.map (function (p) { return p.name; });
        })
        .staticMemo ("pargMap", function ()
        {
            return nit.index (this.pargs, "name");
        })
        .staticGetter ("superclass", true, false, function ()
        {
            return nit.getSuperclass (this);
        })
        .staticMethod ("beginDefineProperties", function ()
        {
            return nit.dpv (this, this.kValidatePropertyDeclarationsDisabled, true, true, false);
        })
        .staticMethod ("endDefineProperties", function ()
        {
            var cls = this;

            delete cls[cls.kValidatePropertyDeclarationsDisabled];

            return cls.validatePropertyDeclarations ();
        })
        .staticMethod ("defineNamespace", function (ns)
        {
            return this.staticMemo (ns, function ()
            {
                var sp = this.superclass;

                return Object.create (sp && sp[ns] || {});
            });
        })
        .staticMethod ("getClassChainProperty", function (property, all)
        {
            var cls = this;
            var vals = nit.array (cls.classChain.map (function (cls) { return cls[property]; }), true)
                .filter (nit.is.not.empty)
            ;

            return all ? vals : vals[0];
        })
        .staticMethod ("require", function (name)
        {
            var self = this;
            var cls = nit.lookupClass (name);

            if (!cls)
            {
                self.throw ("error.dependency_not_met", { name: name });
            }

            return self;
        })
        .staticMethod ("use", function (name)
        {
            var cls = this;
            var args = nit.array (arguments).slice (1);
            var pn = [""].concat (nit.array (name)).slice (-2);
            var p = pn[0];
            var n = pn[1];
            var parsers = cls.use.parsers;

            for (var i = 0; i < parsers.length; ++i)
            {
                var loader = parsers[i] (p, n, args);

                if (loader)
                {
                    cls.staticMemo (loader.name, loader);
                    break;
                }
            }

            return cls;
        })
        .do ("use", function (use)
        {
            use.parsers =
            [
                function lookupComponent (property, name, args)
                {
                    if (~name.indexOf (":"))
                    {
                        property = property || nit.pascalCase (name.split (":").pop ());

                        return nit.dpv (function () { return nit.lookupComponent.apply (nit, [name].concat (args)); }, "name", property);
                    }
                }
                ,
                function lookupClass (property, name)
                {
                    if (name.match (nit.CLASS_NAME_PATTERN))
                    {
                        property = property || name.split (".").pop ();

                        return nit.dpv (function () { return nit.lookupClass (name); }, "name", property);
                    }
                }
            ];
        })
        .staticMethod ("getProperties", function (obj, type)
        {
            var self = this;

            type = type || self.PRIMARY_PROPERTY_TYPE;

            var typeCls = nit.lookupClass (type);

            if (!typeCls)
            {
                self.throw ("error.invalid_property_type", { type: type });
            }

            return nit.each (nit.propertyDescriptors (obj || self.prototype, true), function (p)
            {
                p = p.get && p.get[nit.Object.kProperty];

                return p instanceof typeCls ? p : nit.each.SKIP;

            }, true);
        })
        .staticMethod ("createTypeCheckedMethod", function (name, builder)
        {
            var cls = this;
            var Method = cls.defineSubclass (cls.name + "$$" + nit.pascalCase (name), true)
                .k ("invoke")
                .staticMethod ("invoke", function (invoke)
                {
                    Method.staticMethod (Method.kInvoke, invoke);
                })
            ;

            builder.call (cls, Method);

            var onInvoke = Method[Method.kInvoke];

            if (!nit.is.func (onInvoke))
            {
                cls.throw ("error.invoke_method_not_defined");
            }

            var props = Method.properties;
            var pargs = props
                .filter (function (p) { return p.positional; })
                .map (function (p) { return p.name; });

            var ctx =
            {
                invoke: function (obj, args)
                {
                    var method = nit.new (Method, args);

                    args = pargs.map (function (n) { return method[n]; });
                    args.push (nit.assign ({}, method));

                    return onInvoke.apply (obj, args);
                }
            };

            return nit.createFunction (name, "return invoke (this, arguments);", pargs, ctx);
        })
        .staticMethod ("staticTypeCheckedMethod", function (name, builder)
        {
            var cls = this;
            var method = cls.createTypeCheckedMethod (name, builder);

            return cls.staticMethod (name, method);

        })
        .staticMethod ("typeCheckedMethod", function (name, builder)
        {
            var cls = this;
            var method = cls.createTypeCheckedMethod (name, builder);

            return cls.method (name, method);
        })
        .staticMethod ("assign", function (obj, values, type)
        {
            var cls = this;

            if (nit.is.obj (values) && !nit.is.empty (values))
            {
                cls.getProperties (obj, type).forEach (function (p)
                {
                    var n = p.name;

                    if (n in values)
                    {
                        obj[n] = values[n];
                    }
                });
            }

            return cls;
        })
        .staticMethod ("defaults", function (k, v) // or (vals)
        {
            var cls = this;

            if (arguments.length)
            {
                var vals = nit.is.obj (k) ? k : nit.arrayCombine ([k], [v]);

                nit.assign (cls[cls.kDefvals], vals);

                return cls;
            }
            else
            {
                return cls[cls.kDefvals];
            }
        })
        .staticMethod ("serialize", function (v, indent)
        {
            return v === undefined ? "<undefined>" : nit.serialize (v, indent);
        })
        .staticLifecycleMethod ("preBuildConstructorParams", function (obj, params, args)
        {
            var cls = this;

            return cls.invokeClassChainMethod ([obj, cls.kPreBuildConstructorParams], [params, args]);
        })
        .staticLifecycleMethod ("preConstruct", function (obj, args)
        {
            var cls = this;

            return cls.invokeClassChainMethod ([obj, cls.kPreConstruct], args);
        })
        .staticLifecycleMethod ("construct", function (obj, args)
        {
            var cls = this;

            return cls.invokeClassChainMethod ([obj, cls.kConstruct], args, true);
        })
        .staticLifecycleMethod ("postConstruct", function (obj, args)
        {
            var cls = this;

            return cls.invokeClassChainMethod ([obj, cls.kPostConstruct], args);
        })
        .staticLifecycleMethod ("defineSubclass", function (name, construct, local, pargs) // eslint-disable-line no-unused-vars
        {
            var cfg = nit.typedArgsToObj (arguments,
            {
                name: "string",
                construct: ["string", "function"],
                local: "boolean",
                pargs: "array"
            });

            construct = cfg.construct;

            var cls = this;
            var isConstructString = nit.is.str (construct);
            var isConstructFunc = nit.is.func (construct);
            var cn = nit.trim (cfg.name || isConstructFunc && construct.name);

            if (!cn)
            {
                cls.throw ("error.class_name_required");
            }

            if (nit.is.empty (cfg.pargs) && isConstructFunc)
            {
                cfg.pargs = nit.funcArgNames (construct);
            }

            var subclass = nit.extend (nit.createFunction (cn, isConstructString ? construct : true, cfg.pargs), cls);

            if (!cfg.local && nit.CLASSES[cls.name])
            {
                nit.ns (cn, subclass);
                nit.registerClass (subclass);
            }

            if (isConstructFunc)
            {
                subclass.onConstruct (construct);
            }

            return cls.invokeClassChainMethod (cls.kDefineSubclass, [subclass], true, subclass);
        })
        .staticMethod ("buildParam", function (obj, prop, params)
        {
            var cls = this;
            var n = prop.name;
            var configKey = obj.constructor.name;
            var defvals = cls[cls.kDefvals];

            if (params[n] === undefined)
            {
                var defval = n in defvals ? defvals[n] : prop.defval;

                defval = nit.get (nit.CONFIG, configKey + "." + n, defval);
                defval = nit.Object.Property.defval (prop, obj, defval);
                params[n] = defval;
            }

            var v = params[n];
            var expand;

            if (nit.is.pojo (v) && nit.is.pojo (expand = v[""]))
            {
                for (var exp in expand)
                {
                    params[n] = nit.expandArg (exp, expand[exp], nit.CONFIG);
                    break;
                }
            }

            function resolve ()
            {
                var v = params[n];

                if (v instanceof Promise)
                {
                    return v.then (function (result)
                    {
                        params[n] = result;

                        return resolve ();
                    });
                }
                else
                {
                    obj[n] = v;
                    v = obj[n];
                    params[n] = v;

                    if (v instanceof Promise)
                    {
                        return resolve ();
                    }
                }

                return v;
            }

            return resolve ();
        })
        .staticMethod ("buildConstructorParams", function (obj, args) // could return a promise
        {
            var cls = this;
            var pargNames = cls.pargNames;
            var validProps = cls.propertyMap;
            var pargProps = cls.pargs.slice ();
            var arrayParg = cls.pargs.find (function (p) { return p.array; });
            var params = nit.argsToObj (nit.array (args).filter (nit.is.not.undef), pargNames);
            var positionals = nit.each (params, function (p, n)
            {
                return nit.is.int (n) ? p : nit.each.STOP;
            });

            while (pargProps.length && positionals.length)
            {
                var p = pargProps.shift ();
                var v = positionals.shift ();

                if (p.array)
                {
                    params[p.name] = [v];

                    var np = pargProps[0];

                    if (np && np.type != p.type)
                    {
                        while (positionals.length && nit.is[p.type] (positionals[0]))
                        {
                            params[p.name].push (positionals.shift ());
                            delete params[np.name];
                        }
                    }
                    break;
                }
                else
                {
                    params[p.name] = v;
                }
            }

            while (pargProps.length && positionals.length)
            {
                var pp = pargProps.pop ();

                params[pp.name] = positionals.pop ();
            }

            if (arrayParg && positionals.length)
            {
                params[arrayParg.name] = params[arrayParg.name].concat (positionals);
            }

            var match;

            for (var k in params)
            {
                if ((match = k.match (nit.EXPANDABLE_ARG_PATTERN)))
                {
                    var exp = {};

                    exp[match[1]] = params[k];
                    params[k.slice (0, match.index)] = { "": exp };
                    delete params[k];
                }
            }

            nit.argsToObj.cleanup (params);

            var queue = nit.Queue ();

            // use a queue to build params so async objects will be resolved sequentially
            nit.each.obj (validProps, function (p)
            {
                queue.push (function ()
                {
                    return cls.buildParam (obj, p, params);
                });
            });

            return queue.run (function () { return params; });
        })
        .staticMethod ("constructorParamsToArgs", function (params)
        {
            var cls = this;
            var args = [];

            cls.pargs.forEach (function (p)
            {
                args.push.apply (args, nit.array (params[p.name]));
            });

            args.push (params);

            return args;
        })
        .staticMethod ("createConstructionQueue", function (obj, args)
        {
            var cls = this;
            var params = {};

            return nit.Queue ()
                .push (function ()
                {
                    return cls.preBuildConstructorParams (obj, params, args);
                })
                .push (function ()
                {
                    return cls.buildConstructorParams (obj, args.concat (params));
                })
                .push (function (ctx)
                {
                    params = ctx.result;
                    args = cls.constructorParamsToArgs (params);
                })
                .push (function ()
                {
                    return cls.preConstruct (obj, args);
                })
                .push (function ()
                {
                    return cls.construct (obj, args);
                })
                .push (function ()
                {
                    return cls.postConstruct (obj, args);
                })
                .push (function ()
                {
                    return obj;
                })
            ;
        })
        .staticMethod ("constructObject", function (obj, args)
        {
            return this.createConstructionQueue (obj, args).run ();
        })
        .staticMethod ("mixin", function (mixin, exclusions)
        {
            mixin = nit.is.func (mixin) ? mixin : nit.lookupComponent (mixin, "mixins");

            return nit.mix (this, mixin, exclusions);
        })
        .staticMethod ("toPojoFilter", nit.dpvs (function (o, k, n)
        {
            var ancestor = n.ancestors.slice (-1)[0];

            return !ancestor || n.array || (nit.is.obj (ancestor) && k in (ancestor instanceof nit.Object ? ancestor.constructor.propertyMap : ancestor));
        }
        ,
        {
            circular: function ()
            {
                return null;
            }
            ,
            keys: function (obj, all)
            {
                if (obj instanceof nit.Object)
                {
                    return obj.constructor.propertyNames;
                }
                else
                {
                    return nit.keys (obj, all);
                }
            }

        }), true, false)
        .staticMethod ("toPojo", function (obj, shallow)
        {
            if (!(obj instanceof nit.Object))
            {
                return;
            }

            var pojo = {};
            var cls = obj.constructor;

            if (shallow)
            {
                cls.properties
                    .forEach (function (p)
                    {
                        var name = p.name;
                        var v = obj[name];

                        pojo[name] = p.array ? v.slice () : v;
                    })
                ;
            }
            else
            {
                pojo = nit.clone (obj, cls.toPojoFilter);
            }

            return pojo;
        })
        .method ("t", function ()
        {
            return nit.t.apply (nit, [this].concat (ARRAY (arguments), this));
        })
        .method ("throw", function (code) // eslint-disable-line no-unused-vars
        {
            nit.throw.apply (this, arguments);
        })
        .method ("toPojo", function (shallow)
        {
            return this.constructor.toPojo (this, shallow);
        })
    ;


    // https://stackoverflow.com/questions/27194359/javascript-pluralize-a-string
    nit.pluralize = nit.do (function pluralize (str, count)
    {
        str += "";

        var singular = count == 1;

        return (~pluralize.UNCOUNTABLES.indexOf (str.toLowerCase ()) && str)
            || pluralize.replace (str, singular ? pluralize.IRREGULAR_SINGULAR_PATTERNS : pluralize.IRREGULAR_PLURAL_PATTERNS)
            || pluralize.replace (str, singular ? pluralize.SINGULAR_PATTERNS : pluralize.PLURAL_PATTERNS)
            || str
        ;
    },
    function (pluralize)
    {
        nit.extend (pluralize, nit.Object)
            .constant ("PLURALS",
            [
                ["(quiz)$", "$1zes"],
                ["^(ox)$", "$1en"],
                ["([m|l])ouse$", "$1ice"],
                ["(matr|vert|ind)ix|ex$", "$1ices"],
                ["(x|ch|ss|sh)$", "$1es"],
                ["([^aeiouy]|qu)y$", "$1ies"],
                ["(hive)$", "$1s"],
                ["(?:([^f])fe|([lr])f)$", "$1$2ves"],
                ["(shea|lea|loa|thie)f$", "$1ves"],
                ["sis$", "ses"],
                ["([ti])um$", "$1a"],
                ["(tomat|potat|ech|her|vet)o$", "$1oes"],
                ["(bu)s$", "$1ses"],
                ["(alias)$", "$1es"],
                ["(octop)us$", "$1i"],
                ["(ax|test)is$", "$1es"],
                ["(us)$", "$1es"],
                ["([^s]+)$", "$1s"]
            ])
            .constant ("SINGULARS",
            [
                ["(quiz)zes$", "$1"],
                ["(matr)ices$", "$1ix"],
                ["(vert|ind)ices$", "$1ex"],
                ["^(ox)en$", "$1"],
                ["(alias)es$", "$1"],
                ["(octop|vir)i$", "$1us"],
                ["(cris|ax|test)es$", "$1is"],
                ["(shoe)s$", "$1"],
                ["(o)es$", "$1"],
                ["(bus)es$", "$1"],
                ["([m|l])ice$", "$1ouse"],
                ["(x|ch|ss|sh)es$", "$1"],
                ["(m)ovies$", "$1ovie"],
                ["(s)eries$", "$1eries"],
                ["([^aeiouy]|qu)ies$", "$1y"],
                ["([lr])ves$", "$1f"],
                ["(tive)s$", "$1"],
                ["(hive)s$", "$1"],
                ["(li|wi|kni)ves$", "$1fe"],
                ["(shea|loa|lea|thie)ves$", "$1f"],
                ["(^analy)ses$", "$1sis"],
                ["((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$", "$1$2sis"],
                ["([ti])a$", "$1um"],
                ["(n)ews$", "$1ews"],
                ["(h|bl)ouses$", "$1ouse"],
                ["(corpse)s$", "$1"],
                ["(us)es$", "$1"],
                ["s$", ""]
            ])
            .constant ("IRREGULARS",
            [
                ["move", "moves"],
                ["foot", "feet"],
                ["goose", "geese"],
                ["sex", "sexes"],
                ["child", "children"],
                ["man", "men"],
                ["tooth", "teeth"],
                ["person", "people"]
            ])
            .constant ("UNCOUNTABLES",
            [
                "sheep",
                "fish",
                "deer",
                "moose",
                "series",
                "species",
                "money",
                "rice",
                "information",
                "equipment"
            ])
            .staticMemo ("PLURAL_PATTERNS", function ()
            {
                return this.PLURALS
                    .map (function (entry)
                    {
                        return [new RegExp (entry[0], "i"), entry[1]];
                    })
                ;
            })
            .staticMemo ("SINGULAR_PATTERNS", function ()
            {
                return this.SINGULARS
                    .map (function (entry)
                    {
                        return [new RegExp (entry[0], "i"), entry[1]];
                    })
                ;
            })
            .staticMemo ("IRREGULAR_PLURAL_PATTERNS", function ()
            {
                return this.IRREGULARS
                    .map (function (entry)
                    {
                        return [new RegExp (entry[0] + "$", "i"), entry[1]];
                    })
                ;
            })
            .staticMemo ("IRREGULAR_SINGULAR_PATTERNS", function ()
            {
                return this.IRREGULARS
                    .map (function (entry)
                    {
                        return [new RegExp (entry[1] + "$", "i"), entry[0]];
                    })
                ;
            })
            .staticMethod ("replace", function (str, mappings)
            {
                for (var i = 0; i < mappings.length; ++i)
                {
                    var pat = mappings[i][0];
                    var repl = mappings[i][1];
                    var match = str.match (pat);

                    if (match)
                    {
                        var lastChar = match[0].slice (-1);

                        repl = lastChar == lastChar.toUpperCase () ? repl.toUpperCase () : repl;

                        return str.replace (pat, repl);
                    }
                }
            })
        ;
    });


    nit.singularize = function (str)
    {
        return nit.pluralize (str, 1);
    };


    nit.Object.defineSubclass ("nit.Constraint")
        .m ("error.validation_failed", "The value '%{value}' is invalid.")
        .m ("error.invalid_target_value_type", "The constraint value type '%{type} is invalid.")
        .m ("error.invalid_target_value", "The constraint cannot be applied to '%{value|nit.Object.serialize}'.")
        .m ("error.constraint_not_defined", "The constraint '%{name}' was not defined.")
        .categorize ("constraints")

        .defineMeta ("code", "string", "error.validation_failed")
        .defineMeta ("message", "string")
        .defineMeta ("applicableTypes...")
        .staticMemo ("componentName", function ()
        {
            return nit.ComponentDescriptor
                .normalizeName (this.name)
                .replace ("constraints:", "")
            ;
        })
        .defineInnerClass ("ValidationContext", function (ValidationContext)
        {
            ValidationContext
                .property ("value", "any")
                .property ("owner", "any") // the owner object of the property
                .property ("property", "any") // the property
                .property ("constraint", "nit.Constraint")
            ;
        })
        .staticMethod ("lookup", function (name)
        {
            try
            {
                return nit.lookupComponent (name, "constraints", this);
            }
            catch (e)
            {
                if (e.code != "error.component_not_found")
                {
                    throw e;
                }
                else
                {
                    this.throw ("error.constraint_not_defined", { name: name });
                }
            }
        })
        .staticMethod ("throws", function (code, message)
        {
            return this.meta ({ code: code, message: message }).m (code, message);
        })
        .property ("name")
        .property ("code")
        .property ("message")
        .property ("condition")
        .memo ("conditionFn", function ()
        {
            if (this.condition)
            {
                return nit.expr (this.condition);
            }
        })
        .onConstruct (function ()
        {
            var self = this;
            var cls = self.constructor;

            self.name = self.name || cls.componentName;
            self.code = self.code || cls.code;
            self.message = self.message || cls.message;
        })
        .method ("nameMatches", function (name)
        {
            var self = this;
            var cls = self.constructor;

            return self.name == name
                || cls.name == name
                || cls.simpleName == name
                || cls.componentName == name
            ;
        })
        .method ("applicableTo", function (type)
        {
            var cls = this.constructor;
            var types = cls.applicableTypes;

            return !types.length || !!~types.indexOf (type);
        })
        .lifecycleMethod ("validate", function (ctx)
        {
            var constraint = this;
            var cls = constraint.constructor;
            var validate = cls[cls.kValidate];

            if (cls.applicableTypes.length && !cls.applicableTypes.some (function (type) { return nit.is[type] (ctx.value); }))
            {
                constraint.throw ("error.invalid_target_value", { value: ctx.value });
            }

            ctx.constraint = constraint;

            return nit.Queue ()
                .push (function ()
                {
                    return !constraint.conditionFn || constraint.conditionFn (nit.assign ({ nit: nit, this: ctx }, ctx.toPojo (true)));
                })
                .push (function (q)
                {
                    var skip = q.result === false;

                    delete q.result;

                    return skip ? new nit.Queue.Stop : validate.call (cls, ctx);
                })
                .push (function (q)
                {
                    if (!q.result)
                    {
                        constraint.throw ({ code: constraint.code, property: ctx.property, message: constraint.message, owner: ctx.owner }, ctx);
                    }
                })
                .failure (function (q)
                {
                    var e = q.error;

                    if (nit.get (e, "context.source") != constraint)
                    {
                        constraint.throw ({ code: e.code, cause: e, property: ctx.property, message: e.message, owner: ctx.owner }, ctx);
                    }
                    else
                    {
                        throw e;
                    }
                })
                .run ()
            ;
        }, true)
    ;


    nit.defineConstraint ("Custom")
        .property ("<validator>", "function")
        .onValidate (function (ctx)
        {
            return ctx.constraint.validator (ctx);
        })
    ;


    nit.defineConstraint ("Exclusive")
        .throws ("error.exclusive_fields_specified", "Exactly one of following fields must be specified: %{constraint.fields.join (', ')}. (%{specified} specified)")
        .property ("<fields...>")
        .property ("optional", "boolean")
        .onValidate (function (ctx)
        {
            var specified = nit.each (nit.keys (ctx.owner), function (name)
            {
                if (~ctx.constraint.fields.indexOf (name) && !nit.is.empty (ctx.owner[name]))
                {
                    return name;
                }

                return nit.each.SKIP;
            });

            ctx.specified = specified.length;

            return ctx.specified == 1 || (ctx.constraint.optional && ctx.specified === 0);
        });


    nit.defineConstraint ("Dependency")
        .throws ("error.value_required", "'%{constraint.depender}' is required.")
        .property ("<depender>", "string")
        .property ("<dependee>", "string")
        .onValidate (function (ctx)
        {
            return nit.is.empty (ctx.owner[ctx.constraint.dependee]) || !nit.is.empty (ctx.owner[ctx.constraint.depender]);
        })
    ;


    nit.defineConstraint ("Eval")
        .throws ("error.validation_failed", "The validation has failed.")
        .property ("<expr>", "string")
        .onValidate (function (ctx)
        {
            return nit.eval (ctx.constraint.expr, ctx);
        })
    ;


    nit.defineConstraint ("Choice")
        .throws ("error.invalid_choice", "The %{property.kind} '%{property.name}' is assigned to an invalid value '%{value}'. (Allowed: %{constraint.choiceValues.join (', ')})")
        .property ("[choices...]", "any") // A choice can either be a value or an object a 'value' field.
        .getter ("choiceValues", function ()
        {
            return this.choices.map (function (c)
            {
                return nit.is.obj (c) ? c.value : c;
            });
        })
        .memo ("choiceMap", function ()
        {
            return this.choiceValues.reduce (function (a, c) { return (a[c] = true) && a; }, {});
        })
        .onValidate (function (ctx)
        {
            return ctx.constraint.choiceMap[ctx.value];
        });


    nit.defineConstraint ("Min")
        .throws ("error.less_than_min", "The minimum value of '%{property.name}' is '%{constraint.min}'.")
        .property ("<min>", "integer")
        .onValidate (function (ctx)
        {
            return ctx.value * 1 >= ctx.constraint.min;
        });


    nit.defineConstraint ("Max")
        .throws ("error.greater_than_max", "The maximum value of '%{property.name}' is '%{constraint.max}'.")
        .property ("<max>", "integer")
        .onValidate (function (ctx)
        {
            return ctx.value * 1 <= ctx.constraint.max;
        });


    nit.defineConstraint ("Subclass")
        .throws ("error.not_a_subclass", "The value of '%{property.name}' (%{valueType}) is not a subclass of %{constraint.superclass}.")
        .m ("error.invalid_superclass", "The superclass '%{superclass}' is invalid.")
        .meta ("applicableTypes", ["string", "function", "any"]) // The condition should be set if the field type is any.
        .property ("<superclass>", "string")
        .property ("[inclusive]", "boolean") // including the superclass
        .onValidate (function (ctx)
        {
            var superclass = nit.lookupClass (ctx.constraint.superclass);

            if (!superclass)
            {
                this.throw ("error.invalid_superclass", ctx.constraint);
            }

            var value = ctx.value;
            var subclass = nit.is.str (value) ? nit.lookupClass (value) : value;

            ctx.valueType = nit.is.str (value) ? value : value.name;

            return nit.is.subclassOf (subclass, superclass, ctx.constraint.inclusive);
        });


    nit.Object
        .defineSubclass ("nit.Field", function (spec, type, description, defval) // eslint-disable-line no-unused-vars
        {
            var field = this;
            var cls = field.constructor;
            var prop = nit.Object.Property.new (cls, field.toPojo (true));

            prop.get.setDescriptor (field);
            nit.assign (field, prop);

            field.writer = undefined;

            delete field.createValidationContext;
            delete field.shouldValidate;
            delete field.validate;

            nit.dpv (field.get, nit.Object.kProperty, field);
            nit.dpv (field.set, nit.Object.kProperty, field);
        })
        .m ("error.inapplicable_constraint", "The constraint '%{constraint}' cannot be applied to the %{type} field '%{field}'.")
        .property ("<spec>")
        .property ("[type]", "string", "string")
        .property ("[description]")
        .property ("[defval]", "any")
        .property ("required", "boolean")
        .property ("name")
        .property ("positional", "boolean")
        .property ("array", "boolean")
        .property ("enumerable", "boolean", true)
        .property ("configurable", "boolean", true)
        .property ("nullable", "boolean")
        .property ("emptyAllowed", "boolean")
        .property ("kind", "string", "field")
        .property ("get", "function")
        .property ("set", "function")
        .property ("getter", "function")
        .property ("setter", "function")
        .property ("backref", "string")
        .property ("onLink", "function")
        .property ("onUnlink", "function")
        .property ("caster", "function")
        .property ("cast", "function")
        .property ("target", "any") // the prototype to which the field was bound
        .property ("primitive", "boolean") // should not be set manually
        .property ("mixedType", "boolean") // should not be set manually
        .property ("parser", "nit.Object.ITypeParser")
        .property ("writer", "nit.Object.Property.Writer")
        .property ("privProp", "string", "", true, false)
        .property ("constraints...", "nit.Constraint")

        .getter ("class", function ()
        {
            if (!this.primitive)
            {
                return this.parser.lookupClass (this.type);
            }
        })
        .method ("constraint", function (name)
        {
            var self = this;
            var cls = nit.Constraint.lookup (name);
            var cons = nit.new (cls, ARRAY (arguments).slice (1));

            if (!self.mixedType && !cons.applicableTo (self.type))
            {
                self.throw ("error.inapplicable_constraint", { constraint: name, field: self.name, type: self.type });
            }

            self.constraints.push (cons);

            return self;
        })
        .method ("getConstraint", function (name)
        {
            return nit.find (this.constraints, function (c) { return c.nameMatches (name); });
        })
        .method ("bind", function (target)
        {
            var field = this;

            nit.dp (field.target = target, field.name, field);

            return field;
        })
        .method ("shouldValidate", function (owner) // eslint-disable-line no-unused-vars
        {
            return true;
        })
        .method ("createValidationContext", function (owner, value)
        {
            return new nit.Constraint.ValidationContext ({ value: value, owner: owner, property: this });
        })
        .method ("validate", function (owner, value)
        {
            return nit.Object.Property.validate (this, owner, value);
        })
    ;


    nit.Object.defineSubclass ("nit.Class")
        .m ("error.no_field_defined", "No field was defined.")
        .categorize ()
        .constant ("PRIMARY_PROPERTY_TYPE", "nit.Field")
        .constant ("INNER_CLASS_TYPE", "nit.Class")

        .staticProperty ("checks...", "nit.Constraint", [], false, false) // instance constraints
        .staticGetter ("fields", "properties")
        .staticGetter ("fieldMap", "propertyMap")

        .staticMethod ("field", function (spec, type, description, defval) // eslint-disable-line no-unused-vars
        {
            var cls = this;

            nit.new (nit.Field, arguments).bind (cls.prototype);

            return cls.validatePropertyDeclarations ();
        })
        .staticMethod ("getField", function (name)
        {
            var self = this;

            return self.fieldMap[name];
        })
        .staticMethod ("getLastField", function ()
        {
            var self = this;
            var field = self.fields.slice (-1)[0];

            if (!field)
            {
                self.throw ("error.no_field_defined");
            }

            return field;
        })
        .staticMethod ("constraint", function (name) // eslint-disable-line no-unused-vars
        {
            var field = this.getLastField ();

            field.constraint.apply (field, arguments);

            return this;
        })
        .staticMethod ("check", function (name)
        {
            var cls = nit.Constraint.lookup (name);
            var cons = nit.new (cls, ARRAY (arguments).slice (1));
            var self = this;

            self.checks.push (cons);

            return self;
        })
        .staticMethod ("getChecks", function (name)
        {
            var cls = this;
            var chain = cls.classChain.slice ().reverse ();

            return nit.array (nit.each (chain, function (cls) { return cls.checks || []; }), true)
                .filter (function (c) { return !name || c.nameMatches (name); })
            ;
        })
        .staticMethod ("validateObject", function (obj, ctx)
        {
            var cls = this;
            var queue = nit.Queue ();

            ctx = ctx || new nit.Constraint.ValidationContext ({ owner: obj });

            nit.each (cls.getChecks (), function (check)
            {
                queue.push (function ()
                {
                    return check.validate (ctx);
                });
            });

            return queue.run ();
        })
        .staticMethod ("constructObject", function (obj, args)
        {
            var cls = this;

            return cls.createConstructionQueue (obj, args)
                .push (function (ctx) { return cls.validateObject (obj = ctx.result); })
                .push (function () { return obj; })
                .run ();
        })
        .staticMethod ("registerPlugin", function (pluginCls, category, method, unique) // eslint-disable-line no-unused-vars
        {
            var cls = this;
            var cfg = nit.typedArgsToObj (arguments,
            {
                pluginCls: ["string", "function"],
                category: "string",
                method: "string",
                unique: ["boolean", "function"]
            });

            pluginCls = nit.is.str (pluginCls) ? nit.lookupClass (pluginCls) : pluginCls;
            method = cfg.method || pluginCls.simpleName.toLowerCase ();
            category = cfg.category || nit.pluralize (method);

            var pn = pluginCls.name;
            var hash = cfg.unique === true ? function (p) { return p.constructor.name; } : cfg.unique;

            return cls
                .staticProperty (category + "...", pn, undefined, true, false)
                .staticMethod (method, function (pluginName)
                {
                    var self = this;
                    var plugin = pluginName;
                    var pluginCls;

                    if (nit.is.str (pluginName))
                    {
                        pluginCls = nit.lookupComponent (pluginName, category, pn);
                        plugin = nit.new (pluginCls, nit.array (arguments).slice (1));
                    }
                    else
                    {
                        pluginCls = plugin.constructor;
                    }

                    if (hash)
                    {
                        var key = hash (plugin);

                        nit.arrayRemove (self[category], function (p) { return hash (p) == key; });
                    }

                    self[category].push (plugin);

                    nit.invoke ([pluginCls, "onUsePlugin"], [self, plugin]);

                    return self;
                })
                .do (function ()
                {
                    nit.invoke ([pluginCls, "onRegisterPlugin"], [cls]);
                })
            ;
        })
        .staticMethod ("defineInnerPlugin", function (name, category, builder) // eslint-disable-line no-unused-vars
        {
            var cls = this;
            var cfg = nit.typedArgsToObj (arguments,
            {
                name: "string",
                category: "string",
                builder: "function"
            });

            return cls
                .defineInnerClass (cfg.name, cfg.builder)
                .registerPlugin (cls[cfg.name], cfg.category)
            ;
        })
        .staticMethod ("getPlugins", function (category, unique)
        {
            var plugins = this.getClassChainProperty (category, true);

            if (unique)
            {
                var hash = unique === true ? function (p) { return p.constructor.name; } : unique;
                var seen = {};

                plugins = plugins.filter (function (p)
                {
                    var key = hash (p);

                    return seen[key] ? false : (seen[key] = true);
                });
            }

            return plugins;
        })
        .staticMethod ("lookupPlugin", function (category, superclass)
        {
            if (arguments.length == 1)
            {
                superclass = category;
                category = undefined;
            }

            superclass = nit.lookupClass (superclass);
            category = category || superclass.name.split (".").slice (-2, -1)[0];

            return nit.find (this.getClassChainProperty (category, true), function (p)
            {
                return p instanceof superclass;
            });
        })
        .staticMethod ("applyPlugins", function (category, method)
        {
            var args = nit.array (arguments).slice (2);
            var plugins = this.getPlugins (category);

            return nit.Queue ()
                .push (nit.each (plugins, function (plugin)
                {
                    return function () { return plugin[method] && nit.invoke ([plugin, method], args); };
                }))
                .run ()
            ;
        })
    ;


    nit.ns.initializer = function (name)
    {
        return nit.lookupClass (name) || nit.defineClass (name);
    };


    nit.defineClass ("nit.Plugin")
        .categorize ("plugins")
        .do (function (cls) { nit.Class.registerPlugin (cls); })
    ;


    nit.defineConstraint ("Plugin")
        .throws ("error.plugin_not_found", "The object '%{property.name}' does not have a registered plugin of '%{constraint.type}'.")
        .property ("<type>", "string") // The plugin type
        .property ("[category]", "string") // The plugin category
        .onValidate (function (ctx)
        {
            var pluginCls = nit.lookupClass (ctx.constraint.type);
            var category = ctx.constraint.category || pluginCls.name.split (".").slice (-2, -1)[0];
            var cls = ctx.value instanceof nit.Class ? ctx.value.constructor : (nit.is.subclassOf (ctx.value, nit.Class, true) ? ctx.value : undefined);

            return cls && cls.lookupPlugin (category, pluginCls);
        })
    ;


    var Mixin = nit.defineClass ("nit.Mixin")
        .categorize ("mixins")
        .staticProperty ("excludedStaticProperties...", "string")
        .staticProperty ("excludedProperties...", "string")

        .staticMethod ("excludeStaticProperties", function ()
        {
            var cls = this;
            var ps = cls.excludedStaticProperties;

            ps.push.apply (ps, arguments);

            return cls;
        })
        .staticMethod ("excludeProperties", function ()
        {
            var cls = this;
            var ps = cls.excludedProperties;

            ps.push.apply (ps, arguments);

            return cls;
        })
        .staticLifecycleMethod ("mix", function (target, exclusions)
        {
            var cls = this;

            exclusions = nit.array (exclusions);

            nit.copyProperties (cls, target, exclusions.concat (cls.excludedStaticProperties).concat (nit.keys (nit.propertyDescriptors (Mixin, true))));
            nit.copyProperties (cls.prototype, target.prototype, exclusions.concat (cls.excludedProperties).concat (nit.keys (nit.propertyDescriptors (Mixin.prototype, true))));

            nit.invoke ([cls, Mixin.kMix], [target]);
        })
    ;


    nit.defineClass ("nit.Deferred")
        .m ("error.timeout", "The deferred object has timed out.")
        .field ("[timeout]", "integer", "The deferred timeout.")
        .property ("resolve", "function", { writer: PROPERTY_WRITER })
        .property ("reject", "function", { writer: PROPERTY_WRITER })
        .property ("promise", "Promise", { writer: PROPERTY_WRITER })
        .onConstruct (function (timeout)
        {
            var self = this;
            var res, rej;
            var promise = new Promise (function (resolve, reject)
            {
                res = resolve;
                rej = reject;
            });

            var timer = timeout && setTimeout (function ()
            {
                try
                {
                    self.throw ("error.timeout");
                }
                catch (e)
                {
                    self.reject (e);
                }
            }, timeout);

            self.resolve = PROPERTY_WRITER.value (function (result)
            {
                clearTimeout (timer);
                res (result);
            });

            self.reject = PROPERTY_WRITER.value (function (error)
            {
                clearTimeout (timer);
                rej (error);
            });

            self.promise = PROPERTY_WRITER.value (promise);
        })
        .method ("then", function (onResolve, onReject)
        {
            return this.promise.then (onResolve, onReject);
        })
    ;


    nit.defineClass ("nit.ComponentDescriptor")
        .m ("error.invalid_category", "The class '%{className}' does not belong to the category '%{category}'.")
        .field ("<className>", "string", "The component's class name.")
        .field ("<category>", "string", "The component's category.")
        .field ("name", "string", "The component name.", { writer: PROPERTY_WRITER })
        .field ("namespace", "string", "The component's namespace.", { writer: PROPERTY_WRITER })

        .staticMethod ("normalizeName", function (name)
        {
            return name.split (/[.:/]/)
                .map (nit.kababCase)
                .join (":")
            ;
        })
        .staticMethod ("toClassName", function (name, category)
        {
            if (name.match (nit.CLASS_NAME_PATTERN))
            {
                return name;
            }

            var ns = [];

            if (~name.indexOf (":"))
            {
                ns = name.split (":");
                name = ns.pop ();
            }

            if (category)
            {
                ns.push (category);
            }

            return ns.map (nit.camelCase).concat (nit.pascalCase (name)).join (".");
        })
        .onConstruct (function (className, category)
        {
            var self = this;
            var cats = nit.trim (category).split (".");
            var ns = className.split (".");
            var cn = ns.pop ();

            if (!nit.is.equal (ns.slice (-cats.length), cats))
            {
                self.throw ("error.invalid_category", { className: className, category: category });
            }

            ns = ns.slice (0, -cats.length);
            ns = ns.concat (cn).map (nit.kababCase);

            self.name = PROPERTY_WRITER.value (ns.join (":"));
            self.namespace = PROPERTY_WRITER.value (ns.slice (0, -1).join (":"));

            nit.COMPONENT_DESCRIPTORS[className] = self;
        })
        .memo ("class", function ()
        {
            return nit.lookupClass (this.className);
        })
        .method ("compareTo", function (that)
        {
            var na = this.name.split (":");
            var nb = that.name.split (":");

            if (na.length == nb.length)
            {
                for (var i = 0; i < na.length; ++i)
                {
                    var va = na[i];
                    var vb = nb[i];
                    var res = va > vb ? 1 : (va < vb ? -1 : 0);

                    if (res != 0)
                    {
                        return res;
                    }
                }
            }

            return na.length - nb.length;
        })
    ;


    nit.getComponentDescriptor = function (className)
    {
        return nit.COMPONENT_DESCRIPTORS[nit.is.func (className) ? className.name : className];
    };


    nit.listComponents = function (category, returnNames)
    {
        var components = nit.each (OBJECT.keys (nit.CLASSES), function (className)
        {
            var cd = nit.getComponentDescriptor (className);

            if (cd && cd.category == category)
            {
                return cd;
            }

            var ns = nit.ComponentDescriptor.normalizeName (className).split (":").slice (0, -1);
            var cats = nit.ComponentDescriptor.normalizeName (category).split (":");

            if (nit.is.equal (ns.slice (-cats.length), cats))
            {
                return new nit.ComponentDescriptor (className, category);
            }

            return nit.each.SKIP;
        });

        return returnNames ? components.map (function (c) { return c.name; }) : components;
    };


    nit.lookupComponents = function (category, superclass)
    {
        superclass = nit.lookupClass (superclass);

        return nit
            .listComponents (category)
            .map (function (c) { return nit.lookupClass (c.className); })
            .filter (function (cls) { return nit.is.subclassOf (cls, superclass); })
        ;
    };


    nit.lookupComponent = function (name, category, superclass)
    {
        name = nit.is.func (name) ? name.name : name;
        superclass = nit.lookupClass (superclass);
        category = nit.trim (category);

        var nn = nit.ComponentDescriptor.normalizeName (name);

        var component = nit.find (nit.listComponents (category), function (c)
        {
            return c.name == nn || c.className == name;
        });

        var cls = nit.lookupClass (component ? component.className : name);

        if (!cls)
        {
            nit.throw ("error.component_not_found", { component: name, category: category });
        }

        if (superclass && !nit.is.subclassOf (cls, superclass))
        {
            nit.throw ("error.invalid_component", { component: name, superclass: superclass.name, category: category });
        }

        return cls;
    };


    nit.dpvs (nit,
    {
        ready: (function ()
        {
            var readyQueue = nit.Queue ();
            var document = global.document;

            if (document)
            {
                document.addEventListener ("DOMContentLoaded", function ()
                {
                    READY = true;

                    nit.ready ();
                });
            }

            return function ()
            {
                nit.array (arguments)
                    .forEach (function (task)
                    {
                        readyQueue.push (function () { return nit.ns.invoke (task); });
                    })
                ;

                return READY ? readyQueue.run (function () { return nit; }) : nit;
            };
        }) ()

    }, true);



    nit.defineClass ("nit.Model")
        .k ("unlocked", "noValidation")
        .constant ("PROPERTY_TYPE", "nit.Model.Field")
        .m ("error.model_validation_failed", "The model validation failed for %{class}:%{#validationContext.violations}\n    - %{field \\|\\| constraint}: %{message}%{/}")
        .m ("error.value_required", "The %{property.kind} '%{property.name}' is required.")
        .categorize ()

        .defineInnerClass ("Field", "nit.Field", function (Field)
        {
            Field
                .onPostConstruct (function ()
                {
                    var field = this;
                    var __set = field.set;
                    var privProp = field.privProp;

                    field.set = function (v)
                    {
                        var owner = this;

                        if (owner[nit.Model.kUnlocked])
                        {
                            return __set.call (owner, v);
                        }
                        else
                        {
                            if (!owner.hasOwnProperty (privProp))
                            {
                                nit.dpv (owner, privProp, v, true, false);
                            }
                            else
                            {
                                owner[privProp] = v;
                            }
                        }
                    };

                    nit.dpv (field.set, "__set", __set, true, false);
                })
                .getter ("typeIsModel", function ()
                {
                    var field = this;
                    var fc = field.class;

                    return !!(fc && nit.is.subclassOf (fc, nit.Model));
                })
                .method ("shouldValidate", function (owner)
                {
                    return owner[nit.Model.kUnlocked] && !owner[nit.Model.kNoValidation];
                })
                .method ("createValidationContext", function (owner, value)
                {
                    return new owner.constructor.ValidationContext ({ value: value, entity: owner, field: this });
                })
            ;
        })
        .defineInnerClass ("Violation", function (Violation)
        {
            Violation
                .field ("field", "string", "The field that failed the validation.")
                .field ("constraint", "string", "The constraint that caused error.")
                .field ("code", "string", "The error code.")
                .field ("message", "string", "The error message.")
            ;
        })
        .defineInnerPlugin ("Transform", function (Transform)
        {
            Transform
                .method ("preValidate", /* istanbul ignore next */ function (ctx) {}) // eslint-disable-line no-unused-vars
                .method ("postValidate", /* istanbul ignore next */ function (ctx) {}) // eslint-disable-line no-unused-vars
            ;
        })
        .defineInnerClass ("ValidationContext", function (ValidationContext)
        {
            ValidationContext
                .field ("value", "any")
                .field ("entity", "nit.Model")
                .field ("field", "nit.Model.Field")
                .field ("constraint", "nit.Constraint")
                .field ("violations...", "nit.Model.Violation", "The validation violations.")

                .property ("entities...", "nit.Model") // validated entities
                .property ("keyPath...", "string") // the key path to the property

                .getter ("property", function () { return this.field; })
                .getter ("owner", function () { return this.entity; })

                .method ("shouldValidate", function (entity)
                {
                    return !~this.entities.indexOf (entity) && !!this.entities.push (entity);
                })
                .method ("addViolation", function (error, field)
                {
                    var source = nit.get (error, "context.source");
                    var violation = new nit.Model.Violation (
                    {
                        field: field && this.keyPath.concat (field.name).join ("."),
                        constraint: source instanceof nit.Constraint ? source.constructor.componentName : "",
                        code: error.code,
                        message: error.message
                    });

                    return this.violations.push (violation) && violation;
                })
            ;
        })
        .staticMethod ("defineValidationContext", function (builder)
        {
            return this.defineInnerClass ("ValidationContext", this.superclass.ValidationContext.name, builder);
        })
        .staticMethod ("field", function (spec, type, description, defval) // eslint-disable-line no-unused-vars
        {
            var cls = this;

            nit.new (cls.Field, arguments).bind (cls.prototype);

            return cls.validatePropertyDeclarations ();
        })
        .staticMethod ("new", function (data) // eslint-disable-line no-unused-vars
        {
            var cls = this;
            var entity = nit.new (cls, arguments);

            cls.assign (entity, entity.toPojo ());

            return entity;
        })
        .staticMethod ("assign", function (entity, data, validate) // or (entity, updater)
        {
            var cls = this;
            var updater = nit.is.func (data) ? data : function (e) { nit.Class.assign (e, data); };

            return nit.Queue ()
                .push (function ()
                {
                    if (!validate)
                    {
                        nit.dpv (entity, cls.kNoValidation, true, true, false);
                    }

                    cls.unlock (entity);
                })
                .push (function ()
                {
                    return updater (entity);
                })
                .complete (function ()
                {
                    delete entity[cls.kNoValidation];

                    cls.lock (entity);

                    return entity;
                })
                .run ()
            ;
        })
        .staticMethod ("lock", function (entity)
        {
            delete entity[this.kUnlocked];
        })
        .staticMethod ("unlock", function (entity)
        {
            nit.dpv (entity, this.kUnlocked, true, true, false);
        })
        .staticMethod ("constructObject", function (obj, args)
        {
            return this.createConstructionQueue (obj, args).run ();
        })
        .staticMethod ("validate", function (entity, ctx)
        {
            var cls = this;

            if (!(entity instanceof cls))
            {
                entity = new cls (entity);
            }

            var ValidationContext = cls.ValidationContext;
            var fields = cls.fields;

            ctx = ctx instanceof ValidationContext ? ctx : new ValidationContext (ctx);

            if (!ctx.shouldValidate (entity))
            {
                return entity;
            }

            ctx.entity = entity;

            return nit.Queue ()
                .push (function ()
                {
                    cls.unlock (entity);

                    return cls.applyPlugins ("transforms", "preValidate", ctx);
                })
                .push (nit.each (fields, function (field)
                {
                    return function ()
                    {
                        ctx.value = entity[field.name];
                        ctx.field = field;

                        return nit.Queue ()
                            .push (function ()
                            {
                                return field.set.call (entity, ctx.value);
                            })
                            .failure (function (qc)
                            {
                                ctx.addViolation (qc.error, field);
                            })
                        ;
                    };
                }))
                .push (function ()
                {
                    if (ctx.violations.length)
                    {
                        return new nit.Queue.Stop;
                    }
                })
                .push (function ()
                {
                    return nit.Queue ()
                        .push (function ()
                        {
                            return nit.Class.validateObject.call (cls, entity, ctx);
                        })
                        .failure (function (qc)
                        {
                            ctx.addViolation (qc.error);
                        })
                        .run ()
                    ;
                })
                .push (nit.each (fields, function (field)
                {
                    var v;

                    if (field.typeIsModel && (v = entity[field.name]))
                    {
                        var validations = nit.each (nit.array (v), function (vv, k)
                        {
                            return function ()
                            {
                                if (field.array)
                                {
                                    return nit.Queue ()
                                        .push (function ()
                                        {
                                            ctx.keyPath.push (k);

                                            return field.class.validate (vv, ctx);
                                        })
                                        .complete (function ()
                                        {
                                            ctx.keyPath.pop ();
                                        })
                                    ;
                                }
                                else
                                {
                                    return field.class.validate (vv, ctx);
                                }
                            };
                        });

                        return !validations.length ? undefined : nit.Queue ()
                            .push (function ()
                            {
                                ctx.keyPath.push (field.name);
                            })
                            .push (validations)
                            .complete (function ()
                            {
                                ctx.keyPath.pop ();
                            })
                        ;
                    }
                }))
                .push (function ()
                {
                    return cls.applyPlugins ("transforms", "postValidate", ctx);
                })
                .complete (function ()
                {
                    cls.lock (entity);

                    if (ctx.violations.length)
                    {
                        entity.throw ({ code: "error.model_validation_failed", class: entity.constructor.name, validationContext: ctx });
                    }

                    return entity;
                })
                .run ()
            ;
        })
    ;
}
,
/* eslint-disable */
/* istanbul ignore next */
function getGlobal ()
{
    // https://mathiasbynens.be/notes/globalthis#robust-polyfill
    if (typeof globalThis === 'object')
    {
        return globalThis;
    }
    else
    {
        Object.defineProperty (Object.prototype, "__globalThis__",
        {
            configurable: true,
            get: function () { return this; }
        });

        var g = __globalThis__.globalThis = __globalThis__;

        delete Object.prototype.__globalThis__;

        return g;
    }
}
,
/* babel
 *    settings: line wrap
 *    env preset:
 *        core-js 3: entry
 *        loose
 *        bug fixes
 */
/* istanbul ignore next */
function getPromise ()
{
    if (typeof Promise != "undefined")
    {
        return Promise;
    }

    // zousan - A Lightning Fast, Yet Very Small Promise A+ Compliant Implementation
    // https://github.com/bluejava/zousan
    // Author: Glenn Crownover <glenn@bluejava.com> (http://www.bluejava.com)
    // License: MIT
    var _undefined = undefined,
      // let the obfiscator compress these down
      STATE_PENDING = _undefined,
      // These are the three possible states (PENDING remains undefined - as intended)
      STATE_FULFILLED = "fulfilled",
      // a promise can be in.  The state is stored
      STATE_REJECTED = "rejected",
      // in this.state as read-only
      _undefinedString = "undefined"; // by assigning them to variables (debatable "optimization")
    // See http://www.bluejava.com/4NS/Speed-up-your-Websites-with-a-Faster-setTimeout-using-soon
    // This is a very fast "asynchronous" flow control - i.e. it yields the thread and executes later,
    // but not much later. It is far faster and lighter than using setTimeout(fn,0) for yielding threads.
    // Its also faster than other setImmediate shims, as it uses Mutation Observer and "mainlines" successive
    // calls internally.
    // WARNING: This does not yield to the browser UI loop, so by using this repeatedly
    //         you can starve the UI and be unresponsive to the user.
    // This is an even FASTER version of https://gist.github.com/bluejava/9b9542d1da2a164d0456 that gives up
    // passing context and arguments, in exchange for a 25x speed increase. (Use anon function to pass context/args)

    var soon = (function () {
      var fq = [],
        // function queue
        bufferSize = 1024;
      var fqStart = 0; // avoid using shift() by maintaining a start pointer - and remove items in chunks of 1024 (bufferSize)

      function callQueue() {
        while (fq.length - fqStart) {
          // this approach allows new yields to pile on during the execution of these
          try {
            fq[fqStart]();
          } catch (err) {
            // no context or args..
            Zousan.error(err);
          }

          fq[fqStart++] = _undefined; // increase start pointer and dereference function just called

          if (fqStart == bufferSize) {
            fq.splice(0, bufferSize);
            fqStart = 0;
          }
        }
      } // run the callQueue function asyncrhonously, as fast as possible

      var cqYield = (function () {
        // This is the fastest way browsers have to yield processing
        if (typeof MutationObserver !== _undefinedString) {
          // first, create a div not attached to DOM to "observe"
          var dd = document.createElement("div");
          var mo = new MutationObserver(callQueue);
          mo.observe(dd, {
            attributes: true
          });
          return function () {
            dd.setAttribute("a", 0);
          }; // trigger callback to
        } // if No MutationObserver - this is the next best thing for Node

        if (
          typeof process !== _undefinedString &&
          typeof process.nextTick === "function"
        )
          return function () {
            process.nextTick(callQueue);
          }; // if No MutationObserver - this is the next best thing for MSIE

        if (typeof setImmediate !== _undefinedString)
          return function () {
            setImmediate(callQueue);
          }; // final fallback - shouldn't be used for much except very old browsers

        return function () {
          setTimeout(callQueue, 0);
        };
      })(); // this is the function that will be assigned to soon
      // it takes the function to call and examines all arguments

      return function (fn) {
        // push the function and any remaining arguments along with context
        fq.push(fn);
        if (fq.length - fqStart == 1)
          // upon adding our first entry, kick off the callback
          cqYield();
      };
    })(); // -------- BEGIN our main "class" definition here -------------

    function Zousan(func) {
      //  this.state = STATE_PENDING;    // Inital state (PENDING is undefined, so no need to actually have this assignment)
      //this.c = []            // clients added while pending.   <Since 1.0.2 this is lazy instantiation>
      // If Zousan is called without "new", throw an error
      if (!(this instanceof Zousan))
        throw new TypeError("Zousan must be created with the new keyword"); // If a function was specified, call it back with the resolve/reject functions bound to this context

      if (typeof func === "function") {
        var me = this;

        try {
          func(
            function (arg) {
              return me.resolve(arg);
            }, // the resolve function bound to this context. (actually using bind() is slower)
            function (arg) {
              return me.reject(arg);
            }
          ); // the reject function bound to this context
        } catch (e) {
          me.reject(e);
        }
      } else if (arguments.length > 0) {
        // If an argument was specified and it is NOT a function, throw an error
        throw new TypeError("Zousan resolver " + func + " is not a function");
      }
    }

    Zousan.prototype = {
      // Add 6 functions to our prototype: "resolve", "reject", "then", "catch", "finally" and "timeout"
      resolve: function resolve(value) {
        if (this.state !== STATE_PENDING) return;
        if (value === this)
          return this.reject(new TypeError("Attempt to resolve promise with self"));
        var me = this; // preserve this

        if (value && (typeof value === "function" || typeof value === "object")) {
          var first = true; // first time through?

          try {
            var then = value.then;

            if (typeof then === "function") {
              // and call the value.then (which is now in "then") with value as the context and the resolve/reject functions per thenable spec
              then.call(
                value,
                function (ra) {
                  if (first) {
                    first = false;
                    me.resolve(ra);
                  }
                },
                function (rr) {
                  if (first) {
                    first = false;
                    me.reject(rr);
                  }
                }
              );
              return;
            }
          } catch (e) {
            if (first) this.reject(e);
            return;
          }
        }

        this.state = STATE_FULFILLED;
        this.v = value;
        if (me.c)
          soon(function () {
            for (var n = 0, l = me.c.length; n < l; n++) {
              resolveClient(me.c[n], value);
            }
          });
      },
      reject: function reject(reason) {
        if (this.state !== STATE_PENDING) return;
        var me = this; // preserve this

        this.state = STATE_REJECTED;
        this.v = reason;
        var clients = this.c;
        if (clients)
          soon(function () {
            for (var n = 0, l = clients.length; n < l; n++) {
              rejectClient(clients[n], reason);
            }
          });
        else
          soon(function () {
            if (!me.handled) {
              if (!Zousan.suppressUncaughtRejectionError)
                Zousan.warn(
                  "You upset Zousan. Please catch rejections: ",
                  reason,
                  reason ? reason.stack : null
                );
            }
          });
      },
      then: function then(onF, onR) {
        var p = new Zousan();
        var client = {
          y: onF,
          n: onR,
          p: p
        };

        if (this.state === STATE_PENDING) {
          // we are pending, so client must wait - so push client to end of this.c array (create if necessary for efficiency)
          if (this.c) this.c.push(client);
          else this.c = [client];
        } // if state was NOT pending, then we can just immediately (soon) call the resolve/reject handler
        else {
          var s = this.state,
            a = this.v; // In the case that the original promise is already fulfilled, any uncaught rejection should already have been warned about

          this.handled = true; // set promise as "handled" to suppress warning for unhandled rejections

          soon(function () {
            // we are not pending, so yield script and resolve/reject as needed
            if (s === STATE_FULFILLED) resolveClient(client, a);
            else rejectClient(client, a);
          });
        }

        return p;
      },
      catch: function _catch(cfn) {
        return this.then(null, cfn);
      },
      // convenience method
      finally: function _finally(cfn) {
        return this.then(cfn, cfn);
      },
      // convenience method
      // new for 1.2  - this returns a new promise that times out if original promise does not resolve/reject before the time specified.
      // Note: this has no effect on the original promise - which may still resolve/reject at a later time.
      timeout: function timeout(ms, timeoutMsg) {
        timeoutMsg = timeoutMsg || "Timeout";
        var me = this;
        return new Zousan(function (resolve, reject) {
          setTimeout(function () {
            reject(Error(timeoutMsg)); // This will fail silently if promise already resolved or rejected
          }, ms);
          me.then(
            function (v) {
              resolve(v);
            }, // This will fail silently if promise already timed out
            function (er) {
              reject(er);
            }
          ); // This will fail silently if promise already timed out
        });
      }
    }; // END of prototype function list

    function resolveClient(c, arg) {
      if (typeof c.y === "function") {
        try {
          var yret = c.y.call(_undefined, arg);
          c.p.resolve(yret);
        } catch (err) {
          c.p.reject(err);
        }
      } else c.p.resolve(arg); // pass this along...
    }

    function rejectClient(c, reason) {
      if (typeof c.n === "function") {
        try {
          var yret = c.n.call(_undefined, reason);
          c.p.resolve(yret);
        } catch (err) {
          c.p.reject(err);
        }
      } else c.p.reject(reason); // pass this along...
    } // "Class" functions follow (utility functions that live on the Zousan function object itself)

    Zousan.resolve = function (val) {
      return new Zousan(function (resolve) {
        return resolve(val);
      });
    };

    Zousan.reject = function (err) {
      var z = new Zousan();
      z.c = []; // see https://github.com/bluejava/zousan/issues/7#issuecomment-415394963

      z.reject(err);
      return z;
    };

    Zousan.all = function (pa) {
      var results = [],
        retP = new Zousan(); // results and final return promise

      var rc = 0; // resolved count

      function rp(p, i) {
        if (!p || typeof p.then !== "function") p = Zousan.resolve(p);
        p.then(
          function (yv) {
            results[i] = yv;
            rc++;
            if (rc == pa.length) retP.resolve(results);
          },
          function (nv) {
            retP.reject(nv);
          }
        );
      }

      for (var x = 0; x < pa.length; x++) {
        rp(pa[x], x);
      } // For zero length arrays, resolve immediately

      if (!pa.length) retP.resolve(results);
      return retP;
    }; // If we have a console, use it for our errors and warnings, else do nothing (either/both can be overwritten)

    var nop = function nop() {};

    Zousan.warn = typeof console !== _undefinedString ? console.warn : nop;
    Zousan.error = typeof console !== _undefinedString ? console.error : nop; // make soon accessable from Zousan

    Zousan.soon = soon;

    return Zousan;
}
,
/* istanbul ignore next */
function getSubscript ()
{
    var SPACE = 32; // current string, index and collected ids

    var idx,
        cur,
        // no handling tagged literals since easily done on user side with cache, if needed
    parse = function parse(s) {
      return idx = 0, cur = s, s = expr(), cur[idx] ? err() : s || '';
    },
        err = function err(msg, frag, prev, last) {
      if (msg === void 0) {
        msg = 'Bad syntax';
      }

      if (frag === void 0) {
        frag = cur[idx];
      }

      if (prev === void 0) {
        prev = cur.slice(0, idx).split('\n');
      }

      if (last === void 0) {
        last = prev.pop();
      }

      throw SyntaxError(msg + " `" + frag + "` at " + prev.length + ":" + last.length);
    },
        // longErr = function longErr(msg, frag, lines, last) {
      // if (msg === void 0) {
        // msg = 'Bad syntax';
      // }

      // if (frag === void 0) {
        // frag = cur[idx];
      // }

      // if (lines === void 0) {
        // lines = cur.slice(0, idx).split('\n');
      // }

      // if (last === void 0) {
        // last = lines.pop();
      // }

      // var before = cur.slice(idx - 10, idx).split('\n').pop();
      // var after = cur.slice(idx + 1, idx + 10).split('\n').shift();
      // var location = lines.length + ':' + last.length;
      // throw SyntaxError(msg + " at " + location + " `" + (before + frag + after) + "`\n" + ' '.repeat(18 + msg.length + location.length + before.length + 1) + "^");
    // },
        skip = function skip(is, from, l) {
      if (is === void 0) {
        is = 1;
      }

      if (from === void 0) {
        from = idx;
      }

      if (typeof is == 'number') idx += is;else while (l = is(cur.charCodeAt(idx))) {
        idx += l;
      }
      return cur.slice(from, idx);
    },
        // a + b - c
    expr = function expr(prec, end, cc, token, newNode, fn) {
      if (prec === void 0) {
        prec = 0;
      }

      var _ref;
      // chunk/token parser
      while ((cc = parse.space()) && ( // till not end
      // FIXME: extra work is happening here, when lookup bails out due to lower precedence -
      // it makes extra `space` call for parent exprs on the same character to check precedence again
      newNode = (_ref = (fn = lookup[cc]) && fn(token, prec)) != null ? _ref : // if operator with higher precedence isn't found
      !token && parse.id() // parse literal or quit. token seqs are forbidden: `a b`, `a "b"`, `1.32 a`
      )) {
        token = newNode;
      } // check end character
      // FIXME: can't show "Unclose paren", because can be unknown operator within group as well


      if (end) cc == end ? idx++ : err();
      return token;
    },
        isId = function isId(c) {
      return c >= 48 && c <= 57 || // 0..9
      c >= 65 && c <= 90 || // A...Z
      c >= 97 && c <= 122 || // a...z
      c == 36 || c == 95 || // $, _,
      c >= 192 && c != 215 && c != 247;
    },
        // any non-ASCII
    // skip space chars, return first non-space character
    space = function (cc) {
      while ((cc = cur.charCodeAt(idx)) <= SPACE) {
        idx++;
      }

      return cc;
    },
        id = function (n) {
      return skip(isId);
    },
        // operator/token lookup table
    // lookup[0] is id parser to let configs redefine it
    lookup = [],
        // create operator checker/mapper (see examples)
    token = function token(op, prec, map, c, l, prev, word // make sure word boundary comes after word operator
    ) {
      if (prec === void 0) {
        prec = SPACE;
      }

      if (c === void 0) {
        c = op.charCodeAt(0);
      }

      if (l === void 0) {
        l = op.length;
      }

      if (prev === void 0) {
        prev = lookup[c];
      }

      if (word === void 0) {
        word = op.toUpperCase() !== op;
      }

      return lookup[c] = function (a, curPrec, from) {
        if (from === void 0) {
          from = idx;
        }

        return curPrec < prec && (l < 2 || cur.substr(idx, l) == op) && (!word || !isId(cur.charCodeAt(idx + l))) && (idx += l, map(a, curPrec)) || (idx = from, prev == null ? void 0 : prev(a, curPrec));
      };
    },
        // right assoc is indicated by negative precedence (meaning go from right to left)
    binary = function binary(op, prec, right) {
      return token(op, prec, function (a, b) {
        return a && (b = expr(prec - !!right)) && [op, a, b];
      });
    },
        unary = function unary(op, prec, post) {
      return token(op, prec, function (a) {
        return post ? a && [op, a] : !a && (a = expr(prec - 1)) && [op, a];
      });
    },
        nary = function nary(op, prec, skips) {
      return token(op, prec, function (a, b) {
        return a && (b = expr(prec), b || skips) && (a[0] === op && a[2] ? (a.push(b || null), a) : [op, a, b]);
      });
    }; // build optimized evaluator for the tree

    parse.space = space;
    parse.id = id;

    var compile = function compile(node) {
      return !Array.isArray(node) ? function (ctx) {
        return ctx == null ? void 0 : ctx[node];
      } : operators[node[0]].apply(operators, node.slice(1));
    },
        operators = {},
        operator = function operator(op, fn, prev) {
      if (prev === void 0) {
        prev = operators[op];
      }

      return operators[op] = function () {
        return fn.apply(void 0, arguments) || prev && prev.apply(void 0, arguments);
      };
    };

    var CPAREN = 41,
        CBRACK = 93,
        DQUOTE$1 = 34,
        PERIOD = 46,
        _0 = 48,
        _9 = 57,
        PREC_SEQ = 1,
        PREC_SOME = 4,
        PREC_EVERY = 5,
        PREC_OR$1 = 6,
        PREC_XOR = 7,
        PREC_AND = 8,
        PREC_EQ$1 = 9,
        PREC_COMP$1 = 10,
        PREC_SHIFT = 11,
        PREC_SUM = 12,
        PREC_MULT = 13,
        PREC_UNARY$1 = 15,
        PREC_CALL$1 = 18;

    var subscript = function subscript(s) {
      return s = parse(s), function (ctx) {
        return (s.call ? s : s = compile(s))(ctx);
      };
    },
        // set any operator
    // right assoc is indicated by negative precedence (meaning go from right to left)
    set = function set(op, prec, fn) {
      return fn[0] || fn[1] ? (prec ? token(op, prec, fn[0]) : lookup[op.charCodeAt(0) || 1] = fn[0], operator(op, fn[1])) : !fn.length ? (nary(op, prec), operator(op, function () {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        return args = args.map(compile), function (ctx) {
          return fn.apply(void 0, args.map(function (arg) {
            return arg(ctx);
          }));
        };
      })) : fn.length > 1 ? (binary(op, Math.abs(prec), prec < 0), operator(op, function (a, b) {
        return b && (a = compile(a), b = compile(b), !a.length && !b.length ? (a = fn(a(), b()), function () {
          return a;
        }) : function (ctx) {
          return fn(a(ctx), b(ctx));
        });
      })) : (unary(op, prec), operator(op, function (a, b) {
        return !b && (a = compile(a), !a.length ? (a = fn(a()), function () {
          return a;
        }) : function (ctx) {
          return fn(a(ctx));
        });
      }));
    },
        num = function num(a) {
      return a ? err() : ['', (a = +skip(function (c) {
        return c === PERIOD || c >= _0 && c <= _9 || (c === 69 || c === 101 ? 2 : 0);
      })) != a ? err() : a];
    },
        // create increment-assign pair from fn
    inc = function inc(op, prec, fn, _ev) {
      return [op, prec, [function (a) {
        return a ? [op === '++' ? '-' : '+', [op, a], ['', 1]] : [op, expr(prec - 1)];
      }, // ++a → [++, a], a++ → [-,[++,a],1]
      _ev = function ev(a, b) {
        var _a;

        return a[0] === '(' ? _ev(a[1]) : // ++(((a)))
        a[0] === '.' ? (b = a[2], a = compile(a[1]), function (ctx) {
          return fn(a(ctx), b);
        }) : // ++a.b
        a[0] === '[' ? ((_a = a, a = _a[1], b = _a[2]), a = compile(a), b = compile(b), function (ctx) {
          return fn(a(ctx), b(ctx));
        }) : // ++a[b]
        function (ctx) {
          return fn(ctx, a);
        } // ++a
        ;
      }]];
    },
        list$1 = [// literals
    // null operator returns first value (needed for direct literals)
    '',, [, function (v) {
      return function () {
        return v;
      };
    }], '"',, [function (a) {
      return a ? err() : ['', (skip() + skip(function (c) {
        return c - DQUOTE$1 ? 1 : 0;
      }) + (skip() || err('Bad string'))).slice(1, -1)];
    }], // .1
    '.',, [function (a) {
      return !a && num();
    }]].concat(Array(10).fill(0).flatMap(function (_, i) {
      return ['' + i, 0, [num]];
    }), [// sequences
    ',', PREC_SEQ, function () {
      var _ref2;

      return _ref2 = arguments.length - 1, _ref2 < 0 || arguments.length <= _ref2 ? undefined : arguments[_ref2];
    }, '||', PREC_SOME, function () {
      var i = 0,
          v;

      for (; !v && i < arguments.length;) {
        var _i;

        v = (_i = i++, _i < 0 || arguments.length <= _i ? undefined : arguments[_i]);
      }

      return v;
    }, '&&', PREC_EVERY, function () {
      var i = 0,
          v = true;

      for (; v && i < arguments.length;) {
        var _i2;

        v = (_i2 = i++, _i2 < 0 || arguments.length <= _i2 ? undefined : arguments[_i2]);
      }

      return v;
    }, // binaries
    '+', PREC_SUM, function (a, b) {
      return a + b;
    }, '-', PREC_SUM, function (a, b) {
      return a - b;
    }, '*', PREC_MULT, function (a, b) {
      return a * b;
    }, '/', PREC_MULT, function (a, b) {
      return a / b;
    }, '%', PREC_MULT, function (a, b) {
      return a % b;
    }, '|', PREC_OR$1, function (a, b) {
      return a | b;
    }, '&', PREC_AND, function (a, b) {
      return a & b;
    }, '^', PREC_XOR, function (a, b) {
      return a ^ b;
    }, '==', PREC_EQ$1, function (a, b) {
      return a == b;
    }, '!=', PREC_EQ$1, function (a, b) {
      return a != b;
    }, '>', PREC_COMP$1, function (a, b) {
      return a > b;
    }, '>=', PREC_COMP$1, function (a, b) {
      return a >= b;
    }, '<', PREC_COMP$1, function (a, b) {
      return a < b;
    }, '<=', PREC_COMP$1, function (a, b) {
      return a <= b;
    }, '>>', PREC_SHIFT, function (a, b) {
      return a >> b;
    }, '>>>', PREC_SHIFT, function (a, b) {
      return a >>> b;
    }, '<<', PREC_SHIFT, function (a, b) {
      return a << b;
    }, // unaries
    '+', PREC_UNARY$1, function (a) {
      return +a;
    }, '-', PREC_UNARY$1, function (a) {
      return -a;
    }, '!', PREC_UNARY$1, function (a) {
      return !a;
    }], inc('++', PREC_UNARY$1, function (a, b) {
      return ++a[b];
    }), inc('--', PREC_UNARY$1, function (a, b) {
      return --a[b];
    }), [// a[b]
    '[', PREC_CALL$1, [function (a) {
      return a && ['[', a, expr(0, CBRACK) || err()];
    }, function (a, b) {
      return b && (a = compile(a), b = compile(b), function (ctx) {
        return a(ctx)[b(ctx)];
      });
    }], // a.b
    '.', PREC_CALL$1, [function (a, b) {
      return a && (b = expr(PREC_CALL$1)) && ['.', a, b];
    }, function (a, b) {
      return a = compile(a), b = !b[0] ? b[1] : b, function (ctx) {
        return a(ctx)[b];
      };
    } // a.true, a.1 → needs to work fine
    ], // (a,b,c), (a)
    '(', PREC_CALL$1, [function (a) {
      return !a && ['(', expr(0, CPAREN) || err()];
    }, compile], // a(b,c,d), a()
    '(', PREC_CALL$1, [function (a) {
      return a && ['(', a, expr(0, CPAREN) || ''];
    }, function (a, b, path, args) {
      return b != null && (args = b == '' ? function () {
        return [];
      } : // a()
      b[0] === ',' ? (b = b.slice(1).map(compile), function (ctx) {
        return b.map(function (a) {
          return a(ctx);
        });
      }) : ( // a(b,c)
      b = compile(b), function (ctx) {
        return [b(ctx)];
      }), // a(b)
      a[0] === '.' ? (path = a[2], a = compile(a[1]), function (ctx) {
        var _a2;

        return (_a2 = a(ctx))[path].apply(_a2, args(ctx));
      }) : // a.b(...args)
      a[0] === '[' ? (path = compile(a[2]), a = compile(a[1]), function (ctx) {
        var _a3;

        return (_a3 = a(ctx))[path(ctx)].apply(_a3, args(ctx));
      }) : ( // a[b](...args)
      a = compile(a), function (ctx) {
        return a(ctx).apply(void 0, args(ctx));
      }) // a(...args)
      );
    }]]);

    for (; list$1[2];) {
      set.apply(void 0, list$1.splice(0, 3));
    } // justin lang https://github.com/endojs/Jessie/issues/66


    var DQUOTE = 34,
        QUOTE = 39,
        BSLASH = 92,
        PREC_COND = 3,
        PREC_OR = 6,
        PREC_EQ = 9,
        PREC_COMP = 10,
        PREC_EXP = 14,
        PREC_UNARY = 15,
        PREC_CALL = 18;

    var escape = {
      n: '\n',
      r: '\r',
      t: '\t',
      b: '\b',
      f: '\f',
      v: '\v'
    },
        string = function string(q) {
      return function (qc, c, str) {
        if (str === void 0) {
          str = '';
        }

        qc && err('Unexpected string'); // must not follow another token

        skip();

        while (c = cur.charCodeAt(idx), c - q) {
          if (c === BSLASH) skip(), c = skip(), str += escape[c] || c;else str += skip();
        }

        skip();
        return ['', str];
      };
    },
        list = [// operators
    '===', PREC_EQ, function (a, b) {
      return a === b;
    }, '!==', PREC_EQ, function (a, b) {
      return a !== b;
    }, '~', PREC_UNARY, function (a) {
      return ~a;
    }, // ?:
    '?', PREC_COND, [function (a, b, c) {
      return a && (b = expr(2, 58)) && (c = expr(3), ['?', a, b, c]);
    }, function (a, b, c) {
      return a = compile(a), b = compile(b), c = compile(c), function (ctx) {
        return a(ctx) ? b(ctx) : c(ctx);
      };
    }], '??', PREC_OR, function (a, b) {
      return a != null ? a : b;
    }, // a?.[, a?.( - postfix operator
    '?.', PREC_CALL, [function (a) {
      return a && ['?.', a];
    }, function (a) {
      return a = compile(a), function (ctx) {
        return a(ctx) || function () {};
      };
    }], // a?.b - optional chain operator
    '?.', PREC_CALL, [function (a, b) {
      var _b;

      return a && (b = expr(PREC_CALL), !((_b = b) != null && _b.map)) && ['?.', a, b];
    }, function (a, b) {
      return b && (a = compile(a), function (ctx) {
        var _a4;

        return (_a4 = a(ctx)) == null ? void 0 : _a4[b];
      });
    }], 'in', PREC_COMP, function (a, b) {
      return a in b;
    }, // "' with /
    '"',, [string(DQUOTE)], "'",, [string(QUOTE)], // /**/, //
    '/*', 20, [function (a, prec) {
      return skip(function (c) {
        return c !== 42 && cur.charCodeAt(idx + 1) !== 47;
      }), skip(2), a || expr(prec);
    }], '//', 20, [function (a, prec) {
      return skip(function (c) {
        return c >= 32;
      }), a || expr(prec);
    }], // literals
    'null', 20, [function (a) {
      return a ? err() : ['', null];
    }], 'true', 20, [function (a) {
      return a ? err() : ['', true];
    }], 'false', 20, [function (a) {
      return a ? err() : ['', false];
    }], 'undefined', 20, [function (a) {
      return a ? err() : ['', undefined];
    }], // FIXME: make sure that is right
    ';', 20, [function (a) {
      return expr() || [''];
    }], // right order
    // '**', (a,prec,b=expr(PREC_EXP-1)) => ctx=>a(ctx)**b(ctx), PREC_EXP,
    '**', -PREC_EXP, function (a, b) {
      return Math.pow(a, b);
    }, // [a,b,c]
    '[', 20, [function (a) {
      return !a && ['[', expr(0, 93) || ''];
    }, function (a, b) {
      return !b && (!a ? function () {
        return [];
      } : // []
      a[0] === ',' ? (a = a.slice(1).map(compile), function (ctx) {
        return a.map(function (a) {
          return a(ctx);
        });
      }) : ( // [a,b,c]
      a = compile(a), function (ctx) {
        return [a(ctx)];
      }) // [a]
      );
    }], // {a:1, b:2, c:3}
    '{', 20, [function (a) {
      return !a && ['{', expr(0, 125) || ''];
    }, function (a, b) {
      return !a ? function (ctx) {
        return {};
      } : // {}
      a[0] === ',' ? (a = a.slice(1).map(compile), function (ctx) {
        return Object.fromEntries(a.map(function (a) {
          return a(ctx);
        }));
      }) : // {a:1,b:2}
      a[0] === ':' ? (a = compile(a), function (ctx) {
        return Object.fromEntries([a(ctx)]);
      }) : ( // {a:1}
      b = compile(a), function (ctx) {
        var _ref3;

        return _ref3 = {}, _ref3[a] = b(ctx), _ref3;
      });
    }], ':', 1.1, [function (a, b) {
      return b = expr(1.1) || err(), [':', a, b];
    }, function (a, b) {
      return b = compile(b), a = Array.isArray(a) ? compile(a) : function (a) {
        return a;
      }.bind(0, a), function (ctx) {
        return [a(ctx), b(ctx)];
      };
    }]];

    for (; list[2];) {
      set.apply(void 0, list.splice(0, 3));
    }

    subscript.parse = parse;
    subscript.compile = compile;

    return subscript;
}
);
