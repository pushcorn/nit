module.exports = function (nit, Self)
{
    const { describe, expect, it } = global;

    // A test plan starts with a call of `should`, `can` or `reset`.
    // A test is executed when `commit` is called.

    return (Self = nit.defineClass ("nit.test.Strategy"))
        .categorize ()

        .field ("description", "string", "The test suite description.")
        .field ("message", "string", "The test message.")
        .field ("befores...", "function", "The before tasks run before test.")
        .field ("afters...", "function", "The after tasks run after the test is being finalized.")
        .field ("inputs...", "any", "The test inputs.")
        .field ("result", "any", "The expected return value.")
        .field ("error", "any", "The last error.")

        .constant ("TRANSFORMS",
        {
            format: function (v)
            {
                if (nit.is.str (v))
                {
                    return nit.toJson (v);
                }
                else
                {
                    return Self.serialize (v);
                }
            }
            ,
            formatArgs: function (args)
            {
                return args
                    .map (a => Self.TRANSFORMS.format (a))
                    .join (", ")
                ;
            }
        })
        .staticMethod ("serialize", function (v)
        {
            return v === undefined ? "<undefined>" : (v === null ? "<null>" : nit.serialize (v));
        })
        .constant ("TEMPLATE_CONFIG",
        {
            openTag: "%{",
            closeTag: "}",
            serialize: Self.serialize,
            transforms:
            {
                nit,
                ...Self.TRANSFORMS
            }
        })
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
                .field ("[root]", "nit.Dir", "The root directory.", function ()
                {
                    return nit.path.join (nit.os.tmpdir (), nit.uuid ());
                })
                .construct (function (name, root)
                {
                    root.create ();

                    root.writeFile ("package.json", nit.toJson ({ name }));
                })
            ;
        })
        .defineInnerClass ("Mock")

        .property ("lastSnapshot", "object")
        .property ("thisOnly", "boolean")
        .property ("app", "nit.test.Strategy.App")
        .property ("dir", "string") // working directory
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

                        self.invocations.push (new Self.Invocation ({ args, result }));

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
        .staticMethod ("render", function (tmpl, data)
        {
            return nit.Template.render (tmpl, data, Self.TEMPLATE_CONFIG);
        })
        .staticMethod ("invoke", function (strategy, path, args)
        {
            let [p, m] = nit.kvSplit (path, ".", true);
            let target = nit.get (strategy, p);

            return target[m].apply (target, args);
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
                    let val = self[name];

                    if (nit.is.arr (val))
                    {
                        snapshot[name] = val.slice ();
                    }
                    else
                    {
                        snapshot[name] = val;
                    }
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
        .method ("useApp", function (name, root)
        {
            this.app = new Self.App (name, root);

            return this;
        })
        .method ("chdir", function (dir)
        {
            this.dir = dir;

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
            this.mocks.push (new Self.Mock (...arguments));

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
            this.resultValidator = new Self.TypeValidator ({ expected: type });

            return this;
        })
        .method ("returns", function (result)
        {
            this.result = result;
            this.resultValidator = new Self.ValueValidator ({ expected: result });

            return this;
        })
        .method ("throws", function (error)
        {
            this.result = error;
            this.resultValidator = new Self.ErrorValidator ({ expected: error });

            return this;
        })
        .method ("expecting", function (message, value, valueGetter)
        {
            message = Self.render (message, { value });

            let expector = new Self.Expector (message, new Self.ValueValidator ({ expected: value }), function (strategy)
            {
                return valueGetter (strategy);
            });

            this.expectors.push (expector);

            return this;
        })
        .method ("expectingPropertyToBe", function (property, value)
        {
            let message = Self.render ("the property '%{property}' to be %{value|format}", { property, value });
            let expector = new Self.Expector (message, new Self.ValueValidator ({ expected: value }), function (strategy)
            {
                return nit.get (strategy, property);
            });

            this.expectors.push (expector);

            return this;
        })
        .method ("expectingPropertyToBeOfType", function (property, type)
        {
            let message = Self.render ("the property '%{property}' to be of type '%{type}'", { property, type });
            let expector = new Self.Expector (message, new Self.TypeValidator ({ expected: type }), function (strategy)
            {
                return nit.get (strategy, property);
            });

            this.expectors.push (expector);

            return this;
        })
        .method ("expectingMethodToReturnValue", function (path, retval, ...args)
        {
            let message = Self.render ("the method %{path} () to return %{retval|format} when invoked with (%{args|formatArgs})", { path, args, retval });
            let expector = new Self.Expector (message, new Self.ValueValidator ({ expected: retval }), function (strategy)
            {
                return Self.invoke (strategy, path, args);
            });

            this.expectors.push (expector);

            return this;
        })
        .method ("expectingMethodToReturnValueOfType", function (path, type, ...args)
        {
            let message = Self.render ("the method %{path} () to return a value of type '%{type}' when invoked with (%{args|formatArgs})", { path, args, type });
            let expector = new Self.Expector (message, new Self.TypeValidator ({ expected: type }), function (strategy)
            {
                return Self.invoke (strategy, path, args);
            });

            this.expectors.push (expector);

            return this;
        })
        .method ("expectingMethodToThrow", function (path, error, ...args)
        {
            let message = Self.render ("the method %{path} () to throw '%{error}' when invoked with (%{args|formatArgs})", { path, args, error });
            let expector = new Self.Expector (message, new Self.ErrorValidator ({ expected: error }), function (strategy)
            {
                return Self.invoke (strategy, path, args);
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
                    let message = Self.render (self.message, data);

                    it (message, async () =>
                    {
                        nit.assign (self, snapshot);

                        if (self.app)
                        {
                            process.chdir (self.app.root.path);
                        }
                        else
                        if (self.dir)
                        {
                            process.chdir (self.dir);
                        }

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

                            if (self.app || self.dir)
                            {
                                process.chdir (nit.CWD);
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

            return self.reset ();
        })
    ;
};
