test.plugin ("plugins.LifecycleComponent", "componentMethod", true, { pluginArgs: "init" })
    .should ("add a component method")
        .up (s => s.called = [])
        .given ("start")
        .after (s => s.pluginClass = s.hostClass.Plugin.defineSubclass ("MyPlugin")
            .onPreStart ((o, { callArgs }) => callArgs.push ("preStartPlugin") && s.called.push ("preStartPlugin"))
            .onPostStart ((o, { callArgs }) => callArgs.push ("postStartPlugin") && s.called.push ("postStartPlugin"))
            .onStart ((o, { callArgs }) => callArgs.push ("startPlugin") && s.called.push ("startPlugin"))
        )
        .after (s => s.hostClass
            .onPreStart (({ callArgs }) => callArgs.push ("preStartHook") && s.called.push ("preStartHook"))
            .onPostStart (({ callArgs }) => callArgs.push ("postStartHook") && s.called.push ("postStartHook"))
            .onStart (({ callArgs }) => callArgs.push ("startHook") && s.called.push ("startHook"))
            .pluginhostplugin (new s.pluginClass)
        )
        .after (s => s.host = new s.hostClass)
        .after (s => s.host.on ("preStart", (o, { callArgs }) => callArgs.push ("preStartListener") && s.called.push ("preStartListener")))
        .after (s => s.host.on ("postStart", (o, { callArgs }) => callArgs.push ("postStartListener") && s.called.push ("postStartListener")))
        .after (s => s.host.on ("start", (o, { callArgs }) => callArgs.push ("startListener") && s.called.push ("startListener")))
        .after (s => s.host.on ("init", (o, { callArgs }) => callArgs.push ("initListener") && s.called.push ("initListener")))
        .after (s => s.callArgs = [])
        .after (s => s.host.init ({ callArgs: s.callArgs }))
        .after (s => s.host.start ({ callArgs: s.callArgs }))
        .expectingPropertyToBe ("called",
        [
            "initListener",
            "preStartHook",
            "preStartPlugin",
            "preStartListener",
            "startHook",
            "startPlugin",
            "startListener",
            "postStartHook",
            "postStartPlugin",
            "postStartListener"
        ])
        .expectingPropertyToBe ("callArgs",
        [
            "initListener",
            "preStartHook",
            "preStartPlugin",
            "preStartListener",
            "startHook",
            "startPlugin",
            "startListener",
            "postStartHook",
            "postStartPlugin",
            "postStartListener"
        ])
        .commit ()
;


test.plugin ("plugins.LifecycleComponent", "run", { hostClass: "test.MyTask", pluginArgs: "run" })
    .should ("invoke hook method")
        .up (s => s.configured = [])
        .up (s => s.hostClass.onRun (function () { s.configured.push ("MyTask"); }))
        .up (s => s.myPlugin = test.defineMyTaskPlugin ("MyPlugin")
            .onRun (() => s.configured.push ("MyPlugin"))
        )
        .up (s => s.hostClass.mytaskplugin ("test:my-plugin"))

        .up (s => s.hostClass = s.hostClass.defineSubclass ("test.ChildTask")
            .defineComponentPlugin ()
        )
        .up (s => s.childPlugin = test.defineChildTaskPlugin ("ChildPlugin")
            .onRun (() => s.configured.push ("ChildPlugin"))
        )
        .up (s => s.hostClass.onRun (function () { s.configured.push ("ChildTask"); }))
        .up (s => s.hostClass.childtaskplugin ("test:child-plugin"))

        .expectingPropertyToBe ("configured", ["ChildTask", "MyPlugin", "ChildPlugin"])
        .expectingPropertyToBe ("hostClass.Plugin.name", "test.ChildTaskPlugin")
        .expectingPropertyToBe ("hostClass.Plugin.CATEGORY", "childtaskplugins")
        .commit ()
;


test.plugin ("plugins.LifecycleComponent", "run", { hostClass: "Unwrapped", pluginArgs: ["run", {  wrapped: false }] })
    .should ("invoke the hook method")
        .up (s => s.configured = [])
        .up (s => s.hostClass.onRun (function () { s.configured.push ("MyTask"); }))
        .up (s => s.hostClass = s.hostClass.defineSubclass ("ChildTask"))
        .up (s => s.hostClass.onRun (function () { s.configured.push ("ChildTask"); }))
        .up (s => s.hostClass.on ("preRun", () => s.preRunCalled = true))
        .expectingPropertyToBe ("configured", ["ChildTask"])
        .expectingPropertyToBe ("preRunCalled", undefined)
        .expectingMethodToReturnValue ("host.preRun")
        .expectingPropertyToBe ("preRunCalled", true)
        .commit ()

    .should ("log the error for safe queue tasks")
        .up (s => s.configured = [])
        .up (s => s.hostClass.configureComponentMethod ("run", Queue =>
        {
            Queue.before ("run.invokeHook", "run.throwError", true, () => nit.throw ("RUN_ERR"));
        }))
        .up (s => s.hostClass.onRun (function () { s.configured.push ("MyTask"); }))
        .mock (nit.log, "e")
        .expectingPropertyToBe ("configured", ["MyTask"])
        .expectingPropertyToBe ("mocks.0.invocations.0.args.0", /RUN_ERR/)
        .commit ()
