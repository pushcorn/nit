test ("nit.new () creates an instance of object for specified class and constructor args.", () =>
{
    function MyClass (first, sec)
    {
        this.first = first;
        this.sec = sec;
    }

    let obj = nit.new (MyClass, ["a", 2]);

    expect (obj).toBeInstanceOf (MyClass);
    expect (obj).toEqual ({ first: "a", sec: 2 });

    let obj2 = nit.new (MyClass, "b", 3);
    expect (obj2).toEqual ({ first: "b", sec: 3 });

    nit.registerClass (MyClass);

    let obj3 = nit.new ("MyClass", "d", 4);
    expect (obj3).toEqual ({ first: "d", sec: 4 });

    expect (() => nit.new ("MyClass2", "d", 4)).toThrow (/MyClass2.*was not defined/);
});
