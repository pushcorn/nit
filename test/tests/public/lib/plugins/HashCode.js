const Person = nit.defineClass ("Person")
    .field ("<name>", "string")
    .field ("<age>", "integer")
;


test.method ("plugins.HashCode", "onUsePlugin", true)
    .should ("add the hashCode getter to the host class")
        .given (Person, nit.new ("plugins.HashCode"))
        .after (s => s.person = new Person ("John Doe", 55))
        .expectingPropertyToBe ("person.hashCode", 1622029782)
        .commit ()

    .can ("hash only the specifed fields")
        .given (Person, nit.new ("plugins.HashCode", "age"))
        .after (s => s.person = new Person ("John Doe", 56))
        .expectingPropertyToBe ("person.hashCode", 1703114347)
        .commit ()
;