;


test.plugin ("plugins.LifecycleComponent", "run", { hostClass: "Instance", pluginArgs: ["run", {  instancePluginAllowed: true }] })
    .should ("invoke instance plugins")
        .up (s => s.invoked = [])
        .up (s => s.MyInstancePlugin = s.hostClass.Plugin.defineSubclass ("MyInstancePlugin")
            .onPreRun ((o, { invoked }) => invoked.push ("preRunPlugin"))
            .onPostRun ((o, { invoked }) => invoked.push ("postRunPlugin"))
            .onRun ((o, { invoked }) => invoked.push ("runPlugin"))
        )
        .up (s => s.args = { invoked: s.invoked })
        .before (s => s.host.instanceplugins.push (new s.MyInstancePlugin))
        .expectingPropertyToBe ("host.instanceplugins.length", 1)
        .expectingPropertyToBe ("invoked", ["preRunPlugin", "runPlugin", "postRunPlugin"])
        .commit ()
;


test.plugin ("plugins.LifecycleComponent", "componentMethod", true, { pluginArgs: { prePost: false } })
    .should ("not create the pre- & post- methods if prePost is false")
        .given ("start")
        .after (s => s.host = new s.hostClass)
        .expectingPropertyToBe ("host.preStart", undefined)
        .expectingPropertyToBe ("host.postStart", undefined)
        .expectingPropertyToBeOfType ("host.start", "function")
        .commit ()
;


test.plugin ("plugins.LifecycleComponent", "configureComponentMethods", true, { pluginArgs: "init" })
    .should ("call the configurator with the method queue and method name")
        .up (s => s.calledMethods = [])
        .up (s => s.args = ["init", true, (Queue, method) => s.calledMethods.push (method)])
        .expectingPropertyToBe ("calledMethods", ["preInit", "init", "postInit"])
        .commit ()

    .reset ()
        .up (s => s.calledMethods = [])
        .up (s => s.args = ["init", (Queue, method) => s.calledMethods.push (method)])
        .expectingPropertyToBe ("calledMethods", ["init"])
        .commit ()

    .should ("throw if the component method was not defined")
        .up (s => s.args = "start")
        .throws ("error.component_method_not_defined")
        .commit ()
;


test.plugin ("plugins.LifecycleComponent", "configureComponentMethod", true, { pluginArgs: "init" })
    .should ("call the configurator with the method queue and method name")
        .up (s => s.calledMethods = [])
        .up (s => s.args = ["init", true, (Queue, method) => s.calledMethods.push (method)])
        .expectingPropertyToBe ("calledMethods", ["preInit", "init", "postInit"])
        .commit ()
;


test.plugin ("plugins.LifecycleComponent", "defineComponentPlugin", true, { hostClass: "aaa.Api", pluginArgs: "run" })
    .should ("define the component plugin for the subclass")
        .up (s => s.hostClass = s.hostClass.defineSubclass ("bbb.Handler"))
        .up (s => s.classes = nit.CLASSES)
        .up (s => s.nit = nit)
        .expectingPropertyToBe ("hostClass.Plugin.name", "bbb.HandlerPlugin")
        .expectingPropertyToBe ("hostClass.superclass.Plugin.name", "aaa.ApiPlugin")
        .expectingPropertyToBeOfType ("classes.bbb\\.HandlerPlugin", "function")
        .expectingPropertyToBeOfType ("nit.NS.bbb.defineHandlerPlugin", "function")
        .commit ()
;

test.plugin ("plugins.LifecycleComponent", "defineComponentPlugin", true, { hostClass: "aaa.Api", pluginArgs: "run" })
    .should ("not register the the component plugin if category is the same as that of its parent class plugin")
        .up (s => s.hostClass = s.hostClass.defineSubclass ("bbb.Api"))
        .up (s => s.classes = nit.CLASSES)
        .up (s => s.nit = nit)
        .expectingPropertyToBe ("hostClass.Plugin.name", "aaa.ApiPlugin")
        .expectingPropertyToBe ("hostClass.superclass.Plugin.name", "aaa.ApiPlugin")
        .expectingPropertyToBeOfType ("classes.bbb\\.ApiPlugin", "function")
        .expectingPropertyToBeOfType ("nit.NS.bbb.defineApiPlugin", "function")
        .commit ()
;



