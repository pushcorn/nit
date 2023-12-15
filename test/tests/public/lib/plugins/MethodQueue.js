test.plugin ("plugins.MethodQueue", "methodQueue", true)
    .should ("create a method queue")
        .given ("init")
        .returnsResultOfExpr ("hostClass")
        .up (s => s.initCount = 0)
        .after (s => s.hostClass.InitQueue
            .step ("invokeHook", function ()
            {
                let q = this;
                let cls = q.owner.constructor;

                return cls.invokeClassChainMethod ([q.owner, cls.kInit], q.args, true);
            })
        )
        .after (s => s.hostClass
            .onInit (function ()
            {
                s.initCount++;
            })
            .onInit (function (v)
            {
                s.initCount++;

                return v * 2;
            })
        )
        .after (s => s.host = new s.hostClass)
        .expectingMethodToReturnValue ("host.init", 100, 200)
        .expectingPropertyToBe ("initCount", 2)
        .commit ()
;


test.plugin ("plugins.MethodQueue", "staticMethodQueue", true)
    .should ("create a method queue")
        .given ("init")
        .returnsResultOfExpr ("hostClass")
        .up (s => s.initCount = 0)
        .after (s => s.hostClass.InitQueue
            .step ("invokeHook", function ()
            {
                let q = this;
                let cls = q.owner;

                return cls.invokeClassChainMethod ([cls, cls.kInit], q.args, true);
            })
        )
        .after (s => s.hostClass
            .onInit (function ()
            {
                s.initCount++;
            })
            .onInit (function (v)
            {
                s.initCount++;

                return v * 2;
            })
        )
        .expectingMethodToReturnValue ("hostClass.init", 100, 200)
        .expectingPropertyToBe ("initCount", 2)
        .commit ()
;


test.plugin ("plugins.MethodQueue", "subclassMethodQueue", true)
    .should ("create a subclass of parent's method queue")
        .up (s => s.hostClass.methodQueue ("init", Queue =>
        {
            Queue.push ("init1");
        }))
        .up (s => s.hostClass = s.hostClass.defineSubclass ("MyHost"))
        .given ("init")
        .returnsResultOfExpr ("hostClass")
        .expectingPropertyToBe ("hostClass.name", "MyHost")
        .expectingPropertyToBe ("hostClass.InitQueue.classChain.length", 5)
        .expectingPropertyToBe ("hostClass.InitQueue.tasks.length", 1)
        .commit ()
;
