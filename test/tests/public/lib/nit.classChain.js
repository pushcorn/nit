test ("nit.classChain () returns the class chain.", () =>
{
    function A () {}
    function B () {}
    function C () {}

    nit.extend (B, A);
    nit.extend (C, B);

    expect (nit.classChain (new B)).toEqual ([B, A]);
    expect (nit.classChain (A)).toEqual ([A]);
    expect (nit.classChain (C)).toEqual ([C, B, A]);
});
