module.exports = function (nit, Strategy)
{
    const { describe, expect, it } = global;

    // A test plan starts with a call of `should`, `can` or `reset`.
    // A test is executed when `commit` is called.

    return (Strategy = nit.defineClass ("nit.test.Strategy"))
        .categorize ()

        .field ("description", "string", "The test suite description.")
        .field ("message", "string", "The test message.")
        .field ("befores...", "function", "The before tasks run before test.")
        .field ("afters...", "function", "The after tasks run after the test is being finalized.")
        .field ("inputs...", "any", "The test inputs.")
        .field ("result", "any", "The expected return value.")
        .field ("error", "any", "The last error.")

        .defineInnerClass ("IValidator", IValidator =>
        {
            IValidator.abstractMethod ("validate", /* istanbul ignore next */ function (strategy, value) // eslint-disable-line no-unused-vars
            {
            });
        })
        .defineInnerClass ("Expector", Expector =>
        {
            Expector
                .field ("<message>", "string", "The test message.")
                .field ("<validator>", "nit.test.Strategy.IValidator", "The validator.")
                .field ("<valueGetter>", "function", "A callback function that returns the value to be checked.")
                .method ("validate", async function (strategy)
                {
                    this.validator.validate (strategy, await this.valueGetter (strategy));
                })
            ;
        })
        .defineInnerClass ("App", App =>
        {
            App
                .field ("[name]", "string", "The app name.", "test-app")
                .field ("[root]", "nit.Dir", "The root directory.",
                {
                    defval: function ()
                    {
                        return nit.path.join (nit.os.tmpdir (), nit.uuid ());
                    }
                })
                .construct (function (name, root)
                {
                    root.create ();

                    let pkg = nit.new ("nit.File", root.join ("package.json"));

                    pkg.write (nit.toJson ({ name }));
                })
            ;
        })
        .defineInnerClass ("Mock")

        .property ("lastSnapshot", "object")
        .property ("thisOnly", "boolean")
        .property ("app", "nit.test.Strategy.App")
        .property ("resultValidator", "nit.test.Strategy.IValidator")
        .property ("expectors...", "nit.test.Strategy.Expector")
        .property ("mocks...", "nit.test.Strategy.Mock")

        .defineInnerClass ("ValueValidator", "nit.test.Strategy.IValidator", ValueValidator =>
        {
            ValueValidator
                .field ("expected", "any", "The expected value.")
                .method ("validate", function (strategy, value)
                {
                    if (arguments.length == 1 && strategy.error)
                    {
                        throw strategy.error;
                    }

                    let expected = this.expected;
                    let result = arguments.length > 1 ? value : strategy.result;

                    if (!(result instanceof RegExp) && expected instanceof RegExp)
                    {
                        expect (result + "").toMatch (expected);
                    }
                    else
                    if (typeof result == "object")
                    {
                        expect (result).toEqual (expected);
                    }
                    else
                    {
                        expect (result).toBe (expected);
                    }
                })
            ;
        })
        .defineInnerClass ("TypeValidator", "nit.test.Strategy.IValidator", TypeValidator =>
        {
            TypeValidator
                .field ("expected", "any", "The result type.")
                    .constraint ("type", "string", "function")
                .method ("validate", function (strategy, value)
                {
                    if (arguments.length == 1 && strategy.error)
                    {
                        throw strategy.error;
                    }

                    let expected = this.expected;
                    let result = arguments.length > 1 ? value : strategy.result;

                    if (nit.is.func (expected))
                    {
                        expect (result).toBeInstanceOf (expected);
                    }
                    else
                    if (nit.is[expected])
                    {
                        expect (nit.is[expected] (result)).toBe (true);
                    }
                    else
                    {
                        expect (nit.is.obj (result) ? result.constructor.name : typeof result).toBe (expected);
                    }
                })
            ;
        })
        .defineInnerClass ("ErrorValidator", "nit.test.Strategy.IValidator", ErrorValidator =>
        {
            ErrorValidator
                .m ("error.did_not_throw", "The test did not throw an error.")
                .field ("expected", "any", "The result type.")
                    .constraint ("type", "RegExp", "string")
                .method ("validate", function (strategy, value)
                {
                    if (arguments.length == 1 && !strategy.error)
                    {
                        this.throw ("error.did_not_throw");
                    }

                    let expected = this.expected;
                    let error = arguments.length > 1 ? value : strategy.error;

                    if (expected instanceof RegExp)
                    {
                        expect (error.message).toMatch (expected);
                    }
                    else
                    if (nit.trim (error.code).match (nit.ERROR_CODE_PATTERN))
                    {
                        expect (error.code).toBe (expected);
                    }
                    else
                    {
                        expect (error.message).toBe (expected);
                    }
                })
            ;
        })
        .defineInnerClass ("Invocation", Invocation =>
        {
            Invocation
                .field ("args...", "any", "The arguments of the invocation.")
                .field ("result", "any", "The invocation result.")
            ;
        })
        .defineInnerClass ("Mock", function (Mock)
        {
            Mock
                .field ("<object>", "any", "The owner of the method to be mocked.")
                    .constraint ("type", "string", "object", "function")
                .field ("<method>", "string", "The method name.")
                .field ("[retval]", "any", "The mock function or the value to be returned.")

                .property ("invocations...", "nit.test.Strategy.Invocation")
                .property ("fn", "function") // the mocked function
                .property ("target", "any") // the object that owns the method being mocked
                .property ("targetMethod", "function") // the orignal method

                .construct (function (object, method, retval)
                {
                    this.fn = nit.is.func (retval) ? retval : function () { return retval; };
                })
                .method ("apply", function (strategy)
                {
                    let self = this;

                    let { object, method } = self;

                    self.target = nit.is.str (object) ? nit.get (strategy, object) : object;
                    self.targetMethod = self.target[method];

                    self.target[method] = function (...args)
                    {
                        let result = self.fn (...args);

                        self.invocations.push (new Strategy.Invocation ({ args, result }));

                        return result;
                    };

                    return self;
                })
                .method ("restore", function ()
                {
                    this.target[this.method] = this.targetMethod;
                })
            ;
        })
        .staticMethod ("format", function (v)
        {
            if (nit.is.str (v))
            {
                return nit.toJson (v);
            }
            else
            {
                return nit.Object.serialize (v);
            }
        })
        .staticMethod ("test", function (test)
        {
            return this.method ("test", test);
        })
        .staticMethod ("getPropertyNames", function ()
        {
            return this.getProperties ()
                .map (p => p.name)
                .concat (this.getProperties (null, nit.Object.Property)
                    .map (p => p.name)
                    .filter (n => n != "lastSnapshot")
                )
            ;
        })

        .postConstruct (function (strategy)
        {
            strategy.description = strategy.description || "[Untitled Test]";
            strategy.snapshot ();
        })
        .abstractMethod ("test")

        .method ("snapshot", function (returnOnly)
        {
            let self = this;
            let snapshot = {};

            self.constructor.getPropertyNames ()
                .forEach (name =>
                {
                    snapshot[name] = self[name];
                })
            ;

            if (returnOnly)
            {
                return snapshot;
            }
            else
            {
                self.lastSnapshot = {};
                nit.assign (self.lastSnapshot, snapshot);

                return self;
            }
        })

        .method ("reset", function (message)
        {
            let snapshot = this.lastSnapshot;

            message = message || this.message;

            for (let name of this.constructor.getPropertyNames ())
            {
                let val = snapshot[name];

                if (nit.is.arr (val))
                {
                    this[name] = val.slice ();
                }
                else
                {
                    this[name] = val;
                }
            }

            this.resultValidator = null;
            this.message = message;

            return this;
        })
        .method ("withApp", function (name)
        {
            this.app = new Strategy.App (name);

            return this;
        })
        .method ("only", function ()
        {
            this.thisOnly = true;

            return this;
        })
        .method ("should", function (message)
        {
            return this.reset (message && "should " + message);
        })
        .method ("can", function (message)
        {
            return this.reset (message && "can " + message);
        })
        .method ("mock", function ()
        {
            this.mocks.push (new Strategy.Mock (...arguments));

            return this;
        })
        .method ("before", function (cb)
        {
            this.befores.push (cb);

            return this;
        })
        .method ("after", function (cb)
        {
            this.afters.push (cb);

            return this;
        })
        .method ("given", function (...args)
        {
            this.inputs.push (args);

            return this;
        })
        .method ("returnsInstanceOf", function (type)
        {
            this.result = type;
            this.resultValidator = new Strategy.TypeValidator ({ expected: type });

            return this;
        })
        .method ("returns", function (result)
        {
            this.result = result;
            this.resultValidator = new Strategy.ValueValidator ({ expected: result });

            return this;
        })
        .method ("throws", function (error)
        {
            this.result = error;
            this.resultValidator = new Strategy.ErrorValidator ({ expected: error });

            return this;
        })
        .method ("expectingPropertyValue", function (property, value)
        {
            let message = nit.format ("the property '%{property}' to be %{value|nit.test.Strategy.format}", { property, value });
            let expector = new Strategy.Expector (message, new Strategy.ValueValidator ({ expected: value }), function (strategy)
            {
                return nit.get (strategy, property);
            });

            this.expectors.push (expector);

            return this;
        })
        .method ("expectingPropertyType", function (property, type)
        {
            let message = nit.format ("the property '%{property}' to be of type '%{type}'", { property, type });
            let expector = new Strategy.Expector (message, new Strategy.TypeValidator ({ expected: type }), function (strategy)
            {
                return nit.get (strategy, property);
            });

            this.expectors.push (expector);

            return this;
        })
        .method ("expectingMethodReturns", function (path, retval, args)
        {
            args = nit.array (args);

            let message = nit.format ("the method %{path} () to return %{retval|nit.test.Strategy.format} when invoked with (%{args.join (', ')})", { path, args, retval });
            let expector = new Strategy.Expector (message, new Strategy.ValueValidator ({ expected: retval }), function (strategy)
            {
                let [p, m] = nit.kvSplit (path, ".", true);
                let target = nit.get (strategy, p);

                return target[m].apply (target, args);
            });

            this.expectors.push (expector);

            return this;
        })
        .method ("commit", function ()
        {
            let self = this;

            if (!self.inputs.length)
            {
                self.inputs.push ([]);
            }

            let snapshot = self.snapshot (true);

            (self.thisOnly ? describe.only : describe) (self.description, () =>
            {
                for (let args of self.inputs)
                {
                    let data = { args, result: self.result };
                    let message = nit.format (self.message, data);

                    it (message, async () =>
                    {
                        nit.assign (self, snapshot);

                        try
                        {
                            for (let before of self.befores)
                            {
                                await before.apply (self, args);
                            }

                            for (let mock of self.mocks)
                            {
                               mock.apply (self);
                            }

                            self.result = await self.test (...args);
                        }
                        catch (e)
                        {
                            self.error = e;
                        }

                        try
                        {
                            if (self.resultValidator)
                            {
                                self.resultValidator.validate (self);
                            }
                            else
                            if (self.error)
                            {
                                throw self.error;
                            }

                            for (let after of self.afters)
                            {
                                await after.apply (self, args);
                            }
                        }
                        finally
                        {
                            for (let mock of self.mocks)
                            {
                                mock.restore ();
                            }
                        }
                    });


                    for (let expector of self.expectors)
                    {
                        it ("  +--> expecting " + expector.message, async () =>
                        {
                            await expector.validate (self);
                        });
                    }
                }
            });

            return self;
        })
    ;
};