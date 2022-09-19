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
        .field ("ups...", "function", "Tasks to run before the strategy's up.")
        .field ("downs...", "function", "Tasks to run after the strategy's down.")
        .field ("inputs...", "any", "The test inputs.")
        .field ("args...", "any", "The arguments passed to the test function.")
        .field ("result", "any", "The expected return value.")
        .field ("error", "any", "The last error.")

        .constant ("STACK_LINE_PATTERN", /.*(\(([^)]+):\d+:\d+\)).*/)
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
        .defineInnerClass ("Validator", Validator =>
        {
            Validator
                .field ("<sourceLine>", "string")
                .staticMethod ("onValidate", function (onValidate)
                {
                    this.method ("onValidate", onValidate);
                })
                .abstractMethod ("onValidate", /* istanbul ignore next */ function (strategy, value) {}) // eslint-disable-line no-unused-vars
                .method ("validate", function (strategy, value) // eslint-disable-line no-unused-vars
                {
                    try
                    {
                        this.onValidate.apply (this, arguments);
                    }
                    catch (e)
                    {
                        throw Self.addSourceLineToStack (e, this.sourceLine);
                    }
                })
            ;
        })
        .defineInnerClass ("Expector", Expector =>
        {
            Expector
                .field ("<message>", "string", "The test message.")
                .field ("<validator>", "nit.test.Strategy.Validator", "The validator.")
                .field ("<valueGetter>", "function", "A callback function that returns the value to be checked.")
                .method ("validate", async function (strategy)
                {
                    this.validator.validate (strategy, await this.valueGetter (strategy));
                })
            ;
        })
        .defineInnerClass ("Application", Application =>
        {
            Application
                .field ("[name]", "string", "The application name.", "test-app")
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

        .property ("testId", "string", { hidden: true })
        .property ("lastSnapshot", "object", { hidden: true })
        .property ("thisOnly", "boolean")
        .property ("application", "nit.test.Strategy.Application")
        .property ("dir", "string") // working directory
        .property ("resultValidator", "nit.test.Strategy.Validator")
        .property ("expectors...", "nit.test.Strategy.Expector")
        .property ("mocks...", "nit.test.Strategy.Mock")

        .defineInnerClass ("ValueValidator", "nit.test.Strategy.Validator", ValueValidator =>
        {
            ValueValidator
                .field ("expected", "any", "The expected value.")
                .onValidate (function (strategy, value)
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
        .defineInnerClass ("TypeValidator", "nit.test.Strategy.Validator", TypeValidator =>
        {
            TypeValidator
                .field ("expected", "any", "The result type.")
                    .constraint ("type", "string", "function")
                .onValidate (function (strategy, value)
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
        .defineInnerClass ("ErrorValidator", "nit.test.Strategy.Validator", ErrorValidator =>
        {
            ErrorValidator
                .m ("error.did_not_throw", "The test did not throw an error.")
                .field ("expected", "any", "The result type.")
                    .constraint ("type", "RegExp", "string")
                .onValidate (function (strategy, value)
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
                .field ("error", "Error", "The invocation error.")
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
                .property ("strategy", "nit.test.Strategy")
                .property ("applied", "boolean")

                .construct (function (object, method, retval)
                {
                    this.fn = nit.is.func (retval) ? retval : function () { return retval; };
                })
                .method ("apply", function (strategy)
                {
                    let self = this;

                    if (self.applied)
                    {
                        return;
                    }

                    let { object, method } = self;

                    self.target = nit.is.str (object) ? nit.get (strategy, object) : object;

                    if (!nit.is.obj (self.target) && !nit.is.func (self.target))
                    {
                        self.target = undefined;

                        return;
                    }

                    self.strategy = strategy;
                    self.targetMethod = self.target[method];
                    self.applied = true;

                    self.target[method] = function (...args)
                    {
                        return nit.Queue ()
                            .push (function ()
                            {
                                return self.fn (...args);
                            })
                            .complete (function (ctx)
                            {
                                if (ctx.error)
                                {
                                    Object.setPrototypeOf (ctx.error, Error.prototype);
                                }

                                self.invocations.push (new Self.Invocation (
                                {
                                    args,
                                    result: ctx.result,
                                    error: ctx.error
                                }));
                            })
                            .run ()
                        ;
                    };

                    return self;
                })
                .method ("restore", function ()
                {
                    this.target[this.method] = this.targetMethod;
                    this.applied = false;
                })
            ;
        })
        .staticMethod ("trackCallback", function (cb)
        {
            let sourceLine = Self.getSourceLine ();

            return function trackedCallback (...args)
            {
                let self = this;

                return nit.Queue ()
                    .push (function ()
                    {
                        return cb.apply (self, args);
                    })
                    .failure (function (qc)
                    {
                        throw Self.addSourceLineToStack (qc.error, sourceLine);
                    })
                    .run ()
                ;
            };
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
        .staticMethod ("testUp", function (testUp)
        {
            return this.method ("testUp", testUp);
        })
        .staticMethod ("testDown", function (testDown)
        {
            return this.method ("testDown", testDown);
        })
        .staticMethod ("getPropertyNames", function ()
        {
            return this.getProperties ()
                .map (p => p.name)
                .concat (this.getProperties (null, nit.Object.Property)
                    .filter (p => !p.hidden)
                    .map (p => p.name)
                )
            ;
        })
        .staticMethod ("getSourceLine", function ()
        {
            let match;

            for (let line of nit.stack.split ("\n"))
            {
                if ((match = line.match (Self.STACK_LINE_PATTERN))
                    && match[2] != __filename)
                {
                    return line;
                }
            }
        })
        .staticMethod ("addSourceLineToStack", function (e, sourceLine)
        {
            let ss = e.stack.split ("\n");
            let messages = [];
            let lines = [];
            let match = sourceLine.match (Self.STACK_LINE_PATTERN);
            let file = match[2];
            let hasSourceLine = false;

            while (ss.length && !(match = ss[0].match (Self.STACK_LINE_PATTERN)))
            {
                messages.push (ss.shift ());
            }

            while (ss.length && (match = ss[0].match (Self.STACK_LINE_PATTERN)))
            {
                if (match[2] == file)
                {
                    hasSourceLine = true;
                    lines = ss;
                    break;
                }
                else
                {
                    lines.push (ss.shift ());
                }
            }

            if (!hasSourceLine)
            {
                lines.unshift (sourceLine);
            }

            e.stack = messages.concat (lines).join ("\n");

            return e;
        })

        .postConstruct (function (strategy)
        {
            strategy.description = strategy.description || "[Untitled Test]";
            strategy.snapshot ();
        })
        .abstractMethod ("test")
        .method ("testUp", function () {})
        .method ("testDown", function () {})

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
            if (message)
            {
                let testId = this.testId = nit.uuid ();
                let error = Error ("The test was not committed.");

                error.stack = error.stack
                    .split ("\n")
                    .filter (l => !l.includes (__filename))
                    .join ("\n")
                ;

                process.nextTick (() =>
                {
                    if (this.testId == testId)
                    {
                        throw error;
                    }
                });
            }

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
        .method ("app", function (name, root)
        {
            this.application = new Self.Application (name, root);

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
            this.befores.push (Self.trackCallback (cb));

            return this;
        })
        .method ("after", function (cb)
        {
            this.afters.push (Self.trackCallback (cb));

            return this;
        })
        .method ("up", function (cb)
        {
            this.ups.push (Self.trackCallback (cb));

            return this;
        })
        .method ("down", function (cb)
        {
            this.downs.push (Self.trackCallback (cb));

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
            this.resultValidator = new Self.TypeValidator (Self.getSourceLine (), { expected: type });

            return this;
        })
        .method ("returns", function (result)
        {
            this.result = result;
            this.resultValidator = new Self.ValueValidator (Self.getSourceLine (), { expected: result });

            return this;
        })
        .method ("throws", function (error)
        {
            this.result = error;
            this.resultValidator = new Self.ErrorValidator (Self.getSourceLine (), { expected: error });

            return this;
        })
        .method ("expecting", function (message, value, valueGetter)
        {
            message = Self.render (message, { value });

            let expector = new Self.Expector (message, new Self.ValueValidator (Self.getSourceLine (), { expected: value }), function (strategy)
            {
                return valueGetter (strategy);
            });

            this.expectors.push (expector);

            return this;
        })
        .method ("expectingPropertyToBe", function (property, value)
        {
            let message = Self.render ("the property '%{property}' to be %{value|format}", { property, value });
            let expector = new Self.Expector (message, new Self.ValueValidator (Self.getSourceLine (), { expected: value }), function (strategy)
            {
                return nit.get (strategy, property);
            });

            this.expectors.push (expector);

            return this;
        })
        .method ("expectingPropertyToBeOfType", function (property, type)
        {
            let message = Self.render ("the property '%{property}' to be of type '%{type}'", { property, type });
            let expector = new Self.Expector (message, new Self.TypeValidator (Self.getSourceLine (), { expected: type }), function (strategy)
            {
                return nit.get (strategy, property);
            });

            this.expectors.push (expector);

            return this;
        })
        .method ("expectingMethodToReturnValue", function (path, retval, ...args)
        {
            let message = Self.render ("the method %{path} () to return %{retval|format} when invoked with (%{args|formatArgs})", { path, args, retval });
            let expector = new Self.Expector (message, new Self.ValueValidator (Self.getSourceLine (), { expected: retval }), function (strategy)
            {
                return Self.invoke (strategy, path, args);
            });

            this.expectors.push (expector);

            return this;
        })
        .method ("expectingMethodToReturnValueOfType", function (path, type, ...args)
        {
            let message = Self.render ("the method %{path} () to return a value of type '%{type}' when invoked with (%{args|formatArgs})", { path, args, type });
            let expector = new Self.Expector (message, new Self.TypeValidator (Self.getSourceLine (), { expected: type }), function (strategy)
            {
                return Self.invoke (strategy, path, args);
            });

            this.expectors.push (expector);

            return this;
        })
        .method ("expectingMethodToThrow", function (path, error, ...args)
        {
            let message = Self.render ("the method %{path} () to throw '%{error}' when invoked with (%{args|formatArgs})", { path, args, error });
            let expector = new Self.Expector (message, new Self.ErrorValidator (Self.getSourceLine (), { expected: error }), function (strategy)
            {
                return Self.invoke (strategy, path, args);
            });

            this.expectors.push (expector);

            return this;
        })
        .method ("commit", function ()
        {
            let self = this;

            this.testId = "";

            if (!self.inputs.length)
            {
                self.inputs.push ([]);
            }

            let snapshot = self.snapshot (true);
            let sourceLine = Self.getSourceLine ();

            (self.thisOnly ? describe.only : describe) (self.description, () =>
            {
                for (let args of self.inputs)
                {
                    let data = { ...snapshot, args };
                    let message = Self.render (self.message, data);

                    it (message, async () =>
                    {
                        nit.assign (self, snapshot);

                        for (let [i, arg] of args.entries ())
                        {
                            args[i] = await arg;
                        }

                        self.args = args;
                        args = self.args;

                        try
                        {
                            for (let mock of self.mocks)
                            {
                               mock.apply (self);
                            }

                            for (let up of self.ups)
                            {
                                await up.apply (self, args);
                            }

                            await self.testUp (...args);

                            if (self.application)
                            {
                                process.chdir (self.application.root.path);
                            }
                            else
                            if (self.dir)
                            {
                                process.chdir (self.dir);
                            }

                            for (let before of self.befores)
                            {
                                await before.apply (self, args);
                            }

                            for (let mock of self.mocks)
                            {
                               mock.apply (self);
                            }

                            try
                            {
                                self.result = await self.test (...args);
                            }
                            catch (e)
                            {
                                Self.addSourceLineToStack (e, sourceLine);
                                self.error = e;
                            }

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

                            if (self.application || self.dir)
                            {
                                process.chdir (nit.CWD);
                            }

                            await self.testDown ();

                            for (let down of self.downs)
                            {
                                await down.apply (self);
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
