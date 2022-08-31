(function (factory, getGlobal, getPromise, getSubscript)
{
    var global = getGlobal ();

    function nit () {}

    factory (nit, global, getPromise (), getSubscript ());

    if (typeof exports == "object" && !global.document)
    {
        module.exports = nit;
    }
    else
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
}) (
function (nit, global, Promise, subscript, undefined) // eslint-disable-line no-shadow-restricted-names
{
    Error.stackTraceLimit = 100; // or Infinity;

    var OBJECT        = Object;
    var OBJECT_PROTO  = Object.prototype;
    var PROTO         = OBJECT.getPrototypeOf.bind (OBJECT);
    var OBJECT_CREATE = OBJECT.create.bind (OBJECT);
    var ARR_PROTO     = Array.prototype;
    var ARR_SLICE     = ARR_PROTO.slice;
    var ARRAY         = ARR_SLICE.call.bind (ARR_SLICE);
    var TYPED_ARRAY   = PROTO (Int8Array.prototype).constructor;
    var NIT           = "nit";


    //--------------------------------------------
    // Base utility methods
    //--------------------------------------------

    nit.dp = OBJECT.defineProperty.bind (OBJECT);


    nit.dpg = function (o, p, getter, configurable, enumerable)
    {
        return nit.dp (o, p,
        {
            get:          typeof getter == "function" ? getter : function () { return getter; },
            configurable: configurable,
            enumerable:   enumerable === undefined ? configurable : enumerable
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
        if (typeof v == "function" && !v.name)
        {
            nit.dpv (v, "name", p, true, false);
        }

        return nit.dp (o, p,
        {
            value:        v,
            configurable: configurable,
            enumerable:   enumerable === undefined ? configurable : enumerable,
            writable:     configurable
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
        CLASS_REF_PATTERN: /^@([a-zA-Z][a-zA-Z0-9]*\.)*([A-Z][a-z0-9]*)+$/,
        CLASS_TAG: "@class",
        CONFIG: {},
        ENV: {},
        ERROR_CODE_PATTERN: /^[a-z0-9_]+(\.[a-z0-9_]+)*$/,
        EXPANDABLE_ARG_PATTERN: /\.\.(([a-z][a-z0-9_$]+)(\|[a-z][a-z0-9_$]+)*)(!?)$/i,
        NS: { nit: nit }

    }, true, false);


    nit.dpg (nit, "stack", function ()
    {
        return new Error ().stack.split ("\n").slice (2).join ("\n");
    });


    nit.noop  = function () {};


    nit.do = function (obj, cb)
    {
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

                uuid = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace (/[018]/g, function (c)
                {
                    return (c ^ f.call (c, new Uint8Array(1))[0] & 15 >> c / 4).toString (16);
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


    nit.trim = function (s, chars)
    {
        s = ((s === null || s === undefined ? "" : s) + "");

        return s.replace (chars ? new RegExp ("^[" + chars + "]+|[" + chars + "]+$", "g") : nit.trim.PATTERN, "");
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
        else
        if (!(obj instanceof cls))
        {
            obj = OBJECT_CREATE (cls.prototype);
        }

        if (cls.constructObject)
        {
            obj = cls.constructObject (obj, ARRAY (args || [])) || obj;
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


    nit.propertyDescriptors = function (obj, all)
    {
        var descriptors = {};
        var chain       = [];
        var o;

        for (o = obj; o && o != OBJECT_PROTO; o = PROTO (o))
        {
            chain.unshift (o);
        }

        while ((o = chain.shift ()))
        {
            var ds = OBJECT.getOwnPropertyDescriptors (o);

            for (var n in ds)
            {
                if (all || ds[n].enumerable)
                {
                    descriptors[n] = ds[n];
                }
            }
        }

        return descriptors;
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
        var keys  = [];
        var pds   = nit.propertyDescriptors (obj, all);

        for (var k in pds)
        {
            if (!nit.keys.IGNORED_PROPERTIES.test (k))
            {
                keys.push (k);
            }
        }

        return keys;
    };


    nit.keys.IGNORED_PROPERTIES = /^(global|constructor|toString)$/i;
    nit.keys.DEFAULT_ARRAY_PROPERTIES = nit.keys ([], true);


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

        for (var i = 1, j = arguments.length; i < j; ++i)
        {
            var src = arguments[i];

            if (src)
            {
                nit.keys (src).forEach (function (k)
                {
                    target[k] = src[k];
                });
            }
        }

        return target;
    };


    nit.object = function ()
    {
        return nit.assign.apply (nit, [OBJECT_CREATE (nit.object.prototype)].concat (ARRAY (arguments)));
    };


    nit.memoize = function (fn)
    {
        var called = false;
        var result;

        function get ()
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

        get.reset = function ()
        {
            called = false;
            result = undefined;
        };

        return get;
    };


    nit.memoize.dpg = function (target, name, initializer, configurable, enumerable)
    {
        var cfg = nit.typedArgsToObj (nit.array (arguments).slice (1),
        {
            name: "string",
            initializer: "function",
            configurable: "boolean",
            enumerable: "boolean"
        });

        name = cfg.name;
        initializer = cfg.initializer;
        configurable = nit.is.undef (cfg.configurable) ? true : cfg.configurable;
        enumerable = nit.is.undef (cfg.enumerable) ? true : cfg.enumerable;

        var privProp = "$__" + name;

        function getter ()
        {
            var owner = this;

            if (!owner.hasOwnProperty (privProp))
            {
                var v = initializer.call (owner);

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

        return isNaN (i) ? (defval || 0) : i;
    };


    nit.float = function (v, defval)
    {
        var f = parseFloat (v);

        return isNaN (f) ? (defval || 0) : f;
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
    nit.is.num        = nit.is.number    = function (v) { v = (v + "").trim (); return v !== "" && !isNaN (Number (v)); };
    nit.is.int        = nit.is.integer   = function (v) { return nit.is.num (v) && (Math.floor (v) + "") == (v + ""); };
    nit.is.func       = nit.is.function  = function (v) { return typeof v == "function"; };
    nit.is.bool       = nit.is.boolean   = function (v) { return typeof v == "boolean"; };
    nit.is.arr        = nit.is.array     = function (v) { return v instanceof Array; };
    nit.is.obj        = nit.is.object    = function (v) { return v !== null && !(v instanceof Array) && typeof v == "object"; };
    nit.is.async      = function (v) { return nit.is (v, "AsyncFunction"); };
    nit.is.undef      = function (v) { return v === null || v === undefined; };
    nit.is.arrayish   = function (v) { return v && (v instanceof Array || v instanceof TYPED_ARRAY || nit.is (v, "arguments") || (typeof v == "object" && typeof v.hasOwnProperty == "function" && v.hasOwnProperty ("length"))); };
    nit.is.symbol     = function (v) { return nit.is (v, "symbol"); };
    nit.is.typedArray = function (v) { return v instanceof TYPED_ARRAY; };
    nit.is.buffer     = function (v) { return typeof Buffer !== "undefined" && v instanceof Buffer; };
    nit.is.promise    = function (v) { return v instanceof Promise; };
    nit.is.instanceOf = function (o, cls) { return o instanceof cls; };
    nit.is.subclassOf = function (subclass, superclass) { return !!(subclass && subclass.prototype instanceof superclass); };
    nit.is.keyword    = function (v) { return " break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof new return super switch this throw try typeof var void while with yield ".indexOf (" " + v + " ") !== -1; };
    nit.is.pojo       = function (v) { return v && typeof v == "object" && !!v.constructor && v.constructor.prototype.hasOwnProperty ("isPrototypeOf"); };
    nit.is.any        = function () { return true; };

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


    nit.is.truthy = function (v)
    {
        return nit.is.bool (v)
            ? v === true
            : (nit.is.num (v)
                ? v !== 0
                : !nit.is.empty (v));
    };


    nit.is.not = OBJECT.keys (nit.is)
      .reduce (function (a, k)
      {
          var test = nit.is[k];

          a[k] = function ()
          {
              return !test.apply (null, arguments);
          };

          return a;

      }, {});


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


    nit.get = function (obj, dotPath, defval)
    {
        if (!dotPath)
        {
            return obj;
        }

        if (obj && (typeof obj == "object" || typeof obj == "function"))
        {
            var kv = nit.kvSplit (dotPath, ".");
            var k = kv[0];
            var rest = kv[1];

            if (k in obj)
            {
                var v = obj[k];

                if (rest)
                {
                    if (v && (typeof v == "object" || typeof v == "function"))
                    {
                        return nit.get (v, rest, defval);
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
        if (obj && (typeof obj == "object" || typeof obj == "function"))
        {
            var kv = nit.kvSplit (dotPath, ".");
            var k = kv[0];
            var rest = kv[1];

            if (rest)
            {
                var v = obj[k];

                if (!v || (typeof v != "object" && typeof v != "function"))
                {
                    v = obj[k] = {};
                }

                nit.set (v, rest, value);
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


    nit.log = function ()
    {
        nit.log.logger.apply (nit.log.logger, arguments);

        return nit;
    };


    nit.log.logger = console.log.bind (console);


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
        return nit.trim (exp).replace (/([.*+?^=!:${}()|/[\]\\])/g, "\\$1");
    };


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

                    if (arg instanceof Array)
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


    // ----------------
    // Object utils
    // ----------------

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


    nit.clone = function (object, filter, target, all)
    {
        if (typeof object == "function")
        {
            object = nit.keys (object, all)
                .reduce (function (o, k)
                {
                    o[k] = object[k];

                    return o;

                }, { name: object.name });
        }

        var cloned  = {};
        var nodes   = [{ obj: object, k: "result", result: cloned, ancestors: [] }];
        var node;

        if (filter && typeof filter == "object")
        {
            target  = filter;
            filter  = undefined;
        }

        filter = filter || nit.clone.filter;

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
                    obj = "[circular]";
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
                r = (obj == object && target) ? target : {};

                var ks = nit.keys (obj, all);

                for (k = 0; k < ks.length; ++k)
                {
                    nodes.push ({ obj: obj[ks[k]], k: ks[k], result: r, ancestors: node.ancestors.concat (obj) });
                }

                obj = r;
            }
            else
            if (obj instanceof Array)
            {
                r = Array (obj.length);

                for (k = 0; k < obj.length; ++k)
                {
                    nodes.push ({ obj: obj[k], k: k, result: r, ancestors: node.ancestors.slice (), array: true });
                }

                var props = nit.propertyDescriptors (obj, all);

                for (var p in props)
                {
                    if (!nit.is.int (p))
                    {
                        nodes.push ({ obj: obj[p], k: p, result: r, ancestors: node.ancestors.slice (), array: true });
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
            return !(node.array && k in nit.clone.deep.IGNORED_ARRAY_PROPERTIES);

        }, null, true);
    };

    nit.clone.deep.IGNORED_ARRAY_PROPERTIES = nit.flip (nit.keys.DEFAULT_ARRAY_PROPERTIES);


    nit.clone.shallow = function (obj)
    {
        if (obj instanceof Array)
        {
            return obj.slice ();
        }
        else
        if (typeof obj == "object")
        {
            return nit.assign ({}, obj);
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


    nit.toJson = function (o, indent)
    {
        var data = nit.is.undef (o) ? o : nit.clone (o);

        if (arguments.length > 1)
        {
            if (nit.is.num (indent))
            {
                indent = nit.lpad ("", indent, " ");
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


    nit.serialize = function (value, indent)
    {
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


    nit.dpv (nit.each, "STOP", {});
    nit.dpv (nit.each, "CANCEL", nit.each.STOP);
    nit.dpv (nit.each, "SKIP", {});


    nit.find = function (o, func) // or find (o, k, v)
    {
        var found;
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

        nit.each (o, function (item)
        {
            if (func (item))
            {
                found = item;

                return nit.each.STOP;
            }
        });

        return found;
    };


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
        var unusedArgs = [];
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

                    if ((found = nit.is[t] (arg)))
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
                unusedArgs.push (arg);
            }
        }

        unusedArgs.forEach (function (arg)
        {
            nit.assign (obj, arg);
        });

        return obj;
    };


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
            var vv;

            if (op && (op = op[0]))
            {
                k = k.slice (0, -1) + exp;

                switch (op)
                {
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


    nit.config.OP_PATTERN = /[?+-]$/;


    // -------------------------
    // A simple string template
    // -------------------------

    nit.Template = (function ()
    {
        var CHECK_PATTERN = /[?!+-]/;
        var CHECKS =
        {
            "?": nit.is.truthy,
            "!": nit.is.not.truthy,
            "-": nit.is.empty,
            "+": nit.is.not.empty
        };


        function Template (template, openTag, closeTag, config)
        {
            var args  = ARRAY (arguments);
            var self  = this;

            config = nit.argsToObj (args, ["template", "openTag", "closeTag"]);

            for (var i in Template.defaults)
            {
                var def = Template.defaults[i];

                self[i] = config[i] || (nit.is.obj (def) ? nit.assign ({}, def) : def);
            }

            nit.each (self.partials, function (partial, n)
            {
                if (nit.is.str (partial))
                {
                    self.partials[n] = self.parse (partial);
                }
            });

            self.tokens = self.parse (self.template);

            return self;
        }


        Template.prototype.parse = function (template)
        {
            var self = this;

            return self.parseBlocks (Template.tokenize (template, self.openTag, self.closeTag));
        };


        Template.prototype.parseBlocks = function (tokens, level)
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

                            if (type == "#")
                            {
                                var check = token[0][0];

                                if (check.match (CHECK_PATTERN))
                                {
                                    token.check = check;
                                    token[0] = token[0].slice (1);
                                }

                                token.branches = [];
                                branchBlocks.push (branchExpr = token);
                            }
                            else
                            if (type == ":")
                            {
                                branchExpr.branches.push (token);

                                return;
                            }
                            break;

                        case "*": // partial expansion
                            token.type = type;
                            n = token.name = token[0].slice (1);

                            var partial = self.partials[n] || Template.PARTIALS[n];

                            if (!partial)
                            {
                                throw new Error ("The partial '" + n + "' was not registered.");
                            }

                            token.children = partial;
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
        };


        Template.prototype.render = function (data, env)
        {
            var self = this;
            var context =
            {
                $ENV: env || {},
                $PENDING_RESULTS: [],
                $TOKEN_RESULTS: {}
            };

            function render (data)
            {
                var result = self.renderTokens (self.tokens, data, context);

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
        };


        Template.prototype.addPendingResult = function (context, token, result, dataIndex)
        {
            context.$PENDING_RESULTS.push (result.then (function (result)
            {
                dataIndex = dataIndex || 0;
                context.$TOKEN_RESULTS[token.id + ":" + dataIndex] = result;
            }));
        };


        Template.prototype.evaluate = function (expr, data, context)
        {
            var escPipe = "<" + nit.uuid () + ">";
            var escPipeRe = new RegExp (escPipe, "g");
            var self = this;
            var transforms = expr
                .replace (/\\\|/g, escPipe)
                .split ("|")
                .map (function (t)
                {
                    return t.replace (escPipeRe, "\\|");
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
                    value = nit.eval (path, nit.assign ({}, data, context));
                }
                catch (e)
                {
                    nit.log (e);
                }
            }

            function evaluate (value)
            {
                var trans = transforms.shift ();

                if (trans)
                {
                    var ctx = { $$: value, $DATA: data, $ENV: context.$ENV, $TEMPLATE: self };
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
                    value = value.then (evaluate);
                }

                return transforms.length ? evaluate (value) : value;
            }

            return evaluate (value);
        };


        Template.prototype.renderTokens = function (tokens, data, context, evaluate, dataIndex)
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
                    var val;

                    switch (type)
                    {
                        case "*":
                            result += self.renderTokens (token.children, data, context, false, dataIndex);
                            break;

                        case "@":
                            // noop for inline partial
                            break;

                        case "#":
                            var branches = [token].concat (token.branches);

                            for (var i  = 0; i < branches.length; ++i)
                            {
                                var branch = branches[i];
                                var items = self.renderTokens (branch, data, context, true, dataIndex);

                                if (branch.check)
                                {
                                    items = CHECKS[branch.check] (items) ? [data] : [];
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
        };


        Template.defaults =
        {
            template:     "",
            openTag:      "{{",
            closeTag:     "}}",
            serialize:    nit.serialize,
            transforms:   {},
            partials:     {},
            dataSources:  {}
        };


        Template.render = function (tmpl, data, config) // eslint-disable-line no-unused-vars
        {
            var argv = nit.typedArgsToObj (arguments,
            {
                tmpl: "string",
                data: ["undef", "object"],
                config: "object"
            });

            return new Template (argv.tmpl, argv.config).render (argv.data);
        };


        Template.TRANSFORM_PATTERN    = /^([$a-z0-9_.-]+)\s*(@?\((.*)\))?$/i;
        Template.BLOCK_SYMBOLS        = "#?:@=/";
        Template.BLOCK_LEADING_WS     = /[ \t]+$/;
        Template.BLOCK_TRAILING_WS    = /^\n/;

        Template.TRANSFORMS   = { nit: nit };
        Template.PARTIALS     = {};
        Template.DATA_SOURCES = {};


        Template.parseTransform = function (decl, localTransforms)
        {
            var match = decl.match (Template.TRANSFORM_PATTERN);

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
        };


        Template.registerTransform = function (name, func)
        {
            Template.TRANSFORMS[name] = func;

            return Template;
        };


        Template.registerPartial = function (name, partial)
        {
            Template.PARTIALS[name] = new Template (partial).tokens;

            return Template;
        };


        Template.tokenize = function (tmpl, openTag, closeTag)
        {
            openTag   = openTag || Template.defaults.openTag;
            closeTag  = closeTag || Template.defaults.closeTag;

            var uuid      = nit.uuid ();
            var openChar  = openTag[0];
            var closeChar = closeTag[0];
            var escOpen   = "<O-" + uuid + ">";
            var escClose  = "<C-" + uuid + ">";
            var hasEsc    = false;

            tmpl = tmpl
                // remove newline + spaces
                .replace (/\\\n[ ]*/g, "")

                // use \{{ to escape the open tag character
                .replace (new RegExp ("\\\\([" + nit.escapeRegExp (openChar + closeChar) + "])", "g"), function (match, char)
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
                if (~blkSymbols.indexOf (rt[0][0])
                    && typeof (prev = rootTokens[i - 1]) == "string"
                    && typeof (next = rootTokens[i + 1]) == "string"
                    && prev.match (blkLeading)
                    && next.match (blkTrailing))
                {
                    rootTokens[i - 1] = prev.replace (blkLeading, "");
                    rootTokens[i + 1] = next.replace (blkTrailing, "");
                }
            }

            return rootTokens;
        };

        return Template;
    }) ();


    // -----------------------------------------
    // Functions
    // -----------------------------------------


    nit.format = function (/* str, args */)
    {
        var args    = ARRAY (arguments).map (function (arg) { return typeof arg == "object" || typeof arg == "function" ? nit.clone (arg) : arg; });
        var message = nit.trim (args.shift ());
        var data    = nit.argsToObj (args, null, false);

        nit.each (data, function (v, k)
        {
            if (nit.is.int (k))
            {
                delete data[k++];
                data["$" + k] = v; // pos args: $1, $2, ...
            }
        });

        return nit.Template.render (message, data, nit.format.defaults);
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
    nit.m.MESSAGES = {};

    nit.m ("error.class_not_defined", "The class '%{name}' was not defined.");


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

        args.shift ();

        while ((ks.length > 1)
            && (k = ks.join ("|"))
            && !(t = nit.m.MESSAGES[k]))
        {
            ks.splice (ks.length > 2 ? ks.length - 2 : 0, 1);
        }

        if (!t && (scope = nit.getSuperclass (scope)))
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

        args = [ctx.message, self].concat (args.slice (1));

        var error = new Error (nit.format.apply (nit, args));

        nit.dpv (error, "context", ctx);

        throw nit.dpv (error, "code", code, false, true);
    };


    nit.ns = function (ns, obj)
    {
        if (arguments.length > 1)
        {
            var p = nit.kvSplit (ns, ".").shift ();

            if (p && !nit.NS[p] && !nit.ns.initializing[p])
            {
                nit.ns.initializing[p] = true;
                nit.ns.init (p);
                delete nit.ns.initializing[p];
            }

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
        return (nit.NS[name] = nit.NS[name] || (nit.ns.initializer && nit.ns.initializer (name) || {}));
    };


    nit.ns.invoke = function (func)
    {
        var minified = nit.name != NIT;
        var argNames = nit.funcArgNames (func);
        var args = argNames.map (function (n) { return n.match (/^[a-z]/) ? nit.ns.init (func.length == 1 && minified ? NIT : n) : undefined; });

        return func.apply (global, args);
    };


    nit.ns.export = function ()
    {
        nit.assign (global, nit.NS);
        nit.NS = global;
    };


    nit.classChain = (function ()
    {
        var CACHE_KEY = "nit.classChain.chain";

        return function (cls)
        {
            cls = typeof cls == "object" ? cls.constructor : cls;

            if (!cls.hasOwnProperty (CACHE_KEY))
            {
                var chain = [];
                var sc = cls;

                do
                {
                    chain.push (sc);
                    sc = nit.getSuperclass (sc);
                }
                while (sc && sc != OBJECT);

                nit.dpg (cls, CACHE_KEY, chain);
            }

            return cls[CACHE_KEY].slice ();
        };
    }) ();


    nit.registerClass = function (name, cls) // or (cls)
    {
        if (nit.is.func (name))
        {
            cls = name;
            name = cls.name;
        }

        return nit.CLASSES[name] = cls;
    };


    nit.lookupClass = function (name)
    {
        var cls;

        if (nit.is.func (cls = nit.CLASSES[name]) || nit.is.func (cls = global[name]))
        {
            return cls;
        }
    };


    nit.listSubclassesOf = function (superclass)
    {
        return nit.each (nit.CLASSES, function (cls)
        {
            return nit.is.subclassOf (cls, superclass) ? cls : nit.each.SKIP;
        });
    };


    nit.lookupSubclassOf = function (superclass, name)
    {
        var simpleName = ~name.indexOf (".") ? "" : nit.pascalCase (name);

        for (var n in nit.CLASSES)
        {
            var cls = nit.CLASSES[n];

            if (nit.is.subclassOf (cls, superclass)
                && (simpleName ? (n.split (".").pop () == simpleName) : (n == name)))
            {
                return cls;
            }
        }
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
        var result;
        args = nit.array (args);

        if (nit.is.arr (func))
        {
            var obj = func[0];
            var method = func[1];

            if (nit.is.str (method))
            {
                method = obj[method];
            }

            result = method.apply (obj, args);
        }
        else
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


    nit.registerArgExpander ("tpl", function (tmpl, data)
    {
        return nit.Template.render (tmpl, data);
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
                cast: function (v, type) {} // eslint-disable-line no-unused-vars
            });
        })
        ,
        registerTypeParser: function (parser, order)
        {
            var cls = nit.Object;
            parser.$__order = order || 100;

            cls.TYPE_PARSERS.push (parser);
            cls.TYPE_PARSERS.sort (function (a, b) { return a.$__order - b.$__order; });

            return this;
        }
        ,
        Property: nit.do (nit.registerClass (nit.createFunction ("nit.Object.Property", true)), function (Property)
        {
            Property.constructObject = function (obj, args)
            {
                nit.assign (obj, nit.argsToObj (args, ["spec", "type", "defval", "configurable", "enumerable"], true));
            };

            Property.createFor = function (cls, spec, type, defval, configurable, enumerable)
            {
                var cfg = nit.typedArgsToObj (ARRAY (arguments).slice (1),
                {
                    spec: "string",
                    type: "string",
                    defval: "any",
                    configurable: "boolean",
                    enumerable: "boolean"
                });

                spec = nit.trim (cfg.spec);
                type = cfg.type;
                defval = cfg.defval;
                configurable = cfg.configurable;
                enumerable = cfg.enumerable === undefined ? configurable : cfg.enumerable;

                var ch = spec[0];
                var required = false;
                var positional = false;
                var array = !!cfg.array;
                var name;

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

                var privProp = "$__" + name;
                var parser = nit.find (nit.Object.TYPE_PARSERS, function (p) { return p.supports (type); });
                var classType = parser instanceof nit.Object.ClassTypeParser;
                var invalidValueCode = "error." + (classType ? "invalid_instance_type" : "invalid_value_type");

                var prop = new Property (spec, type, undefined, configurable, enumerable,
                {
                    defval: defval,
                    name: name,
                    required: required,
                    positional: positional,
                    array: array,
                    kind: cfg.kind || Property.prototype.kind,
                    setter: cfg.setter,
                    getter: cfg.getter,
                    primitive: !classType,

                    cast: function (v, owner)
                    {
                        var cv;

                        if (nit.is.undef (v))
                        {
                            if (nit.is.undef (prop.defval))
                            {
                                return;
                            }

                            v = nit.is.func (prop.defval) ? prop.defval (prop, owner) : nit.clone (prop.defval);
                        }

                        if ((cv = parser.cast (v, prop.type)) === undefined)
                        {
                            nit.throw.call (cls, { code: invalidValueCode, source: prop, owner: owner }, { value: v, property: prop });
                        }

                        return cv;
                    }
                    ,
                    get: function ()
                    {
                        var owner = this;
                        var v = owner[privProp];

                        if (!owner.hasOwnProperty (privProp))
                        {
                            if (prop.array)
                            {
                                v = [];
                            }
                            else
                            {
                                v = nit.is.func (prop.defval) ? prop.defval (prop, owner) : nit.clone (prop.defval);
                            }

                            nit.dpv (owner, privProp, v, true, false);
                        }

                        return prop.getter ? prop.getter.call (owner, v) : v;
                    }
                    ,
                    set: function (v)
                    {
                        var owner = this;

                        if (prop.required && nit.is.empty (v))
                        {
                            nit.throw.call (cls, { code: "error.value_required", source: prop, owner: owner }, { property: prop });
                        }

                        var isArr = nit.is.arr (v);

                        if (isArr && !prop.array && prop.type != "any")
                        {
                            nit.throw.call (cls, { code: invalidValueCode, source: prop, owner: owner }, { value: v, property: prop });
                        }

                        v = isArr ? v : nit.array (v);
                        v = v.map (function (v) { return prop.cast (v, owner); });

                        if (prop.array || (isArr && prop.type == "any"))
                        {
                            ["push", "unshift"].forEach (function (method)
                            {
                                var arrayMethod = ARR_PROTO[method];

                                nit.dpv (v, method, function (v)
                                {
                                    return arrayMethod.call (this, prop.cast (v, owner));
                                });
                            });
                        }
                        else
                        {
                            v = v.length ? v[0] : prop.cast (undefined, owner);
                        }

                        if (prop.setter)
                        {
                            v = prop.setter.call (owner, v);
                        }

                        if (!owner.hasOwnProperty (privProp))
                        {
                            nit.dpv (owner, privProp, v, true, false);
                        }
                        else
                        {
                            owner[privProp] = v;
                        }
                    }
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

                if (nit.is.undef (defval))
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
                kind: "property",
                cast: function (v, owner) {}, // eslint-disable-line no-unused-vars
                get: undefined,
                set: undefined,
                getter: undefined,
                setter: undefined
            });
        })
        ,
        do: function (cb)
        {
            return nit.do (this, cb);
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
        extend: function (superclass)
        {
            return nit.extend (this, superclass);
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
            nit.registerClass (cls);

            return self;
        }
        ,
        defineSubclass: function (name, construct, local, pargs) // eslint-disable-line no-unused-vars
        {
            var cfg = nit.typedArgsToObj (arguments,
            {
                name: "string",
                construct: "function",
                local: "boolean",
                pargs: "array"
            });

            var self = this;
            var cn = nit.trim (cfg.name || cfg.construct && cfg.construct.name);

            if (!cn)
            {
                self.throw ("error.class_name_required");
            }

            if (nit.is.empty (cfg.pargs) && cfg.construct)
            {
                cfg.pargs = nit.funcArgNames (cfg.construct);
            }

            var subclass = nit.extend (nit.createFunction (cn, true, cfg.pargs), self);

            if (!cfg.local)
            {
                nit.ns (cn, subclass);
                nit.registerClass (subclass);
            }

            if (cfg.construct)
            {
                subclass.construct (cfg.construct);
            }

            if (self[nit.Object.kOnDefineSubclass])
            {
                self[nit.Object.kOnDefineSubclass] (subclass);
            }

            return subclass;
        }
        ,
        defineInnerClass: function (name, superclass, builder, local, pargs) // eslint-disable-line no-unused-vars
        {
            var self = this;
            var cfg = nit.typedArgsToObj (arguments,
            {
                name: "string",
                superclass: "string",
                builder: "function",
                local: "boolean",
                pargs: "array"
            });

            var fqn = self.name + "." + cfg.name;

            cfg.superclass = cfg.superclass || self.INNER_CLASS_TYPE;
            superclass = nit.lookupClass (cfg.superclass);

            if (!superclass)
            {
                self.throw ("error.superclass_not_defined", cfg);
            }

            var innerClass;

            if (nit.is.func (superclass.defineSubclass))
            {
                nit.dpv (self, cfg.name, undefined, true, false);
                innerClass = superclass.defineSubclass (fqn, cfg.local, cfg.pargs);
            }
            else
            {
                innerClass = nit.extend (nit.createFunction (fqn, true, cfg.pargs), superclass);

                if (!cfg.local)
                {
                    nit.dpv (self, cfg.name, innerClass, true, false);
                    nit.registerClass (innerClass);
                }
            }

            if (cfg.builder)
            {
                cfg.builder (innerClass);
            }

            return self;
        }
        ,
        dpv: function (owner, spec, type, defval, configurable, enumerable)
        {
            var cls = this;
            var prop = nit.Object.Property.createFor (cls, spec, type, defval, configurable, enumerable);

            nit.dpv (prop.get, cls.kProperty, prop);
            nit.dp (owner, prop.name, prop);

            return cls;
        }
        ,
        validatePropertyDeclarations: function (props)
        {
            var cls = this;
            var prevParg;
            var arrayParg;

            props.forEach (function (p)
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
        constant: function (name, value)
        {
            return nit.dpg (this, name, function () { return value; }, false, false);
        }
        ,
        staticGetter: function (name, getter, configurable, enumerable)
        {
            var cfg = nit.typedArgsToObj (arguments,
            {
                name: "string",
                getter: "function",
                configurable: "boolean",
                enumerable: "boolean"
            });

            name = cfg.name;
            getter = cfg.getter;
            configurable = nit.is.undef (cfg.configurable) ? false : cfg.configurable;
            enumerable = nit.is.undef (cfg.enumerable) ? true : cfg.enumerable;

            return nit.dpg (this, name, getter, configurable, enumerable);
        }
        ,
        staticMemo: function (name, initializer, configurable, enumerable)
        {
            return nit.memoize.dpg (this, name, initializer, configurable, enumerable);
        }
        ,
        staticProperty: function (spec, type, defval, configurable, enumerable)
        {
            configurable = nit.is.undef (configurable) ? true : configurable;
            enumerable = nit.is.undef (enumerable) ? true : enumerable;

            nit.Object.dpv (this, spec, type || "string", defval, configurable, enumerable);

            return this;
        }
        ,
        staticMethod: function (name, method)
        {
            return nit.dpv (this, name, method, true, false);
        }
        ,
        staticAbstractMethod: function (name)
        {
            return this.staticMethod (name, function ()
            {
                var cls = this;

                cls.throw ("error.static_method_not_implemented", { method: name, class: cls.name });
            });
        }
        ,
        invokeParentStaticMethod: function (name, args)
        {
            var superclass = nit.getSuperclass (this);
            var method = superclass && superclass[name];

            return superclass && method ? nit.invoke ([superclass, method], args) : undefined;
        }
        ,
        invokeParentMethod: function (obj, name, args)
        {
            var superclass = nit.getSuperclass (this);
            var method = superclass && superclass.prototype[name];

            return superclass && method ? nit.invoke ([obj, method], args) : undefined;
        }
        ,
        memo: function (name, initializer, configurable, enumerable)
        {
            var cls = this;

            nit.memoize.dpg (cls.prototype, name, initializer, configurable, enumerable);

            return cls;
        }
        ,
        getter: function (name, getter, configurable, enumerable)
        {
            var cls = this;
            var cfg = nit.typedArgsToObj (arguments,
            {
                name: "string",
                getter: "function",
                configurable: "boolean",
                enumerable: "boolean"
            });

            name = cfg.name;
            getter = cfg.getter;
            configurable = nit.is.undef (cfg.configurable) ? false : cfg.configurable;
            enumerable = nit.is.undef (cfg.enumerable) ? true : cfg.enumerable;

            nit.dpg (cls.prototype, name, getter, configurable, enumerable);

            return cls;
        }
        ,
        property: function (spec, type, defval, configurable, enumerable)
        {
            var cls = this;

            configurable = nit.is.undef (configurable) ? true : configurable;
            enumerable = nit.is.undef (enumerable) ? true : enumerable;

            nit.Object.dpv (cls.prototype, spec, type || "string", defval, configurable, enumerable);

            return cls.validatePropertyDeclarations (nit.Object.getProperties (cls.prototype));
        }
        ,
        method: function (name, method)
        {
            nit.dpv (this.prototype, name, method, true, false);

            return this;
        }
        ,
        abstractMethod: function (name)
        {
            return this.method (name, function ()
            {
                var cls = this.constructor;

                cls.throw ("error.instance_method_not_implemented", { method: name, class: cls.name });
            });
        }
        ,
        categorize: function (prefix)
        {
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

                superclass = cfg.superclass || self;

                if (cfg.superclass
                    && !(superclass = nit.lookupClass (cfg.superclass)))
                {
                    self.throw ("error.superclass_not_defined", cfg);
                }

                if (superclass != self && !nit.is.subclassOf (superclass, self))
                {
                    self.throw ("error.invalid_superclass_type", cfg, { parent: self.name });
                }

                if (cfg.name && prefix)
                {
                    cfg.name = prefix + "." + cfg.name;
                }

                return superclass.defineSubclass (cfg.name, cfg.construct, cfg.local, cfg.pargs);
            }

            nit.dpv (defineSubclass, "name", fqn, true, false);
            nit.ns (fqn, defineSubclass);

            return self;
        }

    }, true, false);


    nit.Object
        .k ("property", "construct", "defvals", "prepareConstructorParams", "preConstruct", "postConstruct", "onDefineSubclass")
        .m ("error.name_required", "The %{property.kind} name is required.")
        .m ("error.value_required", "The %{property.kind} '%{property.name}' is required.")
        .m ("error.class_name_required", "The class name cannot be empty.")
        .m ("error.invalid_property_type", "The property type '%{type}' is invalid.")
        .m ("error.invalid_type", "The %{property.kind} '%{property.name}' was assigned to an invalid type '%{property.type}'.")
        .m ("error.invalid_value_type", "The value of '%{property.name}' should be %{property.type|nit.indefiniteArticle} %{property.type}. (Given: %{value|nit.Object.serialize})")
        .m ("error.invalid_instance_type", "The value of '%{property.name}' should be an instance of %{property.type}. (Given: %{value|nit.Object.serialize})")
        .m ("error.multiple_positional_variadic_args", "Only one positional variadic argument can be defined. Either '%{firstArg}' or '%{secondArg}' must be removed.")
        .m ("error.required_arg_after_optional", "The optional positional argument '%{optionalArg}' cannot be followed by a required argument '%{requiredArg}'.")
        .m ("error.not_implemented", "Method not implemented!")
        .m ("error.instance_method_not_implemented", "The instance method '%{method}' of '%{class}' was not implemented!")
        .m ("error.static_method_not_implemented", "The static method '%{method}' of '%{class}' was not implemented!")
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
                supports: function (type)
                {
                    return nit.lookupClass (type);
                }
                ,
                cast: function (v, type)
                {
                    if (!type)
                    {
                        nit.Object.throw ("error.class_name_required");
                    }

                    var cls = nit.lookupClass (type);

                    if (!cls)
                    {
                        nit.Object.throw ("error.class_not_defined", { name: type });
                    }

                    if (v instanceof cls)
                    {
                        return v;
                    }

                    if (nit.is.str (v) && v.match (nit.CLASS_REF_PATTERN))
                    {
                        cls = nit.lookupClass (v.slice (1));
                        v = undefined;
                    }
                    else
                    if ((nit.is.pojo (v) || v instanceof nit.object)
                        && nit.CLASS_TAG in v)
                    {
                        cls = nit.lookupClass (v[nit.CLASS_TAG]);
                    }

                    if (cls)
                    {
                        return v === undefined ? new cls : new cls (nit.clone (v));
                    }
                }
            });
        })
        .do (function (Object)
        {
            Object
                .registerTypeParser (new Object.PrimitiveTypeParser ("string", "", function (v) { return nit.is.undef (v) ? "" : Object.PrimitiveTypeParser.valueToString (v); }))
                .registerTypeParser (new Object.PrimitiveTypeParser ("boolean", false, function (v) {  v += ""; return v == "true" ? true : (v == "false" ? false : undefined); }))
                .registerTypeParser (new Object.PrimitiveTypeParser ("number", 0, function (v) { return nit.is.num (v) ? +v : undefined; }))
                .registerTypeParser (new Object.PrimitiveTypeParser ("integer", 0, function (v) { return nit.is.int (v) ? +v : undefined; }))
                .registerTypeParser (new Object.PrimitiveTypeParser ("object", function () { return nit.object (); }, function (v) { return typeof v == "object" ? (nit.is.pojo (v) ? nit.object (nit.clone (v)) : v) : undefined; }))
                .registerTypeParser (new Object.PrimitiveTypeParser ("function", undefined, function (v) { return typeof v == "function" ? v : undefined; }))
                .registerTypeParser (new Object.PrimitiveTypeParser ("date", undefined, function (v) { var d = new Date (v); return isNaN (d) ? undefined : d; }))
                .registerTypeParser (new Object.PrimitiveTypeParser ("any", undefined, function (v) { return v; }))
                .registerTypeParser (new Object.ClassTypeParser (), 200)
            ;
        })

        .constant ("PRIMARY_PROPERTY_TYPE", "nit.Object.Property")
        .constant ("INNER_CLASS_TYPE", "nit.Object")
        .staticProperty (nit.Object.kDefvals, "object", {}, false, false)
        .staticGetter ("superclass", true, false, function ()
        {
            return nit.getSuperclass (this);
        })
        .staticMethod ("require", function (name)
        {
            var self = this;

            if (!nit.lookupClass (name))
            {
                self.throw ("error.dependency_not_met", { name: name });
            }

            return self;
        })
        .staticMethod ("getProperties", function (obj, type)
        {
            var self = this;

            type = type || self.PRIMARY_PROPERTY_TYPE;

            var typeCls = nit.is.func (type) ? type : nit.lookupClass (type);

            if (!typeCls)
            {
                self.throw ("error.invalid_property_type", { type: type });
            }

            return nit.each (nit.propertyDescriptors (obj || self.prototype, true), function (p)
            {
                p = p.get && p.get[nit.Object.kProperty];

                return p instanceof typeCls ? p : nit.each.SKIP;
            });
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

            var props = Method.getProperties ();
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
        .staticMethod ("assign", function (obj, values)
        {
            var cls = this;

            if (nit.is.obj (values) && !nit.is.empty (values))
            {
                cls.getProperties (obj).forEach (function (p)
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
        .staticMethod ("serialize", function (v)
        {
            return v === undefined ? "<undefined>" : nit.serialize (v);
        })
        .staticMethod ("prepareConstructorParams", function (prepareConstructorParams)
        {
            return this.staticMethod (nit.Object.kPrepareConstructorParams, prepareConstructorParams);
        })
        .staticMethod ("preConstruct", function (preConstruct)
        {
            return this.staticMethod (nit.Object.kPreConstruct, preConstruct);
        })
        .staticMethod ("postConstruct", function (postConstruct)
        {
            return this.staticMethod (nit.Object.kPostConstruct, postConstruct);
        })
        .staticMethod ("onDefineSubclass", function (onDefineSubclass)
        {
            return this.staticMethod (nit.Object.kOnDefineSubclass, onDefineSubclass);
        })
        .staticMethod ("buildParam", function (obj, prop, params)
        {
            var cls = this;
            var n = prop.name;
            var configKey = obj.constructor.name;
            var defvals = cls[cls.kDefvals];

            if (!(n in params))
            {
                var defval = n in defvals ? defvals[n] : prop.defval;

                defval = nit.get (nit.CONFIG, configKey + "." + n, defval);
                defval = nit.is.func (defval) ? defval (prop, obj) : nit.clone (defval);

                if (prop.array && !nit.is.arr (defval))
                {
                    defval = [];
                }

                params[n] = defval;
            }

            var v = params[n];
            var expand;

            if (nit.is.pojo (v) && nit.is.pojo (expand = v[""]))
            {
                for (var exp in expand)
                {
                    params[n] = nit.expandArg (exp, expand[exp], params);
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
        .staticMethod ("buildConstructorParams", function (obj, args, props) // could return a promise
        {
            var cls = this;
            var arrayParg;
            var pargNames = [];
            var validProps = {};
            var pargProps = props.filter (function (p)
            {
                validProps[p.name] = p;

                if (p.positional)
                {
                    if (p.array)
                    {
                        arrayParg = p;
                    }

                    pargNames.push (p.name);
                }

                return p.positional;
            });

            var params = nit.argsToObj (args, pargNames);
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

            var queue = nit.Queue (params);

            nit.classChain (cls)
                .reverse ()
                .forEach (function (cls)
                {
                    if (cls.hasOwnProperty (cls.kPrepareConstructorParams))
                    {
                        queue.push (function (ctx)
                        {
                            return nit.invoke ([cls, cls.kPrepareConstructorParams], [ctx.result, obj]);
                        });
                    }
                })
            ;

            queue.push (function (ctx)
            {
                params = ctx.result;
            });

            // use a queue to build params so async objects will be resolved sequentially
            nit.each (validProps, function (p)
            {
                queue.push (function ()
                {
                    return cls.buildParam (obj, p, params);
                });
            });

            return queue.run (function () { return params; });
        })
        .staticMethod ("invokeConstructor", function (obj, cls, params, props)
        {
            var k = cls.kConstruct;

            if (cls.hasOwnProperty (k))
            {
                var args = [];

                props.forEach (function (p)
                {
                    if (p.positional)
                    {
                        args.push (params[p.name]);
                    }
                });

                args.push (params);
                obj = nit.invoke ([obj, cls[k]], args, obj);
            }

            return obj;
        })
        .staticMethod ("constructObject", function (obj, args)
        {
            var cls = this;
            var props = cls.getProperties (obj);
            var params = {};
            var queue = nit.Queue (params);
            var chain = nit.classChain (cls);

            chain
                .forEach (function (cls)
                {
                    if (cls.hasOwnProperty (cls.kPreConstruct))
                    {
                        queue.push (function (ctx)
                        {
                            return nit.invoke ([cls, cls.kPreConstruct], [ctx.result, obj]);
                        });
                    }
                })
            ;

            queue
                .push (function (ctx)
                {
                    return cls.buildConstructorParams (obj, args.concat (ctx.result), props);
                })
                .push (function (ctx)
                {
                    params = ctx.result;
                    ctx.result = obj;
                })
            ;

            chain
                .reverse ()
                .forEach (function (cls)
                {
                    queue.push (function (ctx)
                    {
                        return nit.Object.invokeConstructor (ctx.result, cls, params, props);
                    });
                })
            ;

            chain
                .forEach (function (cls)
                {
                    if (cls.hasOwnProperty (cls.kPostConstruct))
                    {
                        queue.push (function (ctx)
                        {
                            return nit.invoke ([cls, cls.kPostConstruct], [ctx.result]);
                        });
                    }
                })
            ;

            return queue.run ();
        })
        .staticMethod ("construct", function (construct)
        {
            return this.staticMethod (nit.Object.kConstruct, construct);
        })
        .method ("t", function ()
        {
            return nit.t.apply (nit, [this].concat (ARRAY (arguments), this));
        })
        .method ("throw", function (code) // eslint-disable-line no-unused-vars
        {
            nit.throw.apply (this, arguments);
        })
        .method ("toPojo", function (primaryPropertiesOnly)
        {
            if (primaryPropertiesOnly)
            {
                var self = this;
                var pojo = {};

                self.constructor
                    .getProperties ()
                    .forEach (function (p)
                    {
                        var name = p.name;
                        var val = self[name];

                        pojo[name] = val && nit.is.func (val.toPojo) ? val.toPojo (primaryPropertiesOnly) : val;
                    })
                ;

                return pojo;
            }
            else
            {
                return nit.clone (this);
            }
        })
    ;


    nit.Object.defineSubclass ("nit.Constraint")
        .k ("validate")
        .m ("error.validation_failed", "The value '%{value}' is invalid.")
        .m ("error.invalid_target_value_type", "The constraint value type '%{type} is invalid.")
        .m ("error.invalid_target_value", "The constraint cannot be applied to '%{value|nit.Object.serialize}'.")
        .constant ("VALIDATE_ALL", false)
        .categorize ()
        .defineInnerClass ("ValidationContext", function (ValidationContext)
        {
            ValidationContext
                .property ("value", "any")
                .property ("owner", "any") // the owner object of the property
                .property ("property", "any") // the property
                .property ("constraint", "nit.Constraint")
            ;
        })
        .staticMethod ("appliesTo", function (types)
        {
            var cls = this;

            types = ARRAY (arguments).map (function (type)
            {
                if (!nit.is[type])
                {
                    cls.throw ("error.invalid_target_value_type", { type: type });
                }

                return type;
            });

            return this.defaults ("applicableTypes", types);
        })
        .staticMethod ("throws", function (code, message)
        {
            return this
                .defaults ("code", code)
                .m (code, message)
            ;
        })
        .staticMethod ("validate", function (validate)
        {
            return this.staticMethod (nit.Constraint.kValidate, validate);
        })
        .property ("name")
        .property ("code", "string", "error.validation_failed")
        .property ("message", "string")
        .property ("applicableTypes...")
        .construct (function ()
        {
            var self = this;

            self.name = self.name || self.constructor.name.split (".").pop ();
        })
        .method ("applicableTo", function (type)
        {
            var types = this.applicableTypes;

            return !types.length || types.includes (type);
        })
        .method ("validate", function (value, ctx)
        {
            var constraint = this;
            var cls = constraint.constructor;
            var validate = cls[cls.kValidate];

            if (constraint.applicableTypes.length && !constraint.applicableTypes.some (function (type) { return nit.is[type] (value); }))
            {
                constraint.throw ("error.invalid_target_value", { value: value });
            }

            if (!validate)
            {
                constraint.throw ("error.not_implemented");
            }

            ctx.constraint = constraint;

            return nit.Queue ()
                .push (function ()
                {
                    return validate.call (cls, value, ctx);
                })
                .push (function (q)
                {
                    if (!q.result)
                    {
                        var message = (ctx.constraint.message || cls.t (ctx.constraint.code, ctx)) + " (Class: " + ctx.owner.constructor.name + ")";

                        ctx.constraint.throw ({ code: ctx.constraint.code, message: message, owner: ctx.owner }, ctx);
                    }
                })
                .run ()
            ;
        })
    ;


    nit.defineConstraint ("nit.constraints.Exclusive")
        .constant ("VALIDATE_ALL", true)
        .throws ("error.exclusive_fields_specified", "Exactly one of following fields must be specified: %{constraint.fields.join (', ')}. (%{specified} specified)")
        .property ("<fields...>")
        .property ("optional", "boolean")
        .validate (function (value, ctx)
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


    nit.defineConstraint ("nit.constraints.Choice")
        .throws ("error.invalid_choice", "The value of '%{property.name}' is not a valid choice. (Given: '%{value}', Allowed: %{constraint.choiceValues.join (', ')})")
        .property ("<choices...>", "any") // A choice can either be a value or an object a 'value' field.
        .getter ("choiceValues", function ()
        {
            return this.choices.map (function (c)
            {
                return nit.is.obj (c) ? c.value : c;
            });
        })
        .validate (function (value, ctx)
        {
            return ctx.constraint.choiceValues.some (function (v)
            {
                return v === value;
            });
        });


    nit.defineConstraint ("nit.constraints.Min")
        .throws ("error.less_than_min", "The minimum value of '%{property.name}' is '%{constraint.min}'.")
        .property ("<min>", "integer")
        .validate (function (value, ctx)
        {
            return value * 1 >= ctx.constraint.min;
        });


    nit.defineConstraint ("nit.constraints.Subclass")
        .throws ("error.not_a_subclass", "The value of '%{property.name}' is not a subclass of '%{constraint.superclass}'.")
        .m ("error.invalid_superclass", "The superclass '%{superclass}' is invalid.")
        .property ("<superclass>", "string")
        .validate (function (value, ctx)
        {
            var superclass = nit.lookupClass (ctx.constraint.superclass);

            if (!superclass)
            {
                this.throw ("error.invalid_superclass", ctx.constraint);
            }

            return nit.is.subclassOf (nit.is.str (value) ? nit.lookupClass (value) : value, superclass);
        });


    nit.defineConstraint ("nit.constraints.Type")
        .throws ("error.invalid_type", "The value of '%{property.name}' should be of one of the following type: %{constraint.types.join (', ')}.")
        .property ("<types...>", "string", "The allowed types.")
        .validate (function (value, ctx)
        {
            return ctx.constraint
                .types
                .some (function (type)
                {
                    return nit.find (nit.Object.TYPE_PARSERS, function (p) { return p.supports (type); });
                })
            ;
        });


    nit.Object
        .defineSubclass ("nit.Field", function (spec, type, description, defval) // eslint-disable-line no-unused-vars
        {
            var field = this;
            var cls = field.constructor;
            var cfg = nit.typedArgsToObj (arguments,
            {
                spec: "string",
                type: "string",
                description: "string",
                defval: "any"
            });

            var prop = nit.Object.Property.createFor (cls, { kind: field.kind, configurable: field.configurable, enumerable: field.enumerable }, cfg);

            prop.get.setDescriptor (field);
            nit.assign (field, prop);
            field.cast = nit.Field.cast;
            nit.dpv (field, "__cast", prop.cast, true, false);
            nit.dpv (field.get, nit.Object.kProperty, field);
            nit.dpv (field.set, nit.Object.kProperty, field);
        })
        .m ("error.constraint_not_defined", "The constraint '%{name}' was not defined.")
        .m ("error.inapplicable_constraint", "The constraint '%{constraint}' cannot be applied to the field '%{field}'.")
        .property ("<spec>")
        .property ("[type]", "string", "string")
        .property ("[description]")
        .property ("[defval]", "any")
        .property ("required", "boolean")
        .property ("name")
        .property ("positional", "boolean")
        .property ("array", "boolean")
        .property ("enumerable", "boolean", true)
        .property ("configurable", "boolean")
        .property ("kind", "string", "field")
        .property ("get", "function")
        .property ("set", "function")
        .property ("getter", "function")
        .property ("setter", "function")
        .property ("cast", "function")
        .property ("primitive", "boolean") // should not be set manually
        .property ("constraints...", "nit.Constraint")

        .staticMethod ("cast", function (v, owner)
        {
            v = this.__cast (v, owner);
            this.validate (v, owner);

            return v;
        })

        .method ("addConstraint", function (name)
        {
            var self = this;
            var cls = nit.lookupSubclassOf (nit.Constraint, name);

            if (!cls)
            {
                self.throw ("error.constraint_not_defined", { name: name });
            }

            var cons = nit.new (cls, ARRAY (arguments).slice (1));

            if (!cons.applicableTo (self.type))
            {
                self.throw ("error.inapplicable_constraint", { constraint: name, field: self.name });
            }

            self.constraints.push (cons);

            return self;
        })
        .method ("getConstraint", function (name)
        {
            name = nit.pascalCase (name);

            return nit.find (this.constraints, "name", name);
        })
        .method ("bind", function (owner)
        {
            var field = this;

            nit.dp (owner, field.name, field);

            return field;
        })
        .method ("validate", function (value, owner)
        {
            var self = this;

            self.constraints.forEach (function (cons)
            {
                var consCls = cons.constructor;

                if (consCls.VALIDATE_ALL || !nit.is.empty (value) || self.required)
                {
                    var ctx = new nit.Constraint.ValidationContext (
                    {
                        value: value,
                        owner: owner,
                        property: self
                    });

                    cons.validate (value, ctx);
                }
            });
        })
    ;


    nit.Object.defineSubclass ("nit.Class")
        .m ("error.no_field_defined", "No field was defined.")
        .categorize ()
        .constant ("PRIMARY_PROPERTY_TYPE", "nit.Field")
        .constant ("INNER_CLASS_TYPE", "nit.Class")
        .staticMethod ("ns", function (name)
        {
            var cls = this;
            var ns = nit.defineClass (cls.name + "." + name, true);

            nit.dpv (cls, name, ns, true, false);

            return ns;
        })
        .staticMethod ("field", function (spec, type, description, defval) // eslint-disable-line no-unused-vars
        {
            nit.new (nit.Field, arguments).bind (this.prototype);

            return this;
        })
        .staticMethod ("getField", function (name)
        {
            var self = this;

            return nit.find (self.getProperties (), "name", name);
        })
        .staticMethod ("constraint", function (name) // eslint-disable-line no-unused-vars
        {
            var self = this;
            var field = self.getProperties ().pop ();

            if (!field)
            {
                self.throw ("error.no_field_defined");
            }

            field.addConstraint.apply (field, arguments);

            return self;
        })
    ;


    nit.ns.initializer = function (name)
    {
        return nit.lookupClass (name) || nit.defineClass (name);
    };


    nit.defineClass ("nit.Error")
        .staticMemo ("STACK_SEARCH_PATTERN", function ()
        {
            return nit.parseRegExp ("/^\\s*at\\s(new\\s)?" + nit.escapeRegExp (this.name) + "\\s\\(eval.*\\.createFunction/");
        })
        .constant ("NATIVE_ERROR_PROPERTIES", nit.keys (new Error, true))
        .constant ("CODE", "")
        .constant ("MESSAGE", "")
        .do (function (nit_Error)
        {
            var errorProps = nit.propertyDescriptors (Error, true);
            var classProps = nit.propertyDescriptors (nit.Class, true);

            nit.each (classProps, function (p, n)
            {
                if (!(n in errorProps))
                {
                    nit.dp (nit_Error, n, p);
                }

            }, true);

        })
        .categorize ()
        .extend (Error)
        .do (function (nit_Error)
        {
            var errorProps = nit.propertyDescriptors (Error.prototype, true);
            var classProps = nit.propertyDescriptors (nit.Class.prototype, true);

            nit.each (classProps, function (p, n)
            {
                if (!(n in errorProps))
                {
                    nit.dp (nit_Error.prototype, n, p);
                }

            }, true);

            nit_Error.prototype.name = nit_Error.name;
        })
        .staticMethod ("code", function (code)
        {
            return this.constant ("CODE", code);
        })
        .staticMethod ("message", function (message)
        {
            return this.constant ("MESSAGE", message);
        })
        .onDefineSubclass (function (subclass)
        {
            subclass.prototype.name = subclass.name;
        })
        .construct (function (args)
        {
            var self = this;
            var cls = self.constructor;
            var message;

            if (cls == nit.Error && nit.is.str (args[0]))
            {
                message = self.t (args[0], args);
            }
            else
            {
                message = self.t (self.message);
            }

            var error = new Error (message);

            Object.setPrototypeOf (error, cls.prototype);

            if (Error.captureStackTrace)
            {
                Error.captureStackTrace (error, cls);
            }
            else
            {
                var stack = error.stack.split ("\n");
                var first = stack.shift ();
                var lines = [first];
                var found = false;

                nit.each (stack, function (s)
                {
                    if (s.match (cls.STACK_SEARCH_PATTERN))
                    {
                        found = true;
                    }
                    else
                    if (found)
                    {
                        lines.push (s);
                    }
                });

                if (found)
                {
                    error.stack = lines.join ("\n");
                }
            }

            nit.each (cls.NATIVE_ERROR_PROPERTIES, function (p)
            {
                self[p] = error[p];
            });

            nit.assign (error, self);

            if (self.code)
            {
                error.stack += "\nCode: " + self.code;
            }

            return error;
        })
        .field ("message", "string", "The error message.", function (prop, owner)
        {
            return owner.constructor.MESSAGE || owner.code;
        })
        .field ("code", "string", "The error code.", function (prop, owner)
        {
            var ownerCls = owner.constructor;

            return ownerCls.CODE || (ownerCls != nit.Error ? "error." + nit.snakeCase (ownerCls.name.split (".").pop ()) : "");
        })
    ;


    nit.defineClass ("nit.Model")
        .constant ("PROPERTY_TYPE", "nit.Model.Field")
        .categorize ()

        .defineInnerClass ("Field", "nit.Field", function (Field)
        {
            Field
                .postConstruct (function (field)
                {
                    nit.dpv (field, "__set", field.set, true, false);

                    field.cast = field.__cast;
                    field.set = function (v)
                    {
                        var owner = this;
                        var uncheckedProp = field.uncheckedProp;

                        if (!owner.hasOwnProperty (uncheckedProp))
                        {
                            nit.dpv (owner, uncheckedProp, v, true, false);
                        }
                        else
                        {
                            owner[uncheckedProp] = v;
                        }
                    };
                })
                .memo ("uncheckedProp", function ()
                {
                    return "$__" + this.name + "Unchecked";
                })
                .method ("validate", function (value, owner, ctx) // owner must be a model
                {
                    var ValidationContext = owner.constructor.ValidationContext;
                    var field = this;

                    ctx = ctx instanceof ValidationContext ? ctx : new ValidationContext (ctx);

                    return nit.Queue ()
                        .push (function ()
                        {
                            field.__set.call (owner, value);
                        })
                        .push (nit.each (field.constraints, function (cons)
                        {
                            return function ()
                            {
                                var consCls = cons.constructor;

                                if (consCls.VALIDATE_ALL || !nit.is.empty (value) || field.required)
                                {
                                    ctx.value = value;
                                    ctx.owner = owner;
                                    ctx.property = field;

                                    return cons.validate (value, ctx);
                                }
                            };
                        }))
                        .failure (function (qc)
                        {
                            var error = qc.error;
                            var source = nit.get (error, "context.source");

                            throw new nit.Model.FieldValidationFailure (
                                field.name,
                                source instanceof nit.Constraint ? source.constructor.name : "",
                               { code: error.code, message: error.message }
                            );
                        })
                        .run ()
                    ;
                })
            ;
        })
        .defineInnerClass ("FieldValidationFailure", "nit.Error", function (FieldValidationFailure)
        {
            FieldValidationFailure
                .field ("<field>", "string", "The field that failed the validation.")
                .field ("[constraint]", "string", "The constraint that caused error.")
            ;
        })
        .defineInnerClass ("ModelValidationFailure", "nit.Error", function (ModelValidationFailure)
        {
            ModelValidationFailure
                .message ("The model validation failed.")
                .field ("<failures...>", "nit.Model.FieldValidationFailure", "The field validation failures.")
            ;
        })
        .defineInnerClass ("ValidationContextBase", function (ValidationContextBase)
        {
            ValidationContextBase.extend (nit.Constraint.ValidationContext);
        })
        .staticMethod ("defineValidationContext", function (builder)
        {
            return this.defineInnerClass ("ValidationContext", "nit.Model.ValidationContextBase", builder);
        })
        .staticMethod ("field", function (spec, type, description, defval) // eslint-disable-line no-unused-vars
        {
            nit.new (nit.Model.Field, arguments).bind (this.prototype);

            return this;
        })
        .do (function ()
        {
            this.defineValidationContext ();
        })

        .method ("validate", function (ctx)
        {
            var failures = [];
            var self = this;
            var ValidationContext = self.constructor.ValidationContext;

            ctx = ctx instanceof ValidationContext ? ctx : new ValidationContext (ctx);

            return nit.Queue ()
                .push (nit.each (self.constructor.getProperties (), function (f)
                {
                    return nit.Queue ()
                        .push (function ()
                        {
                            var val = self[f.uncheckedProp];

                            return f.validate (val, self, ctx);
                        })
                        .failure (function (qc)
                        {
                            failures.push (qc.error);
                        })
                    ;
                }))
                .run (function ()
                {
                    if (failures.length)
                    {
                        throw new nit.Model.ModelValidationFailure ({ failures: failures });
                    }
                })
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
