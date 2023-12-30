test.method ("nit.CallChain", "createCall")
    .should ("create a call if the func is given")
        .given ("run", () => 100)
        .returnsInstanceOf ("nit.CallChain.Call")
        .expectingPropertyToBe ("result.name", "run")
        .commit ()

    .should ("create an anchor if the func is not given")
        .given ("run")
        .returnsInstanceOf ("nit.CallChain.Anchor")
        .expectingPropertyToBe ("result.name", "run")
        .commit ()
;


test.method ("nit.CallChain.Context", "suppressedError")
    .should ("log the error")
        .given (new Error ("ERR"))
        .mock (nit.log, "e")
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /ERR/)
        .commit ()
;


test.method ("nit.CallChain", "isCall", true)
    .should ("return true if the given arg is an instance of Call")
        .given (new nit.CallChain.Call ("run", () => 100))
        .returns (true)
        .commit ()

    .should ("return false if the given arg is an instance of Call")
        .given (new Error ("ERR"))
        .returns (false)
        .commit ()
;


test.method ("nit.CallChain.Call", "invoke")
    .should ("invoke the function")
        .up (s => s.createArgs = ["run", () => 100])
        .returns (100)
        .commit ()

    .should ("call suppressedError () for the error of a safe call")
        .up (s => s.createArgs = ["run", () => nit.throw ("ERR1"), true])
        .mock (nit.log, "e")
        .returns ()
        .commit ()

    .should ("throw the error if the call is not safe")
        .up (s => s.createArgs = ["run", () => nit.throw ("ERR1")])
        .throws ("ERR1")
        .commit ()
;


test.method ("nit.CallChain", "before")
    .should ("insert the function before the specified target with the default name 'before'")
        .given (() => 100)
        .before (s => s.object.before ("run", () => 10))
        .expectingPropertyToBe ("result.calls.length", 2)
        .expectingPropertyToBe ("result.calls.0.name", "before")
        .expectingPropertyToBeOfType ("result.calls.0", "nit.CallChain.Call")
        .commit ()

    .should ("insert the function before the specified target")
        .given ("run", "run.before", () => 100)
        .before (s => s.object.before ("run", () => 10))
        .expectingPropertyToBe ("result.calls.length", 2)
        .expectingPropertyToBe ("result.calls.0.name", "run.before")
        .expectingPropertyToBeOfType ("result.calls.0", "nit.CallChain.Call")
        .commit ()

    .should ("insert the provided call before the specified target")
        .given ("run", new nit.CallChain.Call ("run.before", () => 100))
        .before (s => s.object.before ("run", () => 10))
        .expectingPropertyToBe ("result.calls.length", 2)
        .expectingPropertyToBe ("result.calls.0.name", "run.before")
        .expectingPropertyToBeOfType ("result.calls.0", "nit.CallChain.Call")
        .commit ()

    .should ("used the provided call's name as the target if target is not specified")
        .given (new nit.CallChain.Call ("run.before", () => 100))
        .before (s => s.object.before ("run", () => 10))
        .expectingPropertyToBe ("result.calls.length", 2)
        .expectingPropertyToBe ("result.calls.0.name", "run.before")
        .expectingPropertyToBeOfType ("result.calls.0", "nit.CallChain.Call")
        .commit ()
;


test.method ("nit.CallChain", "after")
    .should ("insert the function after the specified target with the default name 'after'")
        .given (() => 100)
        .before (s => s.object.after ("run", () => 10))
        .expectingPropertyToBe ("result.calls.length", 2)
        .expectingPropertyToBe ("result.calls.1.name", "after")
        .expectingPropertyToBeOfType ("result.calls.0", "nit.CallChain.Call")
        .commit ()

    .should ("insert the function after the specified target")
        .given ("run", "run.after", () => 100)
        .before (s => s.object.after ("run", () => 10))
        .expectingPropertyToBe ("result.calls.length", 2)
        .expectingPropertyToBe ("result.calls.1.name", "run.after")
        .expectingPropertyToBeOfType ("result.calls.1", "nit.CallChain.Call")
        .commit ()

    .should ("insert the provided call after the specified target")
        .given ("run", new nit.CallChain.Call ("run.after", () => 100))
        .before (s => s.object.after ("run", () => 10))
        .expectingPropertyToBe ("result.calls.length", 2)
        .expectingPropertyToBe ("result.calls.1.name", "run.after")
        .expectingPropertyToBeOfType ("result.calls.1", "nit.CallChain.Call")
        .commit ()

    .should ("used the provided call's name as the target if target is not specified")
        .given (new nit.CallChain.Call ("run.after", () => 100))
        .before (s => s.object.after ("run", () => 10))
        .expectingPropertyToBe ("result.calls.length", 2)
        .expectingPropertyToBe ("result.calls.1.name", "run.after")
        .expectingPropertyToBeOfType ("result.calls.1", "nit.CallChain.Call")
        .commit ()
