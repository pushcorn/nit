test.plugin ("call-chains", "addChain", true)
    .should ("add a chain to the host class")
        .init (s => s.pluginArgs = "run")
        .given ("main")
        .after (s => s.hostClass.link ("run", "main"))
        .after (s => s.hostClass.afterMain ((_, v) => v * 10))
        .after (s => s.afterMainResults = [])
        .after (s => s.hostClass.afterMain (function ()
        {
            this.afterMain (function ()
            {
                s.afterMainResults.push (this.result);
            });
        }))
        .after (s => s.owner = new nit.Class)
        .after (s => s.forked = s.hostClass.chains.fork (s.owner))
        .after (s => s.MyHost = s.hostClass.defineSubclass ("MyHost"))
        .after (s => s.invokeResult = s.MyHost.invoke (5))
        .after (s => s.invokeResult2 = s.MyHost.invoke (new s.MyHost.Chains.Context (6)))
        .returnsResultOfExpr ("hostClass")
        .expectingPropertyToBeOfType ("hostClass.chains.main", "nit.CallChain")
        .expectingPropertyToBeOfType ("hostClass.chains.run", "nit.CallChain")
        .expectingPropertyToBeOfType ("forked.main.calls.1", "nit.CallChain.Call")
        .expectingPropertyToBeOfType ("MyHost.chains.main.calls.1", "nit.CallChain.Call")
        .expectingPropertyToBe ("invokeResult.result", 50)
        .expectingPropertyToBe ("invokeResult2.result", 60)
        .expectingPropertyToBe ("afterMainResults", [50, 60])
        .expecting ("the forked chains have the same owner", s => s.forked.main.owner == s.owner && s.forked.run.owner == s.owner)
        .commit ()
;


test.plugin ("call-chains", "link", true)
    .should ("add a link for between 2 chains")
        .up (s => s.hostClass
            .addChain ("run")
            .addChain ("failure", true)
            .addChain ("success", true)
            .addChain ("complete")
            .afterRun (function ()
            {
                nit.throw ("AFTER_RUN_ERR");
            })
            .beforeFailure (function ()
            {
                s.rollbacked = true;
            })
            .afterComplete (function ()
            {
                if (this.error)
                {
                    throw this.error;
                }
            })
        )
        .given ("run", "failure", nit.CallChain.ERROR)
        .after (s => s.hostClass
            .link ("run", "success")
            .link ("failure", "complete")
            .link ("success", "complete")
        )
        .expectingMethodToThrow ("hostClass.invoke", null, "AFTER_RUN_ERR")
        .expectingPropertyToBe ("rollbacked", true)
        .commit ()
;


test.plugin ("call-chains", "link", true)
    .should ("add a link for between 2 chains")
        .up (s => s.hostClass
            .do ("Chains", Chains => Chains.field ("va", "integer"))
            .addChain ("run")
            .addChain ("failure", true)
            .addChain ("success", true)
            .addChain ("complete")
            .beforeRun (function ()
            {
                s.beginTx = true;
            })
            .afterRun (function ()
            {
                s.commitTx = true;

                return 100;
            })
            .beforeFailure (function ()
            {
                s.rollbacked = true;
            })
            .beforeSuccess (function ()
            {
                s.succ = true;
            })
            .afterComplete (function ()
            {
                if (this.error)
                {
                    throw this.error;
                }
            })
        )
        .given ("run", "failure", nit.CallChain.ERROR)
        .after (s => s.hostClass
            .link ("run", "success")
            .link ("failure", "complete")
            .link ("success", "complete")
        )
        .expectingMethodToReturnValueContaining ("hostClass.invoke", null, { result: 100 })
        .expectingPropertyToBe ("beginTx", true)
        .expectingPropertyToBe ("commitTx", true)
        .expectingPropertyToBe ("succ", true)
        .expectingPropertyToBe ("rollbacked", undefined)
        .commit ()
;
