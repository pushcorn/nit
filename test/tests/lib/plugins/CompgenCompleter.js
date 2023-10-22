test.plugin ("plugins.CompgenCompleter", "defineCompgenCompleter", true)
    .should ("register a lazy completer class")
        .up (s => s.args = function (Completer)
        {
            Completer.loaded = true;
        })
        .after (s =>
        {
            let descriptor = Object.getOwnPropertyDescriptor (nit.CLASSES, "test.PluginHost.compgencompleters.Completer");

            s.lazyClass = descriptor.get && !descriptor.set;
            s.Completer = nit.CLASSES["test.PluginHost.compgencompleters.Completer"];
        })
        .expectingPropertyToBe ("lazyClass", true)
        .expectingPropertyToBe ("Completer.loaded", true)
        .commit ()
;