;


test.method ("nit.CallChain", "replace")
    .should ("replace the call of the specified name")
        .given ("run", () => 100)
        .before (s => s.object.after ("run", () => 10))
        .expectingPropertyToBe ("result.calls.length", 1)
        .expectingPropertyToBe ("result.calls.0.name", "run")
        .expectingMethodToReturnValueContaining ("result.invoke", [], { result: 100 })
        .commit ()

    .should ("used the provided call")
        .given (new nit.CallChain.Call ("run", () => 200))
        .before (s => s.object.after ("run", () => 10))
        .expectingPropertyToBe ("result.calls.length", 1)
        .expectingPropertyToBe ("result.calls.0.name", "run")
        .expectingMethodToReturnValueContaining ("result.invoke", [], { result: 200 })
        .commit ()

    .should ("just append the call if the target does not exist")
        .given (new nit.CallChain.Call ("post", () => 200))
        .before (s => s.object.after ("run", () => 10))
        .expectingPropertyToBe ("result.calls.length", 2)
        .expectingPropertyToBe ("result.calls.1.name", "post")
        .expectingMethodToReturnValueContaining ("result.invoke", [], { result: 200 })
        .commit ()
;


test.method ("nit.CallChain", "do")
    .should ("add a 'do' call with the provided function")
        .given (() => 100)
        .expectingPropertyToBe ("result.calls.length", 1)
        .expectingPropertyToBe ("result.calls.0.name", "do")
        .expectingPropertyToBeOfType ("result.calls.0", "nit.CallChain.Call")
        .commit ()
;


test.method ("nit.CallChain", "anchor")
    .should ("add an anchor with the specified name")
        .given ("run")
        .expectingPropertyToBe ("result.calls.length", 1)
        .expectingPropertyToBe ("result.calls.0.name", "run")
        .expectingPropertyToBeOfType ("result.calls.0", "nit.CallChain.Anchor")
        .commit ()
;


test.method ("nit.CallChain", "until")
    .should ("add an until condition")
        .given (function (ctx) { return ctx.value > 4; })
        .returnsResultOfExpr ("object")
        .expectingPropertyToBe ("result.untils.length", 1)
        .expectingMethodToReturnValue ("result.untils.0", { value: 5 }, true)
        .commit ()

    .should ("convert a non-function condition into a value and result equality checker")
        .given ({ result: { a: 1 } })
        .returnsResultOfExpr ("object")
        .expectingPropertyToBe ("result.untils.length", 1)
        .expectingMethodToReturnValue ("result.untils.0", { result: { a: 1 } }, true)
        .commit ()
;


test.method ("nit.CallChain", "next")
    .should ("return the next call")
        .up (s => s.createArgs = ["pre", "post"])
        .before (s => s.object.after ("pre", "run", () => 100))
        .returnsInstanceOf ("nit.CallChain.Call")
        .expectingPropertyToBe ("object.calls.length", 2)
        .expectingMethodToReturnValue ("object.next", null, undefined)
        .commit ()
;


test.method ("nit.CallChain", "fork")
    .should ("return a cloned chain for the specified owner")
        .up (s => s.owner = new nit.Class)
        .up (s => s.args = s.owner)
        .up (s => s.createArgs = ["pre", "post"])
        .before (s => s.object.after ("pre", "run", () => 100))
        .returnsInstanceOf ("nit.CallChain")
        .expectingPropertyToBe ("object.calls.length", 3)
        .expectingPropertyToBe ("object.calls.1.name", "run")
        .expecting ("the owner property is the provided owner", s => s.result.owner == s.owner)
        .commit ()
;


