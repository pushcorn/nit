test ("nit.compgen.Completer", () =>
{
    const completer = nit.new ("nit.compgen.Completer");

    expect (completer.completeForRedirect ()).toBeUndefined ();
    expect (completer.completeForType ()).toBeUndefined ();
    expect (completer.completeForConstraint ()).toBeUndefined ();
});
