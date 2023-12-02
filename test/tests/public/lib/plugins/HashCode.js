const Person = nit.defineClass ("Person")
    .field ("<name>", "string")
    .field ("<age>", "integer")
;


test.plugin ("plugins.HashCode", "toPojo")
    .should ("return the value pojo")
        .returns ({})
        .expectingPropertyToBe ("host.hashCode", -986852799)
        .commit ()
;

test.plugin ("plugins.HashCode", "toPojo", { pluginArgs: ["name"], hostClass: Person, hostArgs: ["John", 10] })
    .should ("return the value pojo")
        .returns ({ age: 10, name: "John" })
        .expectingPropertyToBe ("host.hashCode", 956790341)
        .commit ()
;