test.method ("nit.CallChain", "invoke")
    .should ("run the call chain")
        .before (s => s.object.do ((_, v) => v * 2))
        .before (s => s.object.do ((_, v) => v * 3))
        .before (s => s.object.do ((_, v) => v * 4))
        .given (5)
        .returnsInstanceOf ("nit.CallChain.Context")
        .expectingPropertyToBe ("result.result", 20)
        .commit ()

    .should ("use the provided context if it's an instance of nit.CallChain.Context")
        .before (s => s.object.do ((_, v) => v * 2))
        .before (s => s.object.do ((_, v) => v * 3))
        .before (s => s.object.do ((_, v) => v * 4))
        .given (new nit.CallChain.Context (5))
        .returnsInstanceOf ("nit.CallChain.Context")
        .expectingPropertyToBe ("result.result", 20)
        .commit ()

    .should ("stop if one of the until conditions returns true")
        .before (s => s.object.do ((_, v) => v * 2))
        .before (s => s.object.do ((_, v) => v * 3))
        .before (s => s.object.do ((_, v) => v * 4))
        .before (s => s.object.until (function (ctx) { return ctx.result > 11; }))
        .given (5)
        .returnsInstanceOf ("nit.CallChain.Context")
        .expectingPropertyToBe ("result.result", 15)
        .expectingPropertyToBe ("object.stopped", true)
        .expectingPropertyToBe ("object.done", false)
        .commit ()

    .should ("rethrow the error from the call")
        .before (s => s.object.do ((_, v) => v * 2))
        .before (s => s.object.do (() => nit.throw ("ERR")))
        .before (s => s.object.do ((_, v) => v * 4))
        .given (5)
        .throws ("ERR")
        .expectingPropertyToBeOfType ("error.nit\\.CallChain\\.context", "nit.CallChain.Context")
        .expectingPropertyToBe ("object.stopped", false)
        .expectingPropertyToBe ("object.done", false)
        .commit ()

    .should ("NOT rethrow the error from the call if the chain is stopped by one of the until condition")
        .before (s => s.object.do ((_, v) => v * 2))
        .before (s => s.object.do (() => nit.throw ("ERR")))
        .before (s => s.object.do ((_, v) => v * 4))
        .before (s => s.object.until (function (ctx) { return ctx.error; }))
        .given (5)
        .returnsInstanceOf ("nit.CallChain.Context")
        .expectingPropertyToBe ("result.error", /ERR/)
        .expectingPropertyToBe ("result.result", 10)
        .expectingPropertyToBe ("object.stopped", true)
        .expectingPropertyToBe ("object.done", false)
        .commit ()
;


test.method ("nit.CallChain", "result")
    .should ("run the call chain and return the result")
        .before (s => s.object.do ((_, v) => v * 2))
        .before (s => s.object.do ((_, v) => v * 3))
        .before (s => s.object.do ((_, v) => v * 4))
        .given (5)
        .returns (20)
        .commit ()
;


test.method ("nit.CallChain", "DONE", true)
    .should ("return true when the chain is done")
        .given ({ chain: { done: true } })
        .returns (true)
        .commit ()
;


test.method ("nit.CallChain", "STOP", true)
    .should ("return true when the chain is stopped")
        .given ({ chain: { stopped: true } })
        .returns (true)
        .commit ()
;


test.method ("nit.CallChain", "ERROR", true)
    .should ("return true when the context has error")
        .given ({ error: new Error })
        .returns (true)
        .commit ()
;


test.method ("nit.CallChain.Link", "applicableTo")
    .should ("return true if the condition is not set")
        .up (s => s.createArgs = [new nit.CallChain ()])
        .returns (true)
        .commit ()

    .should ("use the provided condition")
        .up (s => s.createArgs = [new nit.CallChain (), () => false])
        .returns (false)
        .commit ()
;


test.method ("nit.CallChain", "link")
    .should ("connect the current chain to another one")
        .up (s => s.called = [])
        .up (s => s.createArgs = { name: "ca" })
        .up (s => s.chainB = nit.CallChain ({ name: "cb" })
            .do (() => s.called.push ("b1"))
            .do (() => s.called.push ("b2"))
        )
        .up (s => s.args = s.chainB)
        .before (s => s.object.do (() => s.called.push ("a1")))
        .before (s => s.object.do (() => s.called.push ("a2")))
        .after (s => s.res = s.object.invoke ())
        .returnsResultOfExpr ("object")
        .expectingPropertyToBe ("called", ["a1", "a2", "b1", "b2"])
        .expectingPropertyToBe ("res.chain.name", "cb")
        .commit ()
;
