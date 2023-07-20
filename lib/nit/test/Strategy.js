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
        .field ("inits...", "function", "Tasks to run before test starts.")
        .field ("deinits...", "function", "Cleanup tasks to run.")
        .field ("inputs...", "any", "The test inputs.")
        .field ("args...", "any", "The arguments passed to the test function.")
        .field ("result", "any", "The expected return value.")
        .field ("error", "any", "The last error.")

        .constant ("STACK_LINE_PATTERN", /.*(\(([^)]+):\d+:\d+\)).*/)
        .constant ("TRANSFORMS",
        {
            formatType: function (v)
            {
                return nit.is.func (v) ? v.name : v;
            }
            ,
            format: function (v)
            {
                if (v instanceof RegExp)
                {
                    return v + "";
                }
                else
                if (nit.is.str (v))
                {
                    return nit.toJson (v);
                }
                else
                if (nit.is.func (v))
                {
                    return (v + "")
                        .split (/[\r\n]+/)
                        .map (s => s.trim ())
                        .join (" ")
                    ;
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
                .lifecycleMethod ("validate", function (strategy, value) // eslint-disable-line no-unused-vars
                {
                    let self = this;
                    let cls = self.constructor;

                    try
                    {
                        cls[Validator.kValidate].apply (self, arguments);
                    }
                    catch (e)
                    {
                        throw Self.addSourceLineToStack (e, self.sourceLine);
                    }

                }, true)
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
                .onConstruct (function (name, root)
                {
                    root.create ();

                    root.writeFile ("package.json", nit.toJson ({ name }));
                })
            ;
        })
        .defineInnerClass ("Project", Project =>
        {
            Project
                .constant ("DIR_PROPERTIES", ["PROJECT_PATHS", "CLASS_PATHS", "ASSET_PATHS"])
                .field ("<root>", "nit.Dir", "The project root directory.",
                {
                    setter: function (r)
                    {
                        return nit.path.isAbsolute (r.path) ? r : nit.Dir (global.test.pathForProject (r.path));
                    }
                })
                .staticMethod ("resetDirs", function ()
                {
                    nit.each.obj (nit.pick (nit.propertyDescriptors (nit, true), Project.DIR_PROPERTIES), p =>
                    {
                        p.get.reset ();
                    });
                })
                .method ("begin", function ()
                {
                    let { root } = this;

                    process.chdir (root.path);
                    Project.resetDirs ();

                    nit.PROJECT_PATHS.unshift (root.path);
                })
                .method ("end", function ()
                {
                    Project.resetDirs ();
                })
            ;
        })

        .property ("testId", "string", { hidden: true })
        .property ("lastSnapshot", "object", { hidden: true })
        .property ("thisOnly", "boolean")
        .property ("app", "nit.test.Strategy.Application")
        .property ("proj", "nit.test.Strategy.Project")
        .property ("dir", "string") // working directory
        .property ("resultValidator", "nit.test.Strategy.Validator")
        .property ("expectors...", "nit.test.Strategy.Expector")
        .property ("mocks...", "nit.test.Strategy.Mock")
        .property ("spies...", "nit.test.Strategy.Spy")

        .getter ("self", function () { return this; })

        .defineInnerClass ("ValueValidator", "nit.test.Strategy.Validator", ValueValidator =>
        {
            ValueValidator
                .field ("expected", "any", "The expected value.")
                .onValidate (function (strategy, value)
                {
                    if (arguments.length == 1 && strategy.error)
                    {
                        throw Self.addSourceLineToStack (strategy.error, this.sourceLine);
                    }

                    let expected = this.expected;
                    let result = arguments.length > 1 ? value : strategy.result;

                    if (nit.is.func (expected)
                        && nit.classChain (expected).length == 1
                        && !(expected + "").includes ("[native code]"))
                    {
                        expected = expected (strategy);
                    }

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
        .defineInnerClass ("SubsetValidator", "nit.test.Strategy.Validator", SubsetValidator =>
        {
            SubsetValidator
                .field ("expected", "any", "The expected subset.")
                .staticMethod ("buildExpect", subset =>
                {
                    let isArr = nit.is.arr (subset);
                    let isObj = nit.is.obj (subset);
                    let method = isArr ? "arrayContaining" : (isObj ? "objectContaining" : null);
                    let each = isArr ? nit.each : nit.each.obj;

                    return !method ? subset : expect[method] (each (subset, v =>
                    {
                        if (nit.is.arr (v))
                        {
                            return expect.arrayContaining (nit.each (v, SubsetValidator.buildExpect));
                        }
                        else
                        {
                            return SubsetValidator.buildExpect (v);
                        }
                    }));
                })
                .staticMethod ("buildResult", value =>
                {
                    if (nit.is.arr (value))
                    {
                        return nit.each (value, SubsetValidator.buildResult);
                    }
                    else
                    if (nit.is.obj (value))
                    {
                        return nit.each.obj (value, SubsetValidator.buildResult);
                    }
                    else
                    if (nit.is.func (value))
                    {
                        return SubsetValidator.buildResult (nit.clone (value));
                    }
                    else
                    {
                        return value;
                    }
                })
                .onValidate (function (strategy, value)
                {
                    if (arguments.length == 1 && strategy.error)
                    {
                        throw Self.addSourceLineToStack (strategy.error, this.sourceLine);
                    }

                    let expected = this.expected;
                    let result = arguments.length > 1 ? value : strategy.result;

                    expect (SubsetValidator.buildResult (nit.clone (result))).toEqual (SubsetValidator.buildExpect (expected));
                })
            ;
        })
        .defineInnerClass ("TypeValidator", "nit.test.Strategy.Validator", TypeValidator =>
        {
            TypeValidator
                .field ("expected", "any", "The result type.")
                    .constraint ("type", "string", "function")
                .field ("subclass", "boolean", "Whether the result should be a subclass of the expected type.")

                .onValidate (function (strategy, value)
                {
                    if (arguments.length == 1 && strategy.error)
                    {
                        throw Self.addSourceLineToStack (strategy.error, this.sourceLine);
                    }

                    let expected = this.expected;
                    let result = arguments.length > 1 ? value : strategy.result;

                    if (this.subclass)
                    {
                        let superclass = nit.is.func (expected) ? expected : nit.lookupClass (expected);

                        expect (nit.is.subclassOf (result, superclass)).toBe (true);
                    }
                    else
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
                    .constraint ("type", "RegExp", "number", "string", "function")
                .onValidate (function (strategy, value)
                {
                    if (arguments.length == 1 && !strategy.error)
                    {
                        this.throw ("error.did_not_throw");
                    }

                    let expected = this.expected;
                    let error = arguments.length > 1 ? value : strategy.error;

                    if (!(nit.is.errorish (error)))
                    {
                        if (nit.is.func (expected))
                        {
                            expect (expected.call (strategy, error)).toBe (true);
                        }
                        else
                        {
                            expect (error).toBe (expected);
                        }
                    }
                    else
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
                .field ("error", "any", "The invocation error.")
            ;
        })
        .defineInnerClass ("Mock", function (Mock)
        {
            Mock
                .field ("<object>", "any", "The owner of the method to be mocked.")
                .field ("<method>", "string", "The method name.",
                {
                    setter: function (v)
                    {
                        return nit.trim (v).split (".").join ("\\.");
                    }
                })
                .field ("[retval]", "any", "The mock function or the value to be returned.")

                .property ("invocations...", "nit.test.Strategy.Invocation")
                .property ("fn", "function") // the mocked function
                .property ("obj", "any") // the 'this' object when the method is invoked
                .property ("target", "any") // the object that owns the method being mocked
                .property ("targetMethod", "function") // the orignal method
                .property ("strategy", "nit.test.Strategy")
                .property ("applied", "boolean")

                .onConstruct (function ()
                {
                    let retval = this.retval;

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
                    self.targetMethod = nit.get (self.target, method);
                    self.applied = true;

                    nit.set (self.target, method, function (...args)
                    {
                        self.obj = this;

                        return nit.Queue ()
                            .push (function ()
                            {
                                return self.fn (...args);
                            })
                            .complete (function (ctx)
                            {
                                self.invocations.push (new Self.Invocation (
                                {
                                    args,
                                    result: ctx.result,
                                    error: ctx.error
                                }));
                            })
                            .run ()
                        ;
                    });

                    return self;
                })
                .method ("restore", function ()
                {
                    try
                    {
                        nit.set (this.target, this.method, this.targetMethod);
                    }
                    catch (e)
                    {
                    }

                    this.applied = false;
                })
            ;
        })
        .defineInnerClass ("Spy", function (Spy)
        {
            Spy
                .field ("<object>", "any", "The owner of the method to be mocked.")
                    .constraint ("type", "string", "object", "function")
                .field ("<method>", "string", "The method name.",
                {
                    setter: function (v)
                    {
                        return nit.trim (v).split (".").join ("\\.");
                    }
                })

                .property ("invocations...", "nit.test.Strategy.Invocation")
                .property ("obj", "any") // the 'this' object when the method is invoked
                .property ("target", "any") // the object that owns the method being mocked
                .property ("targetMethod", "function") // the orignal method
                .property ("strategy", "nit.test.Strategy")
                .property ("applied", "boolean")

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
                    self.targetMethod = nit.get (self.target, method);
                    self.applied = true;

                    nit.set (self.target, method, function (...args)
                    {
                        self.obj = this;

                        return nit.Queue ()
                            .push (function ()
                            {
                                return self.targetMethod.apply (self.obj, args);
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
                    });

                    return self;
                })
                .method ("restore", function ()
                {
                    try
                    {
                        nit.set (this.target, this.method, this.targetMethod);
                    }
                    catch (e)
                    {
                    }

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

        .lifecycleMethod ("test", null, true) // test* methods will be called with args
        .lifecycleMethod ("testUp")
        .lifecycleMethod ("testDown")

        .staticMemo ("propertyNames", function ()
        {
            return this.properties
                .map (p => p.name)
                .concat (this.getProperties (null, nit.Object.Property)
                    .filter (p => !p.hidden)
                    .map (p => p.name)
                )
            ;
        })
        .staticMethod ("getSourceLine", function (filename)
        {
            let match;

            for (let line of nit.stack.split ("\n"))
            {
                if ((match = line.match (Self.STACK_LINE_PATTERN))
                    && match[2] !== filename
                    && match[2] !== __filename)
                {
                    return line;
                }
            }
        })
        .staticMethod ("addSourceLineToStack", function (e, sourceLine)
        {
            e = nit.is.errorish (e) ? e : new Error (e + "");

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

            while (ss.length)
            {
                match = ss[0].match (Self.STACK_LINE_PATTERN);

                if (match && match[2] == file)
                {
                    hasSourceLine = true;
                    lines = ss.concat (lines.length ? ["Cause:"].concat (lines).map (l => l.trim ()).join ("\n\u200b  ") : []);
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

        .onPostConstruct (function (strategy)
        {
            strategy.description = strategy.description || "[Untitled Test]";
            strategy.snapshot ();
        })

        .method ("snapshot", function (returnOnly)
        {
            let self = this;
            let snapshot = {};

            self.constructor.propertyNames
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

            for (let name of this.constructor.propertyNames)
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
        .method ("application", function (name, root)
        {
            this.app = new Self.Application (name, root);

            return this;
        })
        .method ("project", function (root)
        {
            this.proj = new Self.Project (root);

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
        .method ("spy", function ()
        {
            this.spies.push (new Self.Spy (...arguments));

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
        .method ("init", function (cb)
        {
            this.inits.push (Self.trackCallback (cb));

            return this;
        })
        .method ("deinit", function (cb)
        {
            this.deinits.push (Self.trackCallback (cb));

            return this;
        })
        .method ("given", function (...args)
        {
            this.inputs.push (args);

            return this;
        })
        .method ("returnsInstanceOf", function (type, subclass)
        {
            this.result = type;
            this.resultValidator = new Self.TypeValidator (Self.getSourceLine (), { expected: type, subclass });

            return this;
        })
        .method ("returnsResultContaining", function (subset)
        {
            this.result = subset;
            this.resultValidator = new Self.SubsetValidator (Self.getSourceLine (), { expected: subset });

            return this;
        })
        .method ("returns", function (result)
        {
            this.result = result;
            this.resultValidator = new Self.ValueValidator (Self.getSourceLine (), { expected: result });

            return this;
        })
        .method ("assign", function (data)
        {
            nit.assign (this, data);

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
                return valueGetter.call (strategy, strategy);
            });

            this.expectors.push (expector);

            return this;
        })
        .method ("expectingPropertyToBe", function (property, value, clone)
        {
            let message = Self.render ("the property '%{property}' to be %{value|format}", { property, value });
            let expector = new Self.Expector (message, new Self.ValueValidator (Self.getSourceLine (), { expected: value }), function (strategy)
            {
                let v = nit.get (strategy, property);

                return clone ? nit.clone (v) : v;
            });

            this.expectors.push (expector);

            return this;
        })
        .method ("expectingPropertyToBeOfType", function (property, type, subclass)
        {
            let message = Self.render ("the property '%{property}' to be %{#?subclass}subclass of%{:}of type%{/} '%{type|formatType}'", { property, type, subclass });
            let expector = new Self.Expector (message, new Self.TypeValidator (Self.getSourceLine (), { expected: type, subclass }), function (strategy)
            {
                return nit.get (strategy, property);
            });

            this.expectors.push (expector);

            return this;
        })
        .method ("expectingPropertyToContain", function (property, value)
        {
            let message = Self.render ("the property '%{property}' to contain %{value|format}", { property, value });
            let expector = new Self.Expector (message, new Self.SubsetValidator (Self.getSourceLine (), { expected: value }), function (strategy)
            {
                return nit.get (strategy, property);
            });

            this.expectors.push (expector);

            return this;
        })
        .method ("expectingMethodToReturnValue", function (path, args, retval, clone)
        {
            args = nit.array (args);

            let message = Self.render ("the method %{path} () to return %{retval|format} when invoked with (%{args|formatArgs})", { path, args, retval });
            let expector = new Self.Expector (message, new Self.ValueValidator (Self.getSourceLine (), { expected: retval }), function (strategy)
            {
                let v = Self.invoke (strategy, path, args);

                return clone ? nit.clone (v) : v;
            });

            this.expectors.push (expector);

            return this;
        })
        .method ("expectingMethodToReturnValueContaining", function (path, args, retval)
        {
            args = nit.array (args);

            let message = Self.render ("the method %{path} () to return a value containing %{retval|format} when invoked with (%{args|formatArgs})", { path, args, retval });
            let expector = new Self.Expector (message, new Self.SubsetValidator (Self.getSourceLine (), { expected: retval }), function (strategy)
            {
                return Self.invoke (strategy, path, args);
            });

            this.expectors.push (expector);

            return this;
        })
        .method ("expectingMethodToReturnValueOfType", function (path, args, type, subclass)
        {
            args = nit.array (args);

            let message = Self.render ("the method %{path} () to return %{#?subclass}a subclass of%{:}a value of type%{/} '%{type}' when invoked with (%{args|formatArgs})", { path, args, type, subclass });
            let expector = new Self.Expector (message, new Self.TypeValidator (Self.getSourceLine (), { expected: type, subclass }), function (strategy)
            {
                return Self.invoke (strategy, path, args);
            });

            this.expectors.push (expector);

            return this;
        })
        .method ("expectingMethodToThrow", function (path, args, error)
        {
            args = nit.array (args);

            let message = Self.render ("the method %{path} () to throw '%{error}' when invoked with (%{args|formatArgs})", { path, args, error });
            let expector = new Self.Expector (message, new Self.ErrorValidator (Self.getSourceLine (), { expected: error }), function (strategy)
            {
                try
                {
                    Self.invoke (strategy, path, args);
                }
                catch (e)
                {
                    return e;
                }
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

            (self.thisOnly ? describe.only : describe) ("\x1b[1m" + self.description, () =>
            {
                let inputs = self.inputs;

                for (let args of inputs)
                {
                    let data = { ...snapshot, args };
                    let message = Self.render (self.message, data);

                    it ("\x1b[0m\x1b[36m" + message, async () =>
                    {
                        nit.assign (self, snapshot);

                        for (let [i, arg] of args.entries ())
                        {
                            args[i] = await arg;
                        }

                        self.args = args;

                        try
                        {
                            for (let init of self.inits)
                            {
                                await init.call (self, self);
                            }

                            self.mocks.forEach (m => m.apply (self));
                            self.spies.forEach (s => s.apply (self));

                            for (let up of self.ups)
                            {
                                await up.call (self, self);
                            }

                            self.mocks.forEach (m => m.apply (self));
                            self.spies.forEach (s => s.apply (self));

                            await self.testUp (...self.args);

                            if (self.proj)
                            {
                                self.proj.begin ();
                            }
                            else
                            if (self.app)
                            {
                                process.chdir (self.app.root.path);
                            }
                            else
                            if (self.dir)
                            {
                                process.chdir (self.dir);
                            }

                            for (let before of self.befores)
                            {
                                await before.call (self, self);
                            }

                            self.mocks.forEach (m => m.apply (self));
                            self.spies.forEach (s => s.apply (self));

                            try
                            {
                                self.result = await self.test (...self.args);
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
                                global.test.unexpectedErrors.push (self.error);

                                throw self.error;
                            }

                            self.mocks.forEach (m => m.apply (self));
                            self.spies.forEach (s => s.apply (self));

                            for (let after of self.afters)
                            {
                                await after.call (self, self);
                            }

                            await self.testDown (...self.args);

                            self.mocks.forEach (m => m.apply (self));
                            self.spies.forEach (s => s.apply (self));

                            for (let down of self.downs)
                            {
                                await down.call (self, self);
                            }
                        }
                        finally
                        {
                            for (let deinit of self.deinits)
                            {
                                await deinit.call (self, self);
                            }

                            self.mocks.forEach (m => m.restore (self));
                            self.spies.forEach (s => s.restore (self));

                            if (self.proj || self.app || self.dir)
                            {
                                process.chdir (nit.CWD);
                            }
                        }
                    });


                    for (let expector of self.expectors)
                    {
                        it ("  +--> expecting " + expector.message, async () =>
                        {
                            try
                            {
                                await expector.validate (self);
                            }
                            catch (e)
                            {
                                Self.addSourceLineToStack (e, expector.validator.sourceLine);
                                global.test.unexpectedErrors.push (e);

                                throw e;
                            }
                        });
                    }
                }
            });

            return self.reset ();
        })
    ;
};
