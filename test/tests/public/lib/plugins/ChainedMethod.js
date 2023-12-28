test.plugin ("chained-method", "staticChainedMethod", true, { hostClass: "test.Api" })
    .should ("add a static chained method")
        .up (s => s.called = [])
        .up (s => s.args =
        [
            "dispatch",
            cls => cls
                .addChain ("failure", true)
                .addChain ("success", true)
                .addChain ("complete", true)
                .link ("dispatch", "failure", nit.CallChain.ERROR)
                .link ("dispatch", "success")
                .link ("failure", "complete")
                .link ("success", "complete")
                .beforeDispatch (() => s.called.push ("beforeDispatch"))
                .afterDispatch (() => s.called.push ("afterDispatch"))
                .beforeFailure (() => s.called.push ("beforeFailure"))
                .afterFailure (() => s.called.push ("afterFailure"))
                .beforeSuccess (() => s.called.push ("beforeSuccess"))
                .afterSuccess (() => s.called.push ("afterSuccess"))
                .beforeComplete (() => s.called.push ("beforeComplete"))
                .afterComplete (() => s.called.push ("afterComplete"))
        ])
        .returnsResultOfExpr ("hostClass")
        .after (s => s.hostClass.onDispatch (() => s.called.push ("onDispatch")))
        .after (s => s.hostClass.DispatchChainedMethod.beforeDispatch (() => s.called.push ("returnVal") && 100))
        .after (s => s.runResult = s.hostClass.dispatch ())
        .expectingPropertyToBeOfType ("hostClass.dispatch", "function")
        .expectingPropertyToBe ("runResult", 8)
        .expectingPropertyToBe ("called",
        [
            "returnVal",
            "beforeDispatch",
            "onDispatch",
            "afterDispatch",
            "beforeSuccess",
            "afterSuccess",
            "beforeComplete",
            "afterComplete"
        ])
        .commit ()
;


test.plugin ("chained-method", "staticChainedMethod", true, { hostClass: "test.Api" })
    .should ("define a static method that throws if the chain context's error property is not null")
        .up (s => s.called = [])
        .up (s => s.args =
        [
            "dispatch",
            cls => cls
                .addChain ("failure", true)
                .addChain ("success", true)
                .addChain ("complete", true)
                .link ("dispatch", "failure", nit.CallChain.ERROR)
                .link ("dispatch", "success")
                .link ("failure", "complete")
                .link ("success", "complete")
                .beforeDispatch (() => s.called.push ("beforeDispatch"))
                .afterDispatch (() => s.called.push ("afterDispatch"))
                .beforeFailure (() => s.called.push ("beforeFailure"))
                .afterFailure (() => s.called.push ("afterFailure"))
                .beforeSuccess (() => s.called.push ("beforeSuccess"))
                .afterSuccess (() => s.called.push ("afterSuccess"))
                .beforeComplete (() => s.called.push ("beforeComplete"))
                .afterComplete (() => s.called.push ("afterComplete"))
        ])
        .returnsResultOfExpr ("hostClass")
        .after (s => s.hostClass.onDispatch (() => nit.throw ("DISPATCH_ERR") && s.called.push ("onDispatch")))
        .after (s => s.hostClass.DispatchChainedMethod.beforeDispatch (() => s.called.push ("returnVal") && 100))
        .expectingMethodToThrow ("hostClass.dispatch", null, "DISPATCH_ERR")
        .expectingPropertyToBe ("called",
        [
            "returnVal",
            "beforeDispatch",
            "beforeFailure",
            "afterFailure",
            "beforeComplete",
            "afterComplete"
        ])
        .commit ()
;


test.plugin ("chained-method", "chainedMethod", true, { hostClass: "test.Api" })
    .should ("define an instance method that will not throw if the chain context's error property is null")
        .up (s => s.called = [])
        .up (s => s.args =
        [
            "dispatch",
            cls => cls
                .addChain ("failure", true)
                .addChain ("success", true)
                .addChain ("complete", true)
                .link ("dispatch", "failure", nit.CallChain.ERROR)
                .link ("dispatch", "success")
                .link ("failure", "complete")
                .link ("success", "complete")
                .beforeDispatch (() => s.called.push ("beforeDispatch"))
                .afterDispatch (() => s.called.push ("afterDispatch"))
                .beforeFailure (() => s.called.push ("beforeFailure"))
                .afterFailure (function () { this.error = null; s.called.push ("afterFailure"); })
                .beforeSuccess (() => s.called.push ("beforeSuccess"))
                .afterSuccess (() => s.called.push ("afterSuccess"))
                .beforeComplete (() => s.called.push ("beforeComplete"))
                .afterComplete (() => s.called.push ("afterComplete"))
        ])
        .returnsResultOfExpr ("hostClass")
        .after (s => s.hostClass.onDispatch (() => nit.throw ("DISPATCH_ERR") && s.called.push ("onDispatch")))
        .after (s => s.hostClass.DispatchChainedMethod.beforeDispatch (() => s.called.push ("returnVal") && 100))
        .after (s => s.host = new s.hostClass)
        .after (s => s.runResult = s.host.dispatch ())
        .after (s => s.MyApi = s.hostClass.defineSubclass ("MyApi"))
        .after (s => s.myApiResult = s.MyApi ().dispatch ())
        .expectingPropertyToBe ("MyApi.DispatchChainedMethod.name", "MyApi.DispatchChainedMethod")
        .expectingPropertyToBe ("MyApi.DispatchChainedMethod.classChain.length", 5)
        .expectingPropertyToBe ("runResult", 6)
        .expectingPropertyToBe ("myApiResult", 12)
        .expectingPropertyToBe ("called",
        [
            "returnVal",
            "beforeDispatch",
            "beforeFailure",
            "afterFailure",
            "beforeComplete",
            "afterComplete",
            "returnVal",
            "beforeDispatch",
            "beforeFailure",
            "afterFailure",
            "beforeComplete",
            "afterComplete"
        ])
        .commit ()
;
